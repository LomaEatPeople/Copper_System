import sqlite3

def init_db():
    conn = sqlite3.connect("database.db")
    cursor = conn.cursor()

    # create tables here

    conn.commit()
    conn.close()


if __name__ == "__main__":
    init_db()