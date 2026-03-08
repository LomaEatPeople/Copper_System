from fastapi import APIRouter
from schemas.items import ItemCreate
from services.items import create_item, get_items

router = APIRouter()

@router.get("/items")
def read_items():
    return get_items()

@router.post("/items")
def create_item_endpoint(item: ItemCreate):
    return create_item(item)