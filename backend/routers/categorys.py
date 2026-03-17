#  backend/routers/categorys.py
from fastapi import APIRouter
from schemas.category import CategoryCreate
from services.categorys import get_categories, create_category, delete_category, update_category

router = APIRouter()

@router.get("/categories")
def read_categories():
    return get_categories()

@router.post("/categories")
def create_category_endpoint(category: CategoryCreate):
    return create_category(category)

@router.patch("/categories/{category_id}")
def update_category_endpoint(category_id: int, category: CategoryCreate):
    return update_category(category_id, category)

@router.delete("/categories/{category_id}")
def delete_category_endpoint(category_id: int):
    return delete_category(category_id)