from pydantic import BaseModel

class ItemCreate(BaseModel):
    item_name: str
    price_per_kg: float
    category_id: int