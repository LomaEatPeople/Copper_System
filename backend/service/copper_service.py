import sqlite3
from datetime import datetime

DB_NAME = "copper.db"


def get_conn():
    conn = sqlite3.connect(DB_NAME)
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn


# -------------------------
# Copper Types
# -------------------------
def add_copper_type(name: str):
    conn = get_conn()
    cur = conn.cursor()

    cur.execute("""
        INSERT INTO copper_types (name)
        VALUES (?)
    """, (name,))

    conn.commit()
    conn.close()


# -------------------------
# Copper Prices
# -------------------------
def add_copper_price(copper_type_id: int, price_per_kg: float, effective_date=None):
    if effective_date is None:
        effective_date = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    conn = get_conn()
    cur = conn.cursor()

    cur.execute("""
        INSERT INTO copper_prices (copper_type_id, price_per_kg, effective_date)
        VALUES (?, ?, ?)
    """, (copper_type_id, price_per_kg, effective_date))

    conn.commit()
    conn.close()


def get_latest_price(copper_type_id: int):
    conn = get_conn()
    cur = conn.cursor()

    cur.execute("""
        SELECT id, price_per_kg
        FROM copper_prices
        WHERE copper_type_id = ?
        ORDER BY effective_date DESC
        LIMIT 1
    """, (copper_type_id,))

    row = cur.fetchone()
    conn.close()

    if not row:
        raise ValueError("No price found for this copper type")

    return {
        "copper_price_id": row[0],
        "price_per_kg": row[1]
    }
