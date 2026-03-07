import sqlite3

def get_items():

    conn = sqlite3.connect("database.db")
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM items")

    rows = cursor.fetchall()

    conn.close()

    return rows