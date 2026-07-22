import os
from google import genai
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=api_key)

# ----- NEW DIAGNOSTIC TRICK -----
# This will print all available models to your terminal when the server starts
try:
    print("\n--- AVAILABLE MODELS FOR YOUR KEY ---")
    for m in client.models.list():
        # Only print models that support text generation
        if "generateContent" in m.supported_actions:
            print(m.name)
    print("--------------------------------------\n")
except Exception as e:
    print("Could not list models:", e)
# --------------------------------

router = APIRouter(prefix="/api/ai", tags=["AI"])

class NoteCleanupRequest(BaseModel):
    raw_note: str

class NoteCleanupResponse(BaseModel):
    cleaned_note: str

@router.post("/notes/cleanup", response_model=NoteCleanupResponse)
async def cleanup_note(request: NoteCleanupRequest):
    if not request.raw_note.strip():
        raise HTTPException(status_code=400, detail="Note content cannot be empty.")

    prompt = f"""
    You are an expert AI Note taking assistant. 
    Your job is to take the following messy thoughts and turn them into a clean, 
    highly organized, and grammatically correct plan. 
    
    Rules:
    - Fix all spelling and grammar mistakes.
    - Categorize points logically if they are scattered.
    - CRITICAL: You must return the output as pure HTML elements (e.g., <h1>, <ul>, <li>, <p>, <strong>). 
    - DO NOT wrap the output in markdown code blocks like ```html ... ```. 
    - Do not add any conversational text. 

    Raw Note (may contain HTML):
    {request.raw_note}
    """

    try:
        # We are trying the newest Gemini 3.5 Flash model here!
        response = client.models.generate_content(
            model='gemini-flash-lite-latest',
            contents=prompt,
        )
        clean_html = response.text.replace('```html', '').replace('```', '').strip()
        return NoteCleanupResponse(cleaned_note=clean_html)
    except Exception as e:
        print(f"\n--- AI ERROR --- \n{str(e)}\n-----------------\n")
        raise HTTPException(status_code=500, detail=f"AI Error: {str(e)}")

class SmartSummaryRequest(BaseModel):
    start_date: str
    end_date: str

class SmartSummaryResponse(BaseModel):
    summary: str

from .users import get_current_user, get_db
from sqlalchemy.orm import Session
from fastapi import Depends
from .. import models, crud
from datetime import datetime

@router.post("/smart-summary", response_model=SmartSummaryResponse)
async def get_smart_summary(
    request: SmartSummaryRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    try:
        # Parse ISO date strings to naive datetimes
        start_date = datetime.fromisoformat(request.start_date.replace('Z', '+00:00')).replace(tzinfo=None)
        end_date = datetime.fromisoformat(request.end_date.replace('Z', '+00:00')).replace(tzinfo=None)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use ISO format.")

    projects = crud.get_user_projects(db=db, user_id=current_user.id)
    project_ids = [p.id for p in projects]

    if not project_ids:
        return SmartSummaryResponse(summary="<p>You are not part of any projects, so there is no activity to summarize.</p>")

    tasks = db.query(models.Task).filter(
        models.Task.project_id.in_(project_ids),
        models.Task.created_at >= start_date,
        models.Task.created_at <= end_date
    ).all()

    # Get all tasks for these projects to find comments
    all_project_task_ids = [t.id for t in db.query(models.Task.id).filter(models.Task.project_id.in_(project_ids)).all()]
    
    comments = []
    if all_project_task_ids:
        comments = db.query(models.Comment).filter(
            models.Comment.task_id.in_(all_project_task_ids),
            models.Comment.created_at >= start_date,
            models.Comment.created_at <= end_date
        ).all()

    messages = db.query(models.Message).filter(
        models.Message.project_id.in_(project_ids),
        models.Message.created_at >= start_date,
        models.Message.created_at <= end_date
    ).all()

    if not tasks and not comments and not messages:
        return SmartSummaryResponse(summary="<p>There was no activity in your projects during this time frame.</p>")

    prompt = f"Summarize the following project activity between {start_date.strftime('%b %d, %Y')} and {end_date.strftime('%b %d, %Y')}:\n\n"
    
    if tasks:
        prompt += "Tasks created:\n"
        for t in tasks:
            prompt += f"- {t.name} (Status: {t.status})\n"
    
    if comments:
        prompt += "\nComments made on tasks:\n"
        for c in comments:
            author = c.user.full_name or c.user.username if c.user else "Someone"
            prompt += f"- {author} said: '{c.content}'\n"
            
    if messages:
        prompt += "\nMessages sent in project chats:\n"
        for m in messages:
            author = m.user.full_name or m.user.username if m.user else "Someone"
            prompt += f"- {author} said: '{m.content}'\n"
            
    prompt += """
    \nYou are an expert PM assistant. 
    Format your response beautifully using HTML. Use headings like <h3>, bullet points, and <strong> text for emphasis.
    Group the summary logically by what happened (e.g. 'New Tasks', 'Team Discussions', etc).
    CRITICAL: You must return the output as pure HTML. DO NOT wrap the output in markdown code blocks like ```html ... ```. 
    Do not add any conversational text.
    """

    try:
        response = client.models.generate_content(
            model='gemini-flash-lite-latest',
            contents=prompt,
        )
        clean_html = response.text.replace('```html', '').replace('```', '').strip()
        return SmartSummaryResponse(summary=clean_html)
    except Exception as e:
        print(f"\n--- AI ERROR --- \n{str(e)}\n-----------------\n")
        raise HTTPException(status_code=500, detail=f"AI Error generating summary: {str(e)}")