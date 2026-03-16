# services/categorys.py
from fastapi import HTTPException
from schemas.category import CategoryCreate
import sqlite3

DB_PATH = "parinya.db"

def get_categories():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT category_id, name FROM categories")
    rows = cursor.fetchall()
    conn.close()
    
    # แปลงจาก tuple เป็น list of dict
    return [{"category_id": r[0], "name": r[1]} for r in rows]

def create_category(category: CategoryCreate):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    try:
        cursor.execute("INSERT INTO categories (name) VALUES (?)", (category.name,))
        new_id = cursor.lastrowid
        conn.commit()
        return {"category_id": new_id, "name": category.name}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        conn.close()

def delete_category(category_id: int):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # เช็คก่อนว่ามีสินค้าตัวไหนใช้หมวดหมู่นี้อยู่ไหม (ป้องกัน DB พัง)
    cursor.execute("SELECT item_id FROM items WHERE category_id = ?", (category_id,))
    if cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail="ลบไม่ได้จ้า! มีสินค้าใช้งานหมวดหมู่นี้อยู่")

    cursor.execute("DELETE FROM categories WHERE category_id = ?", (category_id,))
    if cursor.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=404, detail="ไม่พบหมวดหมู่นี้ค่ะ")
        
    conn.commit()
    conn.close()
    return {"message": "ลบหมวดหมู่เรียบร้อยแล้วค่ะคุณน้า"}