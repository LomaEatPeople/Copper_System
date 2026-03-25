from pydantic import BaseModel
from typing import List, Optional

class StatTotals(BaseModel):
    buy: float
    sell: float
    profit: float

class InventoryItem(BaseModel):
    item_id: int
    item_name: str
    remaining_stock: float

class DashboardData(BaseModel):
    current: StatTotals
    previous: StatTotals
    inventory: List[InventoryItem]

class DashboardResponse(BaseModel):
    status: str
    data: DashboardData