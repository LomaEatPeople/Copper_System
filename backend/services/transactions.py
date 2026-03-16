import sqlite3
import os
from fastapi import UploadFile, File
from datetime import datetime, timedelta

TRANSACTION_TYPE_BUY = "buy"
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
            TRANSACTION_TYPE_BUY,
            th_time  # <--- ส่งเวลาไทยที่เราสร้างไว้เข้าไป
        ))

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
    """ยืนยันบิลและบันทึกยอดรวมสุดท้าย"""
    total = calculate_total_cost(transaction_id)

    with sqlite3.connect("parinya.db") as conn:
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE transactions
            SET total_cost = ?, status = 'confirmed'
            WHERE transaction_id = ?
        """, (total, transaction_id))
        conn.commit()
        return {"message": "Transaction confirmed", "total_cost": total}
    
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

    path = f"{UPLOAD_DIR}/transaction_{id}_{file.filename}"

    with open(path, "wb") as f:
        f.write(file.file.read())

    with sqlite3.connect("parinya.db") as conn:
        cursor = conn.cursor()

        cursor.execute("""
        INSERT INTO transaction_images (transaction_id, image_url)
        VALUES (?, ?)
        """, (id, path))

        conn.commit()

    return {
        "message": "Image uploaded",
        "image_url": path
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