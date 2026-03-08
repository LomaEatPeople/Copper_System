from fastapi import APIRouter
from schemas.items import ItemCreate, ItemDelete
from services.items import create_item, get_items, delete_item

router = APIRouter()

@router.get("/items")
def read_items():
    return get_items()

@router.post("/items")
def create_item_endpoint(item: ItemCreate):
    return create_item(item)

@router.delete("/items/{id}")
def delete_item_endpoint(id: int):

    item = delete_item(id)

    return {
        "item_id": item["item_id"],
        "item_name": item["item_name"],
        "message": "Item deleted"
    }