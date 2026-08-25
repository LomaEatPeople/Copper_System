import sqlite3
import shutil
import os
from decimal import Decimal
from fastapi import UploadFile, File
from datetime import datetime, timedelta

TRANSACTION_TYPE_BUY = "buy"
TRANSACTION_TYPE_SELL = "sell"
UPLOAD_DIR = "uploads"

def status_checker(transaction_id):

    with sqlite3.connect("parinya.db") as conn:
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        cursor.execute("""
        SELECT status
        FROM transactions
        WHERE transaction_id = ?
        """, (transaction_id,))

        tx = cursor.fetchone()

        if not tx:
            return {"error": "Transaction not found"}

        return tx["status"]
    
def ensure_draft(transaction_id):
    status = status_checker(transaction_id)
    if status != "draft":
        raise Exception("Transaction already confirmed")

def get_transactions():

    with sqlite3.connect("parinya.db") as conn:
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        cursor.execute("""
            SELECT * FROM transactions 
            ORDER BY transaction_date DESC
        """)

        rows = cursor.fetchall()

        return [dict(row) for row in rows]
    
def create_transaction(transaction):
    th_time = (datetime.utcnow() + timedelta(hours=7)).strftime("%Y-%m-%d %H:%M:%S")

    with sqlite3.connect("parinya.db") as conn:
        cursor = conn.cursor()

        cursor.execute("""
        INSERT INTO transactions (user_id, transaction_type, status, total_cost, transaction_date)
        VALUES (?, ?, 'draft', 0, ?)
        """, (
            transaction.user_id,
            transaction.transaction_type,
            th_time
        ))

        conn.commit() # อย่าลืม commit ด้วยนะจ๊ะเพื่อความชัวร์
        return cursor.lastrowid
    
def update_transaction_status(transaction_id, new_status):

    with sqlite3.connect("parinya.db") as conn:
        cursor = conn.cursor()

        cursor.execute("""
        UPDATE transactions
        SET status = ?
        WHERE transaction_id = ?
        """, (new_status, transaction_id))

        return cursor.rowcount

def delete_transaction(transaction_id, confirm=False):

    status = status_checker(transaction_id)

    if status == "confirmed" and not confirm:
        return {
            "warning": "Transaction is confirmed. Send confirm=true to delete"
        }

    with sqlite3.connect("parinya.db") as conn:
        cursor = conn.cursor()

        cursor.execute("""
        DELETE FROM transactions
        WHERE transaction_id = ?
        """, (transaction_id,))

        return {"message": "Transaction deleted"}

def add_transaction_item(transaction_id, item_id, weight):
    ensure_draft(transaction_id)
    with sqlite3.connect("parinya.db") as conn:
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        # 1. ไปดึงชื่อสินค้าจากตาราง items มาก่อน (เพราะในตาราง ti ต้องการ item_name)
        cursor.execute("SELECT item_name FROM items WHERE item_id = ?", (item_id,))
        item_row = cursor.fetchone()
        name_from_db = item_row["item_name"] if item_row else "Unknown"

        # 2. เช็คว่ามีสินค้าตัวนี้ในบิลหรือยัง
        cursor.execute("""
            SELECT id, weight FROM transaction_items 
            WHERE transaction_id = ? AND item_id = ?
        """, (transaction_id, item_id))
        existing = cursor.fetchone()

        if existing:
            new_weight = existing["weight"] + weight
            cursor.execute("UPDATE transaction_items SET weight = ? WHERE id = ?", (new_weight, existing["id"]))
            return {"message": "Weight merged", "new_weight": new_weight}
        else:
            # 3. ใส่ item_name เข้าไปด้วยตอน Insert (ตามที่ Schema ตารางต้องการ)
            cursor.execute("""
                INSERT INTO transaction_items (transaction_id, item_id, item_name, weight)
                VALUES (?, ?, ?, ?)
            """, (transaction_id, item_id, name_from_db, weight))
            return {"message": "Item added", "weight": weight}

