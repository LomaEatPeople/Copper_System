import sqlite3

def get_items():

    conn = sqlite3.connect("parinya.db")
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM items")

    rows = cursor.fetchall()

    conn.close()

    return rows

def create_item(item):

    with sqlite3.connect("parinya.db") as conn:
        cursor = conn.cursor()

        cursor.execute("""
        INSERT INTO items (item_name, category_id)
        VALUES (?, ?)
        """, (
            item.item_name,
            item.category_id
        ))

        return cursor.lastrowid

def update_item_price(item_id, new_price):

    with sqlite3.connect("parinya.db") as conn:
        cursor = conn.cursor()

    cursor.execute("""
    UPDATE items
    SET price_per_kg = ?
    WHERE item_id = ?
    """, (new_price, item_id))

    conn.commit()
    conn.close()