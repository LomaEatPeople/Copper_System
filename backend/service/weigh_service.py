from services.copper_service import get_latest_price
import sqlite3
from datetime import datetime

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
