from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
import app.models
from app.routers import users # Import your new router
from app.routers import users, projects  # projects

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="RedFlow API")

# Configure CORS so the React frontend can communicate with the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], # Your React frontend URL
    allow_credentials=True,
    allow_methods=["*"], # Allow all methods (GET, POST, PUT, DELETE)
    allow_headers=["*"],
)

# Include your routers
app.include_router(users.router)
app.include_router(projects.router)

@app.get("/")
def read_root():
    return {"message": "RedFlow Backend is running!"}

