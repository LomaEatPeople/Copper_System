from fastapi import FastAPI

from init_db import init_db

app = FastAPI()

@app.get("/")
def read_root():
    return {'message': 'Welcome to the Copper System API!'}

try:
    init_db()
    print("DB created")
except Exception as e:
    print(e)