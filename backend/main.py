from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from routers import items, transactions,categorys,stocks,dashboard

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.include_router(items.router)
app.include_router(transactions.router)
app.include_router(categorys.router)
app.include_router(stocks.router)
app.include_router(dashboard.router)

@app.get("/")
def root():
    return {"message": "Welcome to Inventory API"}