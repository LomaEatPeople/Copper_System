from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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