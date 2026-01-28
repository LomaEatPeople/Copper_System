from fastapi import APIRouter, HTTPException
from services.weigh_service import add_weigh_record
from services.weigh_service import get_weigh_history

router = APIRouter(prefix="/weigh", tags=["Weigh"])


@router.get("/history")
def history(limit: int = 50):
    return get_weigh_history(limit)

@router.post("/")
def weigh(copper_type_id: int, weight_kg: float):
    try:
        record_id = add_weigh_record(
            copper_type_id=copper_type_id,
            weight_kg=weight_kg
        )
        return {"weigh_record_id": record_id}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
