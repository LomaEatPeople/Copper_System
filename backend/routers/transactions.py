from fastapi import APIRouter
from services.transactions import (
    get_transactions,
    create_transaction,
    add_transaction_item,
    update_item_price,
    confirm_transaction,
    get_transaction,
    get_transaction_with_items,
    delete_transaction,
    remove_transaction_item
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
  

@router.patch("/transaction-items/price")
def update_item_price_endpoint(data: PriceUpdate):

    item = update_item_price(
        data.transaction_id,
        data.item_id,
        data.price_per_kg
    )

    if not item:
        return {"error": "Transaction item not found"}

    return {
        "message": f"Price updated for {item['item_name']}",
        "transaction_id": item["transaction_id"],
        "item_id": item["item_id"],
        "price_per_kg": item["price_per_kg"]
    }


@router.post("/transactions/{id}/confirm")
def confirm_transaction_endpoint(id: int):

    confirm_transaction(id)

    transaction = get_transaction(id)

    if not transaction:
        return {"error": "Transaction not found"}

    return {
        "status": "confirmed",
        "total_cost": transaction["total_cost"]
    }

@router.get("/transactions_with_items/{id}/items")
def get_transaction_items_endpoint(id: int):
    return get_transaction_with_items(id)

@router.delete("/transactions/{id}")
def delete_transaction_endpoint(id: int):
    return delete_transaction(id)

@router.delete("/transaction-items")
def remove_transaction_item_endpoint(transaction_id: int, item_id: int):
    return remove_transaction_item(transaction_id, item_id)