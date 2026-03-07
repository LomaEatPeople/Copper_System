import sqlite3

def get_transactions():

    with sqlite3.connect("parinya.db") as conn:
        cursor = conn.cursor()

        cursor.execute("SELECT * FROM transactions")

        rows = cursor.fetchall()

        return rows

def create_transaction(transaction):

    with sqlite3.connect("parinya.db") as conn:
        cursor = conn.cursor()

        cursor.execute("""
        INSERT INTO transactions (user_id, transaction_type, status)
        VALUES (?, ?, 'draft')
        """, (
                transaction.user_id,
                transaction.transaction_type
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

def delete_transaction(transaction_id):
    
    with sqlite3.connect("parinya.db") as conn:
        cursor = conn.cursor()

        cursor.execute("""
        DELETE FROM transactions
        WHERE transaction_id = ?
        """, (transaction_id,))

def add_transaction_item(transaction_id, item_id, weight, price_per_kg):

    with sqlite3.connect("parinya.db") as conn:
        cursor = conn.cursor()

        cursor.execute("""
        INSERT INTO transaction_items
        (transaction_id, item_id, weight, price_per_kg)
        VALUES (?, ?, ?, ?)
        """, (
            transaction_id,
            item_id,
            weight,
            price_per_kg
        ))

        return cursor.lastrowid
    
def update_item_price(transaction_item_id, new_price_per_kg):

    with sqlite3.connect("parinya.db") as conn:
        cursor = conn.cursor()

        cursor.execute("""
        UPDATE transaction_items
        SET price_per_kg = ?
        WHERE id = ?
        """, (new_price_per_kg, transaction_item_id))

        return cursor.rowcount
    
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
        cursor = conn.cursor()

        cursor.execute("""
        SELECT * FROM transactions
        WHERE transaction_id = ?
        """, (transaction_id,))

        return cursor.fetchone()
    
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