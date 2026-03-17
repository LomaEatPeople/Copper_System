# schemas/category.py
from pydantic import BaseModel
from typing import Optional

class CategoryCreate(BaseModel):
    name: str = None
    require_image: Optional[int] = None

class CategoryResponse(BaseModel):
    category_id: int
    name: str
    require_image: int

    class Config:
        from_attributes = True