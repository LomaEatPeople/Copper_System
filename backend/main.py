from fastapi import FastAPI
from routers import items, transactions

app = FastAPI()

app.include_router(items.router)

app.include_router(transactions.router)