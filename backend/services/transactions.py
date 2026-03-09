import sqlite3

TRANSACTION_TYPE_BUY = "buy"

def status_checker(transaction_id):

    with sqlite3.connect("parinya.db") as conn:
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        cursor.execute("""
        SELECT status
        FROM transactions
        WHERE transaction_id = ?
        """, (transaction_id,))

        tx = cursor.fetchone()

        if not tx:
            return {"error": "Transaction not found"}

        return tx["status"]
    
def ensure_draft(transaction_id):
    status = status_checker(transaction_id)
    if status != "draft":
        raise Exception("Transaction already confirmed")

def get_transactions():

    with sqlite3.connect("parinya.db") as conn:
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        cursor.execute("""
        SELECT * FROM transactions
        """)

        rows = cursor.fetchall()

        return [dict(row) for row in rows]
    
def create_transaction(transaction):

    with sqlite3.connect("parinya.db") as conn:
        cursor = conn.cursor()

        cursor.execute("""
        INSERT INTO transactions (user_id, transaction_type, status, total_cost)
        VALUES (?, ?, 'draft', 0 )
        """, (
            transaction.user_id,
            TRANSACTION_TYPE_BUY
        ))

        return cursor.lastrowid
    
def update_transaction_status(transaction_id, new_status):

    with sqlite3.connect("parinya.db") as conn:
        cursor = conn.cursor()

        cursor.execute("""
        UPDATE transactions
        SET status = ?
        WHERE transaction_id = ?
        """, (new_status, transaction_id))

        return cursor.rowcount

def delete_transaction(transaction_id, confirm=False):

    status = status_checker(transaction_id)

    if status == "confirmed" and not confirm:
        return {
            "warning": "Transaction is confirmed. Send confirm=true to delete"
        }

    with sqlite3.connect("parinya.db") as conn:
        cursor = conn.cursor()

        cursor.execute("""
        DELETE FROM transactions
        WHERE transaction_id = ?
        """, (transaction_id,))

        return {"message": "Transaction deleted"}

def add_transaction_item(transaction_id, item_id, weight):

    ensure_draft(transaction_id)

    with sqlite3.connect("parinya.db") as conn:
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        # เช็คว่ามี item นี้อยู่แล้วไหม
        cursor.execute("""
        SELECT id, weight
        FROM transaction_items
        WHERE transaction_id = ? AND item_id = ?
        """, (transaction_id, item_id))

        existing = cursor.fetchone()

        if existing:
            # รวม weight
            new_weight = existing["weight"] + weight

            cursor.execute("""
            UPDATE transaction_items
            SET weight = ?
            WHERE id = ?
            """, (new_weight, existing["id"]))

            return {
                "message": "Weight merged",
                "transaction_item_id": existing["id"],
                "new_weight": new_weight
            }

        else:
            # insert ใหม่
            cursor.execute("""
            INSERT INTO transaction_items
            (transaction_id, item_id, weight)
            VALUES (?, ?, ?)
            """, (transaction_id, item_id, weight))

            return {
                "message": "Item added",
                "transaction_item_id": cursor.lastrowid,
                "weight": weight
            }

def update_item_price(transaction_id, item_id, new_price):

    ensure_draft(transaction_id)

    with sqlite3.connect("parinya.db") as conn:
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        cursor.execute("""
        UPDATE transaction_items
        SET price_per_kg = ?
        WHERE transaction_id = ? AND item_id = ?
        """, (new_price, transaction_id, item_id))

        if cursor.rowcount == 0:
            return None

        cursor.execute("""
        SELECT ti.transaction_id, ti.item_id, ti.price_per_kg, i.item_name
        FROM transaction_items ti
        JOIN items i ON ti.item_id = i.item_id
        WHERE ti.transaction_id = ? AND ti.item_id = ?
        """, (transaction_id, item_id))

        return dict(cursor.fetchone())
    
def calculate_total_cost(transaction_id):

    with sqlite3.connect("parinya.db") as conn:
        cursor = conn.cursor()

        cursor.execute("""
        SELECT SUM(weight * price_per_kg)
        FROM transaction_items
        WHERE transaction_id = ?
        """, (transaction_id,))

        total = cursor.fetchone()[0]

        return total if total else 0
    
def confirm_transaction(transaction_id):

    total = calculate_total_cost(transaction_id)

    with sqlite3.connect("parinya.db") as conn:
        cursor = conn.cursor()

        cursor.execute("""
        UPDATE transactions
        SET total_cost = ?, status = 'confirmed'
        WHERE transaction_id = ?
        """, (total, transaction_id))

def get_transaction(transaction_id):

    with sqlite3.connect("parinya.db") as conn:
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        cursor.execute("""
        SELECT * FROM transactions
        WHERE transaction_id = ?
        """, (transaction_id,))

        row = cursor.fetchone()

        return dict(row) if row else None
    
def get_transaction_with_items(transaction_id):

    with sqlite3.connect("parinya.db") as conn:
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        cursor.execute("""
        SELECT * FROM transactions
        WHERE transaction_id = ?
        """, (transaction_id,))

        transaction = cursor.fetchone()

        if not transaction:
            return None

        cursor.execute("""
        SELECT * FROM transaction_items
        WHERE transaction_id = ?
        """, (transaction_id,))

        items = cursor.fetchall()

        return {
            "transaction": dict(transaction),
            "items": [dict(i) for i in items]
        }
    
def get_transaction_items(transaction_id):

    with sqlite3.connect("parinya.db") as conn:
        cursor = conn.cursor()

        cursor.execute("""
        SELECT * FROM transaction_items
        WHERE transaction_id = ?
        """, (transaction_id,))

        return cursor.fetchall()
    
def calculate_transaction_total(transaction_id):

    with sqlite3.connect("parinya.db") as conn:
        cursor = conn.cursor()

        cursor.execute("""
        SELECT SUM(weight * price_per_kg)
        FROM transaction_items
        WHERE transaction_id = ?
        """, (transaction_id,))

        total = cursor.fetchone()[0]

        return total if total else 0    
def remove_transaction_item(transaction_id, item_id):

    ensure_draft(transaction_id)

    with sqlite3.connect("parinya.db") as conn:
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        # ดึงชื่อ item
        cursor.execute("""
        SELECT item_name FROM items WHERE item_id = ?
        """, (item_id,))
        
        item = cursor.fetchone()

        if not item:
            return {"error": "Item not found"}

        item_name = item["item_name"]

        # ลบ item จาก transaction
        cursor.execute("""
        DELETE FROM transaction_items
        WHERE transaction_id = ? AND item_id = ?
        """, (transaction_id, item_id))

        if cursor.rowcount == 0:
            return {"error": "Transaction item not found"}

        return {"message": f"Item {item_name} removed from transaction"}