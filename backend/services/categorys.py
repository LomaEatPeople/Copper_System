# services/categorys.py
from fastapi import HTTPException
from schemas.category import CategoryCreate
import sqlite3

DB_PATH = "parinya.db"

def get_categories():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    # 🟢 เพิ่ม require_image เข้าไปใน SELECT ด้วย
    cursor.execute("SELECT category_id, name, require_image FROM categories")
    rows = cursor.fetchall()
    conn.close()

    return [{"category_id": r[0], "name": r[1], "require_image": r[2]} for r in rows]

def create_category(category: CategoryCreate):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    try:
        require_image = category.require_image if category.require_image is not None else 0
        cursor.execute(
            "INSERT INTO categories (name, require_image) VALUES (?, ?)",
            (category.name, require_image)
        )
        new_id = cursor.lastrowid
        conn.commit()
        return {"category_id": new_id, "name": category.name, "require_image": require_image}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        conn.close()
def update_category(category_id: int, category: CategoryCreate):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    try:
        if category.name:
            cursor.execute("UPDATE categories SET name = ?, require_image = ? WHERE category_id = ?", 
                           (category.name, category.require_image, category_id))
        else:
            cursor.execute("UPDATE categories SET require_image = ? WHERE category_id = ?", 
                           (category.require_image, category_id))
        
        conn.commit()
        return {"status": "success"}
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