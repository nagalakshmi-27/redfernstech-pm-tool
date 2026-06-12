from fastapi import FastAPI
from app.database import engine, Base

# Create tables in the database automatically
Base.metadata.create_all(bind=engine)

app = FastAPI(title="RedFlow API")

@app.get("/")
def read_root():
    return {"message": "RedFlow Backend is running!"}