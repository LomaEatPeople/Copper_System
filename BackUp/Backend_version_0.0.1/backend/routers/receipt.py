from fastapi import APIRouter, HTTPException
from fastapi import APIRouter, Query
from services.receipt_service import create_receipt, cancel_receipt, get_receipt_history

router = APIRouter(prefix="/receipt", tags=["Receipt"])


@router.get("/history")
def receipt_history(limit: int = 50):
    return get_receipt_history(limit)
    
@router.post("/{weigh_record_id}")
def issue_receipt(weigh_record_id: int):
    try:
        receipt_id = create_receipt(weigh_record_id)
        return {"receipt_id": receipt_id}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/{receipt_id}/cancel")
def void_receipt(receipt_id: int):
    try:
        cancel_receipt(receipt_id)
        return {"status": "cancelled"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
