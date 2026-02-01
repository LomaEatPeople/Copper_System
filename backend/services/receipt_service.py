import sqlite3
from datetime import datetime
from init_db import get_conn

DB_NAME = "parinya.db"


def create_receipt(weigh_record_id: int):
    conn = get_conn()
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
        INSERT INTO receipts (weigh_record_id, created_at)
        VALUES (?, ?)
    """, (weigh_record_id, now))

    receipt_id = cur.lastrowid
    conn.commit()
    conn.close()

    return receipt_id


def cancel_receipt(receipt_id: int):
    conn = get_conn()
    cur = conn.cursor()

    # ตรวจว่ามี receipt จริง
    cur.execute("""
        SELECT weigh_record_id
        FROM receipts
        WHERE id = ?
    """, (receipt_id,))

    row = cur.fetchone()
    if not row:
        conn.close()
        raise ValueError("Receipt not found")

    # แทนที่จะสร้างใบ CANCEL เราจะ "mark paid = -1"
    cur.execute("""
        UPDATE receipts
        SET paid = -1
        WHERE id = ?
    """, (receipt_id,))

    conn.commit()
    conn.close()


def get_receipt_history(limit: int = 20):
    conn = get_conn()
    cur = conn.cursor()

    cur.execute("""
        SELECT
            r.id,
            r.paid,
            ct.name,
            wr.weight_kg,
            wr.total_price,
            r.created_at
        FROM receipts r
        JOIN weigh_records wr ON r.weigh_record_id = wr.id
        JOIN item_prices ip ON wr.item_price_id = ip.id
        JOIN item_types ct ON ip.item_type_id = ct.id
        ORDER BY r.created_at DESC
        LIMIT ?
    """, (limit,))

    rows = cur.fetchall()
    conn.close()

    return [
        {
            "receipt_id": r[0],
            "status": "CANCELLED" if r[1] == -1 else "ACTIVE",
            "item_type": r[2],
            "weight_kg": r[3],
            "total_price": r[4],
            "created_at": r[5],
        }
        for r in rows
    ]
