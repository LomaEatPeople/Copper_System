import sqlite3
from datetime import datetime

DB_NAME = "copper.db"


def init_db():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()

    # เปิด foreign key (สำคัญมากใน SQLite)
    cursor.execute("PRAGMA foreign_keys = ON;")

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS item_types (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE
    );
    """)
    # -------------------------
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS item_prices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        item_type_id INTEGER NOT NULL,
        price_per_kg REAL NOT NULL,
        effective_date TEXT NOT NULL,
        FOREIGN KEY (item_type_id) REFERENCES item_types(id)
    );
    """)

    # -------------------------
    # Table: weigh_records
    # (บันทึกการชั่ง — ล็อกราคาที่ใช้จริง)
    # -------------------------
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS weigh_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        item_price_id INTEGER NOT NULL,
        weight_kg REAL NOT NULL,
        image_path TEXT,
        total_price REAL NOT NULL,
        created_at TEXT NOT NULL,
        bill_id INTEGER,
        FOREIGN KEY (item_price_id) REFERENCES item_prices(id)
    );
    """)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS bills (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cashier_id INTEGER NOT NULL,
        created_at TEXT NULL,
        printed_at TEXT NULL,
        total_amount REAL NOT NULL,
        FOREIGN KEY (cashier_id) REFERENCES users(id)
    );
    """)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS bills_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        bill_id INTEGER NOT NULL,
        item_price_id INTEGER NOT NULL,
        weight_kg REAL NOT NULL,
        total_price REAL NOT NULL,
        FOREIGN KEY (bill_id) REFERENCES bills(id),
        FOREIGN KEY (item_price_id) REFERENCES item_prices(id)
    );
    """)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS receipts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        weigh_record_id INTEGER NOT NULL,
        paid INTEGER DEFAULT 0,
        created_at TEXT NOT NULL,
        FOREIGN KEY (weigh_record_id) REFERENCES weigh_records(id)
    );
    """)

    conn.commit()
    conn.close()
    print("Database initialized successfully.")

def get_conn():
    return sqlite3.connect("copper.db")


if __name__ == "__main__":
    init_db()
