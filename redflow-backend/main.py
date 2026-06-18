from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
import app.models
from app.routers import users, projects, tasks, events, notifications

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="RedFlow API")

# Configure CORS so the React frontend can communicate with the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "*"
    ],
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

@app.get("/")
def read_root():
    return {"message": "RedFlow Backend is running!"}

