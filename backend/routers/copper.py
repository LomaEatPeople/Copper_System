from fastapi import APIRouter, HTTPException
from services.copper_service import get_all_copper_types

router = APIRouter(prefix="/copper", tags=["Copper"])

@router.get("/types")
def list_types():
    try:
        return get_all_copper_types()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
