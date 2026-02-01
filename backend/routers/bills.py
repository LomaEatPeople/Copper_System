from fastapi import APIRouter, HTTPException
from backend.services.bill_service import create_bill, get_bill_details, cancel_bill

router = APIRouter(prefix="/bill", tags=["Bill"])
@router.post("/")
def issue_bill(cashier_id: int, items: list[dict]):
    try:
        bill_id = create_bill(cashier_id, items)
        return {"bill_id": bill_id}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
@router.get("/{bill_id}")
def bill_details(bill_id: int):
    try:
        return get_bill_details(bill_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
@router.post("/{bill_id}/cancel")
def void_bill(bill_id: int):
    try:
        cancel_bill(bill_id)
        return {"status": "cancelled"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))