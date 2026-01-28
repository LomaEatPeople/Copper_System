import sqlite3
from datetime import datetime
from init_db import get_conn

DB_NAME = "copper.db"


def create_receipt(weigh_record_id: int):
    conn = sqlite3.connect(DB_NAME)
    cur = conn.cursor()

    # ตรวจว่ามี weigh_record จริง
    cur.execute("""
        SELECT id FROM weigh_records WHERE id = ?
    """, (weigh_record_id,))

    if not cur.fetchone():
        conn.close()
        raise ValueError("Weigh record not found")

    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    cur.execute("""
        INSERT INTO receipts (weigh_record_id, type, created_at)
        VALUES (?, 'SALE', ?)
    """, (weigh_record_id, now))

    conn.commit()
    conn.close()


def cancel_receipt(receipt_id: int):
    conn = sqlite3.connect(DB_NAME)
    cur = conn.cursor()

    # ดึงใบ SALE เดิม
    cur.execute("""
        SELECT weigh_record_id
        FROM receipts
        WHERE id = ? AND type = 'SALE'
    """, (receipt_id,))

    row = cur.fetchone()
    if not row:
        conn.close()
        raise ValueError("Original SALE receipt not found")

    weigh_record_id = row[0]
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    # สร้างใบ CANCEL
    cur.execute("""
        INSERT INTO receipts (
            weigh_record_id,
            type,
            ref_receipt_id,
            created_at
        )
        VALUES (?, 'CANCEL', ?, ?)
    """, (weigh_record_id, receipt_id, now))

    conn.commit()
    conn.close()

def get_receipt_history(limit: int):
    conn = get_conn()
    cur = conn.cursor()

    cur.execute("""
        SELECT
            r.id,
            r.type,
            r.ref_receipt_id,
            ct.name,
            wr.weight_kg,
            wr.total_price,
            r.created_at
        FROM receipts r
        JOIN weigh_records wr ON r.weigh_record_id = wr.id
        JOIN copper_prices cp ON wr.copper_price_id = cp.id
        JOIN copper_types ct ON cp.copper_type_id = ct.id
        ORDER BY r.created_at DESC
        LIMIT ?
    """, (limit,))

    rows = cur.fetchall()
    conn.close()

    return [
        {
            "receipt_id": r[0],
            "type": r[1],
            "ref_receipt_id": r[2],
            "copper_type": r[3],
            "weight_kg": r[4],
            "total_price": r[5],
            "created_at": r[6],
        }
        for r in rows
    ]
