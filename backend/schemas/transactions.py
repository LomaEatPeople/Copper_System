from pydantic import BaseModel

class TransactionCreate(BaseModel):
    user_id: int
    transaction_type: str

class TransactionItemCreate(BaseModel):
    item_id: int
    weight: float
    price_per_kg: float

class PriceUpdate(BaseModel):
    price_per_kg: float