import sqlite3
from datetime import datetime

DB_NAME = "parinya.db"

def init_db():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute("PRAGMA foreign_keys = ON;")

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS item_types (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS item_prices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        item_type_id INTEGER NOT NULL,
        price_per_kg REAL NOT NULL,
        effective_date TEXT NOT NULL,
        FOREIGN KEY (item_type_id) REFERENCES item_types(id)
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        role TEXT CHECK(role IN ('cashier','manager','staff')),
        created_at TEXT NOT NULL
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS bills (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cashier_id INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        printed_at TEXT NULL,
        total_amount REAL DEFAULT 0,
        status TEXT CHECK(status IN ('draft','issued','cancelled')) DEFAULT 'draft',
        FOREIGN KEY (cashier_id) REFERENCES users(id)
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS weigh_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        item_price_id INTEGER NOT NULL,
        weight_kg REAL NOT NULL,
        image_path TEXT,
        total_price REAL NOT NULL,
        created_at TEXT NOT NULL,
        bill_id INTEGER,
        FOREIGN KEY (item_price_id) REFERENCES item_prices(id),
        FOREIGN KEY (bill_id) REFERENCES bills(id)
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS bill_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        bill_id INTEGER NOT NULL,
        weigh_record_id INTEGER NOT NULL,
        price_per_kg REAL NOT NULL,
        weight_kg REAL NOT NULL,
        total_price REAL NOT NULL,
        FOREIGN KEY (bill_id) REFERENCES bills(id),
        FOREIGN KEY (weigh_record_id) REFERENCES weigh_records(id)
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS receipts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        bill_id INTEGER NOT NULL,
        paid INTEGER DEFAULT 0,
        created_at TEXT NOT NULL,
        FOREIGN KEY (bill_id) REFERENCES bills(id)
    );
    """)

    conn.commit()
    conn.close()
    print("✅ Database initialized successfully.")

def get_conn():
    return sqlite3.connect(DB_NAME)

if __name__ == "__main__":
    init_db()
