from pydantic import BaseModel

class TransactionCreate(BaseModel):
    user_id: int

class TransactionItemCreate(BaseModel):
    item_id: int
    weight: float

class PriceUpdate(BaseModel):
    price_per_kg: float