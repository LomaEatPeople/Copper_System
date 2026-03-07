from fastapi import APIRouter
from services.items import get_items, create_item
from schemas.items import ItemCreate

router = APIRouter()

@router.get("/items")
def read_items():
    return get_items()

@router.post("/items")
def create_new_item(item: ItemCreate):
    return create_item(item)