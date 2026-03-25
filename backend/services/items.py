# services/items.py
import sqlite3

# ฟังก์ชัน Helper สำหรับจัดการ Connection แบบสะอาดๆ
def get_db_connection():
    conn = sqlite3.connect("parinya.db")
    conn.row_factory = sqlite3.Row  # ให้คืนค่าเป็น Dict/Row object จะได้ใช้ง่ายใน API
    return conn

def get_items():
    with get_db_connection() as conn:
        cursor = conn.cursor()
        query = """
            SELECT i.item_id, i.item_name, c.name as category_name
            FROM items i
            LEFT JOIN categories c ON i.category_id = c.category_id
        """
        cursor.execute(query)
        # แปลงเป็น list ของ dict เพื่อให้ FastAPI ส่ง JSON ได้ทันที
        return [dict(row) for row in cursor.fetchall()]

def create_item(item):
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO items (item_name, category_id)
            VALUES (?, ?)
        """, (item.item_name, item.category_id))
        conn.commit()
        return cursor.lastrowid

def update_item_price(item_id, new_price):
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE items
            SET price_per_kg = ?
            WHERE item_id = ?
        """, (new_price, item_id))
        conn.commit()
        return True

def delete_item(item_id):
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM items WHERE item_id = ?", (item_id,))
        item = cursor.fetchone()
        if not item: return None

        cursor.execute("DELETE FROM items WHERE item_id = ?", (item_id,))
        conn.commit()
        return dict(item)

# 📜 ส่วนของประวัติการเคลื่อนไหว (Ledger)
def get_item_movement_history(item_id: int):
    with get_db_connection() as conn:
        cursor = conn.cursor()
        query = """
            SELECT t.transaction_id, t.transaction_date, t.transaction_type, 
                   ti.weight, ti.price_per_kg, (ti.weight * ti.price_per_kg) as total
            FROM transaction_items ti
            JOIN transactions t ON ti.transaction_id = t.transaction_id
            WHERE ti.item_id = ?
            ORDER BY t.transaction_date DESC
        """
        cursor.execute(query, (item_id,))
        return [dict(row) for row in cursor.fetchall()]