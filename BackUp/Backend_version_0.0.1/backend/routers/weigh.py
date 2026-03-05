from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.weigh_service import add_weigh_record
from services.item_service import get_item_type_name
from services.weigh_service import get_weigh_history

router = APIRouter(prefix="/weigh", tags=["Weigh"])

class WeighRequest(BaseModel):
    item_type_id: int
    weight_kg: float
    image_path: str | None = None   # Optional

router = APIRouter(prefix="/weigh", tags=["Weigh"])


@router.get("/history")
def history(limit: int = 50):
    return get_weigh_history(limit)

@router.post("/")
def weigh(data: WeighRequest):
    try:
        # ดึงชื่อประเภทสินค้า (เช่น "ทองแดงเส้น", "พลาสติก")
        item_name = get_item_type_name(data.item_type_id)

        # === กติกาสำคัญของคุณ ===
        if "ทองแดง" in item_name and not data.image_path:
            raise HTTPException(
                status_code=400,
                detail="Copper items require an image"
            )

        record_id = add_weigh_record(
            item_type_id=data.item_type_id,
            weight_kg=data.weight_kg,
            image_path=data.image_path
        )

        return {"weigh_record_id": record_id}

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
