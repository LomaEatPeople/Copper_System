# services/stocks.py
import sqlite3
from datetime import datetime, timedelta

def get_stock_report(month: str = "all", year: str = "all"):
    # 🟢 ใส่ row_factory ด้วยนะจ๊ะ ไม่งั้น dict(row) พังแน่นอน!
    conn = sqlite3.connect("parinya.db")
    conn.row_factory = sqlite3.Row 
    
    with conn:
        cursor = conn.cursor()
        query = """
            SELECT 
                i.item_id, i.item_name,
                SUM(CASE WHEN UPPER(t.transaction_type) = 'BUY' THEN ti.weight ELSE 0 END) as total_buy_weight,
                SUM(CASE WHEN UPPER(t.transaction_type) = 'BUY' THEN ti.weight * ti.price_per_kg ELSE 0 END) as total_buy_cost,
                SUM(CASE WHEN UPPER(t.transaction_type) = 'SELL' THEN ti.weight ELSE 0 END) as total_sell_weight,
                SUM(CASE WHEN UPPER(t.transaction_type) = 'SELL' THEN ti.weight * ti.price_per_kg ELSE 0 END) as total_sell_revenue
            FROM items i
            LEFT JOIN transaction_items ti ON i.item_id = ti.item_id
            LEFT JOIN transactions t ON ti.transaction_id = t.transaction_id
            WHERE 1=1
        """
        params = []
        if month != "all":
            query += " AND strftime('%m', t.transaction_date) = ?"
            params.append(month.zfill(2))
        if year != "all":
            query += " AND strftime('%Y', t.transaction_date) = ?"
            params.append(year)

        query += " GROUP BY i.item_id, i.item_name" # 🟢 เพิ่ม item_name ใน Group by ด้วย
        cursor.execute(query, params)
        rows = cursor.fetchall()
        
        results = []
        for row in rows:
            d = dict(row)
            # ป้องกันค่า None ด้วย or 0
            d['remaining_stock'] = (d['total_buy_weight'] or 0) - (d['total_sell_weight'] or 0)
            d['profit_margin'] = (d['total_sell_revenue'] or 0) - (d['total_buy_cost'] or 0)
            results.append(d)
        return results

def get_dashboard_summary(specific_date: str):
    # specific_date ส่งมาเป็น '2026-03-20'
    query = """
        SELECT ... 
        WHERE date(t.transaction_date) = ?
        ...
    """

def get_dashboard_data(target_date: str):
    """
    target_date: Format 'YYYY-MM-DD' (เช่น '2026-03-20')
    """
    conn = sqlite3.connect('inventory.db') # เปลี่ยนเป็นชื่อไฟล์ DB ของคุณหลานนะจ๊ะ
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    # 1. คำนวณวันที่ "เมื่อวาน" เพื่อเอามาเทียบ
    date_obj = datetime.strptime(target_date, '%Y-%m-%d')
    yesterday = (date_obj - timedelta(days=1)).strftime('%Y-%m-%d')

    def get_totals(date_str):
        # Query หายอดรวม ซื้อ และ ขาย ของวันที่ระบุ
        query = """
            SELECT 
                SUM(CASE WHEN transaction_type = 'BUY' THEN total_price ELSE 0 END) as total_buy,
                SUM(CASE WHEN transaction_type = 'SELL' THEN total_price ELSE 0 END) as total_sell
            FROM transactions
            WHERE date(transaction_date) = ?
        """
        cursor.execute(query, (date_str,))
        row = cursor.fetchone()
        return {
            "buy": row['total_buy'] or 0,
            "sell": row['total_sell'] or 0,
            "profit": (row['total_sell'] or 0) - (row['total_buy'] or 0)
        }

    # ดึงข้อมูลของวันนี้ และ เมื่อวาน
    current_totals = get_totals(target_date)
    prev_totals = get_totals(yesterday)

    # 2. ดึงสต็อกสินค้าล่าสุด (เอามาโชว์ใน Tracking)
    cursor.execute("""
        SELECT item_id, item_name, remaining_stock 
        FROM items 
        LIMIT 4
    """)
    inventory = [dict(row) for row in cursor.fetchall()]

    conn.close()

    return {
        "date": target_date,
        "totals": current_totals,
        "previous": prev_totals,
        "inventory": inventory
    }