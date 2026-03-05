from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.bill_service import create_empty_bill, add_weigh_to_bill, get_bill_details, cancel_bill

router = APIRouter(prefix="/bill", tags=["Bill"])

class IssueBillRequest(BaseModel):
    cashier_id: int
class AddWeighRequest(BaseModel):
    weigh_record_id: int

@router.post("/")
def issue_bill(body: IssueBillRequest):
    try:
        bill_id = create_empty_bill(body.cashier_id)
        return {"bill_id": bill_id}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
@router.post("/{bill_id}/add-weigh")
def add_weigh_to_bill_endpoint(bill_id: int, body: AddWeighRequest):
    try:
        add_weigh_to_bill(bill_id, body.weigh_record_id)
        return {"status": "added"}
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
