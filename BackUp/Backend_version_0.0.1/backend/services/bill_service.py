import sqlite3
from datetime import datetime
from init_db import get_conn
from services.item_service import get_latest_price

DB_NAME = "parinya.db"

def create_empty_bill(cashier_id: int):
    conn = get_conn()
    cur = conn.cursor()

    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    cur.execute("""
        INSERT INTO bills (cashier_id, created_at, total_amount, status)
        VALUES (?, ?, 0, 'OPEN')
    """, (cashier_id, now))

    bill_id = cur.lastrowid
    conn.commit()
    conn.close()

    return bill_id

def add_weigh_to_bill(bill_id: int, weigh_record_id: int):
    conn = get_conn()
    cur = conn.cursor()

    try:
        conn.execute("BEGIN")

        # ---- เช็กว่าบิลมีจริง + ยังเปิดอยู่ ----
        cur.execute("""
            SELECT status FROM bills WHERE id = ?
        """, (bill_id,))
        row = cur.fetchone()

        if not row:
            raise ValueError("Bill not found")

        if row[0] != "OPEN":
            raise ValueError("Cannot add items to closed or cancelled bill")

        # ---- ดึงข้อมูลการชั่ง ----
        cur.execute("""
            SELECT item_price_id, weight_kg, total_price, bill_id
            FROM weigh_records
            WHERE id = ?
        """, (weigh_record_id,))

        row = cur.fetchone()
        if not row:
            raise ValueError("Weigh record not found")

        item_price_id, weight_kg, total_price, existing_bill = row

        # ป้องกันผูกซ้ำ
        if existing_bill is not None:
            raise ValueError("This weigh record already belongs to another bill")

        # ---- ผูกเข้าบิล ----
        cur.execute("""
            INSERT INTO bills_items
            (bill_id, item_price_id, weight_kg, total_price)
            VALUES (?, ?, ?, ?)
        """, (bill_id, item_price_id, weight_kg, total_price))

        # อัปเดต weigh_records
        cur.execute("""
            UPDATE weigh_records
            SET bill_id = ?
            WHERE id = ?
        """, (bill_id, weigh_record_id))

        conn.commit()

    except Exception as e:
        conn.rollback()
        conn.close()
        raise e

    conn.close()

def finalize_bill(bill_id: int):
    conn = get_conn()
    cur = conn.cursor()

    try:
        conn.execute("BEGIN")

        # เช็กสถานะ
        cur.execute("SELECT status FROM bills WHERE id = ?", (bill_id,))
        row = cur.fetchone()
        if not row:
            raise ValueError("Bill not found")

        if row[0] != "OPEN":
            raise ValueError("Only OPEN bill can be finalized")

        # คำนวณยอดรวม
        cur.execute("""
            SELECT SUM(total_price)
            FROM bills_items
            WHERE bill_id = ?
        """, (bill_id,))

        total = cur.fetchone()[0] or 0
        printed_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        # ปิดบิล + เปลี่ยนสถานะ
        cur.execute("""
            UPDATE bills
            SET total_amount = ?,
                printed_at = ?,
                status = 'FINALIZED'
            WHERE id = ?
        """, (total, printed_at, bill_id))

        conn.commit()
        return total

    except Exception as e:
        conn.rollback()
        conn.close()
        raise e

    finally:
        conn.close()

def get_bill_details(bill_id: int):
    conn = get_conn()
    cur = conn.cursor()

    cur.execute("""
        SELECT id, cashier_id, created_at, printed_at, total_amount
        FROM bills
        WHERE id = ?
    """, (bill_id,))

    bill = cur.fetchone()
    if not bill:
        conn.close()
        raise ValueError("Bill not found")

    cur.execute("""
        SELECT
            bi.id,
            ct.name,
            bi.weight_kg,
            ip.price_per_kg,
            bi.total_price
        FROM bills_items bi
        JOIN item_prices ip ON bi.item_price_id = ip.id
        JOIN item_types ct ON ip.item_type_id = ct.id
        WHERE bi.bill_id = ?
    """, (bill_id,))

    items = cur.fetchall()
    conn.close()

    return {
        "bill": {
            "bill_id": bill[0],
            "cashier_id": bill[1],
            "created_at": bill[2],
            "printed_at": bill[3],
            "total_amount": bill[4],
        },
        "items": [
            {
                "bill_item_id": r[0],
                "item_type": r[1],
                "weight_kg": r[2],
                "price_per_kg": r[3],
                "total_price": r[4],
            }
            for r in items
        ]
    }

def cancel_bill(bill_id: int):
    conn = get_conn()
    cur = conn.cursor()

    try:
        conn.execute("BEGIN")

        cur.execute("SELECT status FROM bills WHERE id = ?", (bill_id,))
        row = cur.fetchone()
        if not row:
            raise ValueError("Bill not found")

        # ลบรายการในบิล
        cur.execute("DELETE FROM bills_items WHERE bill_id = ?", (bill_id,))

        # ปลดผูกการชั่ง
        cur.execute("""
            UPDATE weigh_records
            SET bill_id = NULL
            WHERE bill_id = ?
        """, (bill_id,))

        # ทำเครื่องหมายยกเลิก
        cur.execute("""
            UPDATE bills
            SET total_amount = 0,
                printed_at = NULL,
                status = 'CANCELLED'
            WHERE id = ?
        """, (bill_id,))

        conn.commit()

    except Exception as e:
        conn.rollback()
        conn.close()
        raise e

    conn.close()

def get_bill_history(limit: int = 20):
    conn = get_conn()
    cur = conn.cursor()

    cur.execute("""
        SELECT id, cashier_id, created_at, printed_at, total_amount
        FROM bills
        ORDER BY created_at DESC
        LIMIT ?
    """, (limit,))

    rows = cur.fetchall()
    conn.close()

    return [
        {
            "bill_id": r[0],
            "cashier_id": r[1],
            "created_at": r[2],
            "printed_at": r[3],
            "total_amount": r[4],
        }
        for r in rows
    ]
