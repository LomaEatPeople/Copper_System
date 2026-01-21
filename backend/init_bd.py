import sqlite3
from datetime import datetime

DB_NAME = "copper.db"


def init_db():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()

    # ตารางราคาทองแดง
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS copper_prices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        copper_type TEXT NOT NULL,
        price_per_kg REAL NOT NULL,
        updated_at TEXT NOT NULL
    );
    """)

    # ตารางใบชั่ง
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS weigh_bills (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        copper_type TEXT NOT NULL,
        weight_kg REAL NOT NULL,
        price_per_kg REAL NOT NULL,
        total_price REAL NOT NULL,
        created_at TEXT NOT NULL
    );
    """)

    conn.commit()
    conn.close()
    print("Database initialized successfully.")


if __name__ == "__main__":
    init_db()