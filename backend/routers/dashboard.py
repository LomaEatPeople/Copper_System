# routers/dashboard.py
from fastapi import APIRouter, HTTPException, Query
from schemas.dashboard import DashboardResponse
from services.dashboard import DashboardService

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])
service = DashboardService()

@router.get("/summary", response_model=DashboardResponse)
async def get_summary(date: str, mode: str = Query("daily", regex="^(daily|monthly)$")):
    try:
        data = service.get_summary(date, mode)
        return {"status": "success", "data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))