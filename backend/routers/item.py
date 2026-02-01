from fastapi import APIRouter, HTTPException
from backend.services.item_service import get_all_item_types

router = APIRouter(prefix="/item", tags=["Item"])

@router.get("/types")
def list_types():
    try:
        return get_all_item_types()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
