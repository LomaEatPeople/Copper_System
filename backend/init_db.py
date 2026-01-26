import sqlite3
from datetime import datetime

DB_NAME = "copper.db"


def init_db():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()

    # เปิด foreign key (สำคัญมากใน SQLite)
    cursor.execute("PRAGMA foreign_keys = ON;")

    # -------------------------
    # Table: copper_types
    # (ชนิดทองแดง — ไม่มีราคา)
    # -------------------------
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS copper_types (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE
    );
    """)

    # -------------------------
    # Table: copper_prices
    # (ราคาทองแดงตามเวลา)
    # -------------------------
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS copper_prices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        copper_type_id INTEGER NOT NULL,
        price_per_kg REAL NOT NULL,
        effective_date TEXT NOT NULL,
        FOREIGN KEY (copper_type_id) REFERENCES copper_types(id)
    );
    """)

    # -------------------------
    # Table: weigh_records
    # (บันทึกการชั่ง — ล็อกราคาที่ใช้จริง)
    # -------------------------
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS weigh_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        copper_price_id INTEGER NOT NULL,
        weight_kg REAL NOT NULL,
        total_price REAL NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (copper_price_id) REFERENCES copper_prices(id)
    );
    """)

    # -------------------------
    # Table: receipts
    # (ใบเสร็จ / สถานะรับเงิน)
    # -------------------------
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


if __name__ == "__main__":
    init_db()
