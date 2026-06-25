from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
import app.models
from app.routers import users, projects, tasks, events, notifications, collaboration

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="RedFlow API")

from fastapi.staticfiles import StaticFiles
import os

os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173,http://127.0.0.1:5173")
origins = [url.strip() for url in frontend_url.split(",") if url.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include your routers
app.include_router(users.router)
app.include_router(projects.router)
app.include_router(tasks.router) 
app.include_router(events.router)
app.include_router(notifications.router)
app.include_router(collaboration.router)

@app.get("/")
def read_root():
    return {"message": "RedFlow Backend is running!"}

