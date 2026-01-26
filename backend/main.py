from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from weigh_service import add_weigh_record

app = FastAPI(title="Copper System API")

# อนุญาตให้ React เรียก
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8000"],  # Vite
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"status": "Copper Backend Running"}

if __name__ == "__main__":
    total = add_weigh_record(
        copper_type_id=1,
        weight_kg=12.5
    )
    print("Total price:", total)