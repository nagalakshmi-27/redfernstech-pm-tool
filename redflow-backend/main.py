from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
import app.models
from app.routers import users, projects, tasks, events, notifications, collaboration, workspaces, notebooks, integrations, webhooks, subtasks, worklogs, ai

# Create tables
Base.metadata.create_all(bind=engine)

from sqlalchemy import text
try:
    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE tasks ADD COLUMN created_by_id INTEGER REFERENCES users(id)"))
except Exception:
    pass

try:
    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE activities ADD COLUMN ticket_id VARCHAR"))
except Exception:
    pass

try:
    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE notifications ADD COLUMN workspace_id INTEGER REFERENCES workspaces(id)"))
except Exception:
    pass

try:
    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE notebook_items ADD COLUMN original_content VARCHAR"))
except Exception:
    pass

try:
    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE users ADD COLUMN preferences JSON DEFAULT '{}'::jsonb"))
except Exception:
    pass

try:
    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE tasks ADD COLUMN updated_at TIMESTAMP"))
except Exception as e:
    print(f"Migration error: {e}")

app = FastAPI(title="RedFlow API")

from fastapi.staticfiles import StaticFiles
import os

os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

frontend_url = os.getenv("FRONTEND_URL", "https://main.d2zlo70oepu5a3.amplifyapp.com,http://localhost:5173,http://127.0.0.1:5173")
origins = [url.strip() for url in frontend_url.split(",") if url.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include your routers
app.include_router(workspaces.router)
app.include_router(users.router)
app.include_router(projects.router)
app.include_router(tasks.router) 

app.include_router(events.router)
app.include_router(notifications.router)
app.include_router(collaboration.router)
app.include_router(notebooks.router)
app.include_router(integrations.router)
app.include_router(integrations.public_router)
app.include_router(subtasks.router)
app.include_router(worklogs.router)
app.include_router(webhooks.router)
app.include_router(ai.router)

@app.get("/")
def read_root():
    return {"message": "RedFlow Backend is running!"}
