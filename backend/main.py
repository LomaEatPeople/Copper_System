from fastapi import FastAPI
from services.copper_service import get_all_copper_types
from services.weigh_service import add_weigh_record
from services.receipt_service import create_receipt, cancel_receipt
from routers import receipt, weigh, copper
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI(title="Copper System API")

app.include_router(weigh.router)
app.include_router(receipt.router)
app.include_router(copper.router)

# อนุญาตให้ React เรียก
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
    "http://localhost:5173","http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"status": "ok"}

@app.get("/favicon.ico")
def favicon():
    return {}

@app.get("/copper-types")
def list_copper_types():
    return get_all_copper_types()

@app.post("/weigh")
def weigh(copper_type_id: int, weight_kg: float):
    record_id = add_weigh_record(
        copper_type_id=copper_type_id,
        weight_kg=weight_kg
    )
    return {"weigh_record_id": record_id}

@app.post("/receipt/{weigh_record_id}")
def issue_receipt(weigh_record_id: int):
    receipt_id = create_receipt(weigh_record_id)
    return {"receipt_id": receipt_id}

@app.post("/receipt/{receipt_id}/cancel")
def void_receipt(receipt_id: int):
    cancel_receipt(receipt_id)
    return {"status": "cancelled"}
