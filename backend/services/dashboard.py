import sqlite3
from datetime import datetime, timedelta
from typing import Dict, Any

class DashboardService:
    def __init__(self, db_path: str = "parinya.db"):
        self.db_path = db_path

    def get_db_connection(self):
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def fetch_totals_by_range(self, cursor, start_date: str, end_date: str):
        # 🟢 ปรับ SQL ให้ Join ตารางและคูณค่า (Weight * Price) ตามโครงสร้างคุณหลาน
        query = """
            SELECT 
                SUM(CASE WHEN t.transaction_type = 'BUY' THEN (ti.weight * ti.price_per_kg) ELSE 0 END) as buy,
                SUM(CASE WHEN t.transaction_type = 'SELL' THEN (ti.weight * ti.price_per_kg) ELSE 0 END) as sell
            FROM transactions t
            JOIN transaction_items ti ON t.transaction_id = ti.transaction_id
            WHERE date(t.transaction_date) BETWEEN ? AND ?
        """
        cursor.execute(query, (start_date, end_date))
        row = cursor.fetchone()
        buy = row['buy'] or 0.0
        sell = row['sell'] or 0.0
        return {"buy": buy, "sell": sell, "profit": sell - buy}

    def get_summary(self, date_str: str, mode: str = "daily") -> Dict[str, Any]:
        conn = self.get_db_connection()
        cursor = conn.cursor()
        
        try:
            target_date = datetime.strptime(date_str, '%Y-%m-%d')

            if mode == "daily":
                start_curr = end_curr = date_str
                start_prev = end_prev = (target_date - timedelta(days=1)).strftime('%Y-%m-%d')
            else:
                start_curr = target_date.replace(day=1).strftime('%Y-%m-%d')
                end_curr = date_str
                last_month_end = target_date.replace(day=1) - timedelta(days=1)
                start_prev = last_month_end.replace(day=1).strftime('%Y-%m-%d')
                end_prev = last_month_end.strftime('%Y-%m-%d')

            current_totals = self.fetch_totals_by_range(cursor, start_curr, end_curr)
            prev_totals = self.fetch_totals_by_range(cursor, start_prev, end_prev)

            # 🟢 ดึงรายการสินค้า 4 อันดับแรก (เนื่องจากไม่มี remaining_stock ใน items 
            # พี่จะดึงแค่ชื่อมาก่อน เดี๋ยวอนาคตเราค่อยมาเติม Logic คำนวณสต็อกจริงกันค่ะ)
            cursor.execute("SELECT item_id, item_name, 0 as remaining_stock FROM items LIMIT 4")
            inventory = [dict(row) for row in cursor.fetchall()]

            return {
                "current": current_totals,
                "previous": prev_totals,
                "inventory": inventory
            }
        finally:
            conn.close()