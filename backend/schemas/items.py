from pydantic import BaseModel

class ItemCreate(BaseModel):
    item_name: str
    category_id: int

class ItemDelete(BaseModel):
    item_id: int