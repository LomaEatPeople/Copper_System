from services.copper_service import get_latest_price
import sqlite3
from datetime import datetime
from init_db import get_conn

DB_NAME = "copper.db"


def add_weigh_record(copper_type_id: int, weight_kg: float):
    price_info = get_latest_price(copper_type_id)

    copper_price_id = price_info["copper_price_id"]
    price_per_kg = price_info["price_per_kg"]
    total_price = weight_kg * price_per_kg

    conn = sqlite3.connect(DB_NAME)
    cur = conn.cursor()

    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    cur.execute("""
        INSERT INTO weigh_records (
            copper_price_id, weight_kg, total_price, created_at
        )
        VALUES (?, ?, ?, ?)
    """, (copper_price_id, weight_kg, total_price, now))

    conn.commit()
    conn.close()

def get_weigh_history(limit=50):
    conn = get_conn()
    cur = conn.cursor()

    cur.execute("""
        SELECT
            wr.id,
            ct.name,
            cp.price_per_kg,
            wr.weight_kg,
            wr.total_price,
            wr.created_at
        FROM weigh_records wr
        JOIN copper_prices cp ON wr.copper_price_id = cp.id
        JOIN copper_types ct ON cp.copper_type_id = ct.id
        ORDER BY wr.created_at DESC
        LIMIT ?
    """, (limit,))

    rows = cur.fetchall()
    conn.close()

    return [
        {
            "id": r[0],
            "copper_type": r[1],
            "price_per_kg": r[2],
            "weight_kg": r[3],
            "total_price": r[4],
            "created_at": r[5],
        }
        for r in rows
    ]
