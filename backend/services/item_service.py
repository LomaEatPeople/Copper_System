import sqlite3
from datetime import datetime

DB_NAME = "parinya.db"


def get_conn():
    conn = sqlite3.connect(DB_NAME)
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn


# -------------------------
# Item Types
# -------------------------
def add_item_type(name: str):
    conn = get_conn()
    cur = conn.cursor()

    cur.execute("""
        INSERT OR IGNORE INTO item_types (name)
        VALUES (?)
    """, (name,))

    conn.commit()
    conn.close()


def get_all_item_types():   # ✅ เปลี่ยนชื่อให้ตรงระบบใหม่
    conn = get_conn()
    cur = conn.cursor()

    cur.execute("""
        SELECT id, name
        FROM item_types
        ORDER BY id
    """)

    rows = cur.fetchall()
    conn.close()

    return [
        {
            "id": row[0],
            "name": row[1]
        }
        for row in rows
    ]


# -------------------------
# Item Prices
# -------------------------
def add_item_price(item_type_id: int, price_per_kg: float, effective_date=None):
    if effective_date is None:
        effective_date = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    conn = get_conn()
    cur = conn.cursor()

    cur.execute("""
        INSERT INTO item_prices (item_type_id, price_per_kg, effective_date)
        VALUES (?, ?, ?)
    """, (item_type_id, price_per_kg, effective_date))

    conn.commit()
    conn.close()


def get_latest_price(item_type_id: int):
    conn = get_conn()
    cur = conn.cursor()

    cur.execute("""
        SELECT id, price_per_kg
        FROM item_prices
        WHERE item_type_id = ?
        ORDER BY effective_date DESC
        LIMIT 1
    """, (item_type_id,))

    row = cur.fetchone()
    conn.close()

    if not row:
        raise ValueError("No price found for this item type")

    return {
        "item_price_id": row[0],
        "price_per_kg": row[1]
    }
