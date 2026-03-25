# routers/stocks.py
from fastapi import APIRouter, Query
from services.stocks import get_stock_report 

# 🟢 เติม prefix ตรงนี้เพื่อให้ URL กลายเป็น /api/stocks/...
router = APIRouter(prefix="/api/stocks", tags=["Stocks"])

@router.get("/summary") # 🟢 แก้จาก /stock-summary เป็น /summary ให้ตรงกับหน้าบ้าน
def read_stock_summary(
    month: str = Query("all", description="เดือนที่ต้องการกรอง (01-12)"),
    year: str = Query("2026", description="ปีที่ต้องการกรอก")
):
    try:
        data = get_stock_report(month=month, year=year)
        # 🟢 หน้าบ้านคาดหวัง { status: "success", data: [...] }
        return {"status": "success", "data": data}
    except Exception as e:
        return {"status": "error", "message": str(e)}