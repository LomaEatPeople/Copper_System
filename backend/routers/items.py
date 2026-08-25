from fastapi import APIRouter
from schemas.items import ItemCreate
from services.items import create_item, get_items, delete_item, get_item_movement_history

router = APIRouter()

@router.get("/items")
def read_items():
    return get_items()

@router.post("/items")
def create_item_endpoint(item: ItemCreate):
    return create_item(item)

@router.delete("/items/{id}")
def delete_item_endpoint(id: int):
    result = delete_item(id)
    if not result:
        return {"error": "Item not found"}
    return {
        "item_id": result["item_id"],
        "item_name": result["item_name"],
        "message": "Item deleted"
    }

@router.get("/items/history/{item_id}")
def item_history(item_id: int):
    return get_item_movement_history(item_id)