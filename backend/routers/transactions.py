from fastapi import APIRouter
from services.transactions import (
    get_transactions,
    create_transaction,
    add_transaction_item,
    update_item_price,
    confirm_transaction,
    get_transaction
)

from schemas.transactions import TransactionCreate, TransactionItemCreate, PriceUpdate

router = APIRouter()

@router.get("/transactions")
def read_transactions():
    return get_transactions()


@router.post("/transactions")
def create_new_transaction(transaction: TransactionCreate):

    transaction_id = create_transaction(transaction)

    return {
        "transaction_id": transaction_id,
        "status": "draft"
    }


@router.get("/transactions/{id}")
def get_transaction_endpoint(id: int):
    return get_transaction(id)


@router.post("/transactions/{id}/items")
def add_transaction_item_endpoint(id: int, item: TransactionItemCreate):
    return add_transaction_item(
        id,
        item.item_id,
        item.weight
    )
  

@router.patch("/transaction-items/{id}/price")
def update_item_price_endpoint(id: int, price: PriceUpdate):
    return update_item_price(id, price.price_per_kg)


@router.post("/transactions/{id}/confirm")
def confirm_transaction_endpoint(id: int):

    confirm_transaction(id)

    transaction = get_transaction(id)

    return {
        "status": "confirmed",
        "total_cost": transaction["total_cost"]
    }