def update_item_price(transaction_id, item_id, new_price):

    ensure_draft(transaction_id)

    with sqlite3.connect("parinya.db") as conn:
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        cursor.execute("""
        UPDATE transaction_items
        SET price_per_kg = ?
        WHERE transaction_id = ? AND item_id = ?
        """, (new_price, transaction_id, item_id))

        if cursor.rowcount == 0:
            return None

        cursor.execute("""
        SELECT ti.transaction_id, ti.item_id, ti.price_per_kg, i.item_name
        FROM transaction_items ti
        JOIN items i ON ti.item_id = i.item_id
        WHERE ti.transaction_id = ? AND ti.item_id = ?
        """, (transaction_id, item_id))

        return dict(cursor.fetchone())
    
def calculate_total_cost(transaction_id):
    """ฟังก์ชันกลางสำหรับคำนวณยอดรวมจากรายการสินค้า"""
    with sqlite3.connect("parinya.db") as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT SUM(weight * price_per_kg)
            FROM transaction_items
            WHERE transaction_id = ?
        """, (transaction_id,))
        
        total = cursor.fetchone()[0]
        return total if total else 0
    
def update_item_price_and_sync_total(transaction_id, item_id, new_price):
    """อัปเดตราคาและนำยอดรวมไปบันทึกลงตาราง transactions ทันที"""
    ensure_draft(transaction_id) # เพิ่มความปลอดภัยเช็ค status ก่อน
    with sqlite3.connect("parinya.db") as conn:
        cursor = conn.cursor()

        # 1. อัปเดตราคาต่อหน่วย
        cursor.execute("""
            UPDATE transaction_items
            SET price_per_kg = ?
            WHERE transaction_id = ? AND item_id = ?
        """, (new_price, transaction_id, item_id))

        # 2. คำนวณยอดรวมใหม่ (เรียกใช้ฟังก์ชันกลาง)
        new_total = calculate_total_cost(transaction_id)

        # 3. ซิงค์ยอดรวมไปที่ตารางหลัก (transactions)
        cursor.execute("""
            UPDATE transactions
            SET total_cost = ?
            WHERE transaction_id = ?
        """, (new_total, transaction_id))

        conn.commit()
        return {"status": "success", "new_total": new_total}
    
def confirm_transaction(transaction_id):
    """ยืนยันบิล, รัน FIFO offset สำหรับ SELL, บันทึกยอดรวมสุดท้าย"""
    ensure_draft(transaction_id)

    # isolation_level=None = autocommit off; we manage BEGIN/COMMIT manually
    conn = sqlite3.connect("parinya.db", isolation_level=None)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    try:
        # BEGIN IMMEDIATE = SQLite write-lock; blocks concurrent SELL confirms
        cursor.execute("BEGIN IMMEDIATE")

        # 1. Fetch transaction header
        cursor.execute(
            "SELECT transaction_type FROM transactions WHERE transaction_id = ?",
            (transaction_id,)
        )
        tx = cursor.fetchone()
        if not tx:
            raise ValueError("Transaction not found")
        tx_type = tx["transaction_type"].lower()

        # 2. Calculate total using Decimal to avoid float errors
        cursor.execute(
            "SELECT id, item_id, weight, price_per_kg FROM transaction_items WHERE transaction_id = ?",
            (transaction_id,)
        )
        items = cursor.fetchall()
        total = sum(
            Decimal(str(row["weight"])) * Decimal(str(row["price_per_kg"] or 0))
            for row in items
        )

        # 3a. BUY confirmation — activate items for future SELL offsetting
        if tx_type == TRANSACTION_TYPE_BUY:
            cursor.execute("""
                UPDATE transaction_items
                SET quantity_remaining = weight,
                    cut_status = 'OPEN'
                WHERE transaction_id = ?
            """, (transaction_id,))

        # 3b. SELL confirmation — FIFO deduction against open BUY items (last 30 days)
        elif tx_type == TRANSACTION_TYPE_SELL:
            for sell_item in items:
                sell_item_id   = sell_item["id"]
                item_id_val    = sell_item["item_id"]
                remaining_sell = Decimal(str(sell_item["weight"]))

                # Fetch eligible BUY items: same item, confirmed, last 30 days, FIFO
                cursor.execute("""
                    SELECT ti.id, ti.quantity_remaining
                    FROM transaction_items ti
                    JOIN transactions t ON ti.transaction_id = t.transaction_id
                    WHERE ti.item_id = ?
                      AND t.transaction_type = ?
                      AND t.status = 'confirmed'
                      AND ti.quantity_remaining > 0
                      AND t.transaction_date >= datetime('now', '-30 days', 'localtime')
                    ORDER BY t.transaction_date ASC
                """, (item_id_val, TRANSACTION_TYPE_BUY))
                buy_rows = cursor.fetchall()

                for buy_row in buy_rows:
                    if remaining_sell <= Decimal("0"):
                        break

                    buy_item_id   = buy_row["id"]
                    buy_remaining = Decimal(str(buy_row["quantity_remaining"]))
                    deduct        = min(buy_remaining, remaining_sell)
                    new_remaining = buy_remaining - deduct

                    new_cut_status = "CLOSED" if new_remaining == Decimal("0") else "PARTIAL"

                    cursor.execute("""
                        UPDATE transaction_items
                        SET quantity_remaining = ?,
                            cut_status = ?
                        WHERE id = ?
                    """, (str(new_remaining), new_cut_status, buy_item_id))

                    cursor.execute("""
                        INSERT INTO sell_buy_offsets (sell_item_id, buy_item_id, quantity_offset)
                        VALUES (?, ?, ?)
                    """, (sell_item_id, buy_item_id, str(deduct)))

                    remaining_sell -= deduct

                if remaining_sell > Decimal("0"):
                    raise ValueError(
                        f"Insufficient BUY stock for item_id={item_id_val}. "
                        f"Short by {remaining_sell} kg within the last 30 days."
                    )

        # 4. Confirm the transaction itself
        cursor.execute("""
            UPDATE transactions
            SET total_cost = ?, status = 'confirmed'
            WHERE transaction_id = ?
        """, (str(total), transaction_id))

        cursor.execute("COMMIT")
        return {"message": "Transaction confirmed", "total_cost": float(total)}

    except Exception as exc:
        cursor.execute("ROLLBACK")
        raise exc

    finally:
        conn.close()
    
def calculate_transaction_total(transaction_id):
    return calculate_total_cost(transaction_id)

def get_transaction(transaction_id):

    with sqlite3.connect("parinya.db") as conn:
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        cursor.execute("""
        SELECT * FROM transactions
        WHERE transaction_id = ?
        """, (transaction_id,))

        row = cursor.fetchone()

        return dict(row) if row else None
    
def get_transaction_with_items(transaction_id):
    with sqlite3.connect("parinya.db") as conn:
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        # ดึง Transaction
        cursor.execute("SELECT * FROM transactions WHERE transaction_id = ?", (transaction_id,))
        transaction = cursor.fetchone()
        if not transaction: return None

        # แก้ตรงนี้: JOIN กับตาราง items เพื่อเอา item_name มาแสดงผล
        cursor.execute("""
            SELECT 
                ti.*, 
                i.item_name 
            FROM transaction_items ti
            LEFT JOIN items i ON ti.item_id = i.item_id
            WHERE ti.transaction_id = ?
        """, (transaction_id,))

        items = cursor.fetchall()
        
        return {
            "transaction": dict(transaction),
            "items": [dict(i) for i in items]
        }
    
def get_transaction_items(transaction_id):

    with sqlite3.connect("parinya.db") as conn:
        cursor = conn.cursor()

        cursor.execute("""
        SELECT * FROM transaction_items
        WHERE transaction_id = ?
        """, (transaction_id,))

        return cursor.fetchall()
    
def calculate_transaction_total(transaction_id):

    with sqlite3.connect("parinya.db") as conn:
        cursor = conn.cursor()

        cursor.execute("""
        SELECT SUM(weight * price_per_kg)
        FROM transaction_items
        WHERE transaction_id = ?
        """, (transaction_id,))

        total = cursor.fetchone()[0]

        return total if total else 0    
def remove_transaction_item(transaction_id, item_id):

    ensure_draft(transaction_id)

    with sqlite3.connect("parinya.db") as conn:
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        # ดึงชื่อ item
        cursor.execute("""
        SELECT item_name FROM items WHERE item_id = ?
        """, (item_id,))
        
        item = cursor.fetchone()

        if not item:
            return {"error": "Item not found"}

        item_name = item["item_name"]

        # ลบ item จาก transaction
        cursor.execute("""
        DELETE FROM transaction_items
        WHERE transaction_id = ? AND item_id = ?
        """, (transaction_id, item_id))

        if cursor.rowcount == 0:
            return {"error": "Transaction item not found"}

        return {"message": f"Item {item_name} removed from transaction"}
    
def upload_transaction_image(id: int, file: UploadFile = File(...)):
    os.makedirs(UPLOAD_DIR, exist_ok=True)

    safe_filename = f"trans_{id}_{file.filename.replace(' ', '_')}"
    path = f"{UPLOAD_DIR}/{safe_filename}"

    image_url = f"/{path}"

    with open(path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    with sqlite3.connect("parinya.db") as conn:
        cursor = conn.cursor()
        cursor.execute("""
        INSERT INTO transaction_images (transaction_id, image_url)
        VALUES (?, ?)
        """, (id, image_url)) # เก็บ URL แทน Path ในเครื่อง
        conn.commit()

    return {
        "message": "Image uploaded successfully",
        "image_url": image_url
    }
    
def get_transaction_images(transaction_id):

    with sqlite3.connect("parinya.db") as conn:
        cursor = conn.cursor()

        cursor.execute("""
        SELECT image_id, image_url
        FROM transaction_images
        WHERE transaction_id = ?
        """, (transaction_id,))

        rows = cursor.fetchall()

        images = []
        for row in rows:
            images.append({
                "image_id": row[0],
                "image_url": row[1]
            })

        return images

def check_image_requirement(transaction_id: int):
    with sqlite3.connect("parinya.db") as conn:
        cursor = conn.cursor()

        cursor.execute("""
            SELECT COUNT(*) 
            FROM transaction_items ti
            JOIN items i ON ti.item_id = i.item_id
            JOIN categories c ON i.category_id = c.category_id
            WHERE ti.transaction_id = ? AND c.require_image = 1
        """, (transaction_id,))
        
        needs_image = cursor.fetchone()[0] > 0

        if needs_image:
            cursor.execute("SELECT COUNT(*) FROM transaction_images WHERE transaction_id = ?", (transaction_id,))
            has_image = cursor.fetchone()[0] > 0
            return needs_image and not has_image # คืนค่า True ถ้า "ต้องการแต่ยังไม่มี" (คือต้องล็อค!)
            
        return False # ไม่ต้องล็อค
    
def delete_transaction_image(transaction_id: int, image_id: int): 
    with sqlite3.connect("parinya.db") as conn:
        cursor = conn.cursor()
    
    # ลบโดยเช็คทั้ง ID บิล และ ID รูป เพื่อความปลอดภัย
        cursor.execute(
            "DELETE FROM transaction_images WHERE image_id = ? AND transaction_id = ?", 
            (image_id, transaction_id)
        )
        conn.commit()
    return {"status": "success"}