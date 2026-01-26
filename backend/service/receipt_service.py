import sqlite3
from datetime import datetime

DB_NAME = "copper.db"


def create_receipt(weigh_record_id: int):
    conn = sqlite3.connect(DB_NAME)
    cur = conn.cursor()

    # ดึงข้อมูลจาก weigh_records (ห้ามคำนวณใหม่)
    cur.execute("""
        SELECT total_price
        FROM weigh_records
        WHERE id = ?
    """, (weigh_record_id,))

    row = cur.fetchone()
    if not row:
        conn.close()
        raise ValueError("Weigh record not found")

    total_price = row[0]
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    cur.execute("""
        INSERT INTO receipts (weigh_record_id, total_price, created_at)
        VALUES (?, ?, ?)
    """, (weigh_record_id, total_price, now))

    conn.commit()
    conn.close()

def cancel_receipt(receipt_id: int):
    conn = sqlite3.connect(DB_NAME)
    cur = conn.cursor()

    cur.execute("""
        SELECT total_price
        FROM receipts
        WHERE id = ? AND type = 'SALE'
    """, (receipt_id,))

    row = cur.fetchone()
    if not row:
        conn.close()
        raise ValueError("Original receipt not found")

    original_price = row[0]
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    cur.execute("""
        INSERT INTO receipts (
            weigh_record_id,
            total_price,
            type,
            ref_receipt_id,
            created_at
        )
        SELECT weigh_record_id, ?, 'CANCEL', id, ?
        FROM receipts
        WHERE id = ?
    """, (-original_price, now, receipt_id))

    conn.commit()
    conn.close()
