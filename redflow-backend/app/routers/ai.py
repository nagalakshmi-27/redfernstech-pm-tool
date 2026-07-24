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

from typing import List, Optional

class SmartSummaryRequest(BaseModel):
    start_date: str
    end_date: str
    workspace_id: int
    project_ids: List[int] = []
    local_start_date: str = None
    local_end_date: str = None

class SmartSummaryResponse(BaseModel):
    summary: str

from .users import get_current_user, get_db
from sqlalchemy.orm import Session
from sqlalchemy import or_
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
        
        # Prevent future dates
        now = datetime.utcnow()
        if start_date.date() > now.date() or end_date.date() > now.date():
            raise HTTPException(status_code=400, detail="Summary dates cannot be in the future.")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use ISO format.")

    projects = crud.get_user_projects(db=db, user_id=current_user.id, workspace_id=request.workspace_id)
    allowed_project_ids = [p.id for p in projects]

    if request.project_ids:
        # Verify user has access to all requested projects
        for pid in request.project_ids:
            if pid not in allowed_project_ids:
                raise HTTPException(status_code=403, detail="You do not have access to one or more selected projects.")
        target_project_ids = request.project_ids
    else:
        target_project_ids = allowed_project_ids

    if not target_project_ids:
        return SmartSummaryResponse(summary="<p>No projects found or you do not have access to them.</p>")

    activities = db.query(models.Activity).filter(
        models.Activity.project_id.in_(target_project_ids),
        models.Activity.created_at >= start_date,
        models.Activity.created_at <= end_date
    ).all()

    # Get all tasks for these projects to find comments, attachments, and worklogs
    all_project_tasks = db.query(models.Task).filter(models.Task.project_id.in_(target_project_ids)).all()
    task_ids = [t.id for t in all_project_tasks]
    
    comments = []
    attachments = []
    worklogs = []
    
    if task_ids:
        comments = db.query(models.Comment).filter(
            models.Comment.task_id.in_(task_ids),
            models.Comment.created_at >= start_date,
            models.Comment.created_at <= end_date
        ).all()
        
        attachments = db.query(models.TaskAttachment).filter(
            models.TaskAttachment.task_id.in_(task_ids),
            models.TaskAttachment.created_at >= start_date,
            models.TaskAttachment.created_at <= end_date
        ).all()
        
        worklogs = db.query(models.WorkLog).filter(
            models.WorkLog.task_id.in_(task_ids),
            models.WorkLog.created_at >= start_date,
            models.WorkLog.created_at <= end_date
        ).all()

    messages = db.query(models.Message).filter(
        models.Message.project_id.in_(target_project_ids),
        models.Message.created_at >= start_date,
        models.Message.created_at <= end_date
    ).all()
    
    wikis = db.query(models.WikiPage).filter(
        models.WikiPage.project_id.in_(target_project_ids),
        models.WikiPage.created_at >= start_date,
        models.WikiPage.created_at <= end_date
    ).all()
    
    wiki_histories = db.query(models.WikiPageHistory).join(models.WikiPage).filter(
        models.WikiPage.project_id.in_(target_project_ids),
        models.WikiPageHistory.created_at >= start_date,
        models.WikiPageHistory.created_at <= end_date
    ).all()

    if not activities and not comments and not messages and not attachments and not worklogs and not wikis and not wiki_histories:
        return SmartSummaryResponse(summary="<p>There was no activity in your projects during this time frame.</p>")
    display_start = request.local_start_date or start_date.strftime('%b %d, %Y')
    display_end = request.local_end_date or end_date.strftime('%b %d, %Y')
    
    prompt = f"Summarize the following project activity between {display_start} and {display_end}:\n\n"
    
    for project in projects:
        p_activities = [a for a in activities if a.project_id == project.id]
        p_task_ids = [t.id for t in all_project_tasks if t.project_id == project.id]
        p_comments = [c for c in comments if c.task_id in p_task_ids]
        p_messages = [m for m in messages if m.project_id == project.id]
        p_attachments = [a for a in attachments if a.task_id in p_task_ids]
        p_worklogs = [w for w in worklogs if w.task_id in p_task_ids]
        p_wikis = [w for w in wikis if w.project_id == project.id]
        p_wiki_histories = [wh for wh in wiki_histories if wh.page.project_id == project.id]
        
        if not any([p_activities, p_comments, p_messages, p_attachments, p_worklogs, p_wikis, p_wiki_histories]):
            continue
            
        prompt += f"\n\n--- ACTIVITY FOR PROJECT: '{project.name}' ---\n"
        
        if p_activities:
            prompt += "Activity Logs:\n"
            for a in p_activities:
                author = a.user.full_name or a.user.username if a.user else "Someone"
                prompt += f"- {author} {a.action} ({a.target_type}: {a.target_name})\n"
                
        if p_comments:
            prompt += "Task Comments:\n"
            for c in p_comments:
                author = c.user.full_name or c.user.username if c.user else "Someone"
                prompt += f"- {author} said: '{c.content}'\n"
                
        if p_messages:
            prompt += "Project Chat Messages:\n"
            for m in p_messages:
                author = m.user.full_name or m.user.username if m.user else "Someone"
                prompt += f"- {author} said: '{m.content}'\n"
                
        if p_attachments:
            prompt += "Attachments:\n"
            for a in p_attachments:
                author = a.user.full_name or a.user.username if a.user else "Someone"
                prompt += f"- {author} uploaded a file: '{a.file_name}' to a task.\n"
                
        if p_worklogs:
            prompt += "Work Logs (Time Logged):\n"
            task_hours = {}
            for wl in p_worklogs:
                task_hours[wl.task_id] = task_hours.get(wl.task_id, 0) + wl.hours_spent
            for task_id, hours in task_hours.items():
                task_name = next((t.name for t in all_project_tasks if t.id == task_id), f"Task ID {task_id}")
                prompt += f"- Total {hours} hours spent on task '{task_name}'.\n"
                
        if p_wikis or p_wiki_histories:
            prompt += "Wiki Document Updates:\n"
            for w in p_wikis:
                prompt += f"- New wiki page created: '{w.title}'\n"
            for wh in p_wiki_histories:
                author = wh.user.full_name or wh.user.username if wh.user else "Someone"
                prompt += f"- {author} updated wiki page: '{wh.page.title}'\n"
            
    if display_start == display_end:
        date_string = display_start
    else:
        date_string = f"{display_start} - {display_end}"

    prompt += f"""
    \nYou are an expert PM assistant. 
    Format your response beautifully using HTML. 
    You must include a main heading at the very top: <h2>Project Activity Summary ({date_string})</h2>
    
    CRITICAL INSTRUCTION: You MUST maintain the Project-by-Project grouping provided in the input data. 
    Do NOT merge activities from different projects together. 
    For each project, output EXACTLY like this structure:
    
    <strong>Project:</strong> [Project Name]
    <br/><br/>
    <strong>Task Progress & Updates</strong>
    <ul>
      <li><strong>[Brief Topic]:</strong> [Concise summary of the person's actions, e.g. 'Akansha Thakur successfully moved the task Implement API Auth to Completed.'].</li>
    </ul>
    <strong>Team Discussions & Milestones</strong>
    <ul>
      <li><strong>[Brief Topic]:</strong> [Concise summary of the chat/discussion, e.g. 'Akansha shared updates...'].</li>
    </ul>
    <br/><br/>
    
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

class AIChatHistoryItem(BaseModel):
    role: str
    content: str

class AIChatRequest(BaseModel):
    workspace_id: int
    message: str
    history: List[AIChatHistoryItem] = []

class TaskDataSchema(BaseModel):
    name: str
    description: str

class ProjectDataSchema(BaseModel):
    name: str
    description: str
    tasks: List[TaskDataSchema]

class AIChatResponseSchema(BaseModel):
    action: str
    response_message: str
    project_data: Optional[ProjectDataSchema] = None

class AIChatResponse(BaseModel):
    response_message: str
    new_project_id: Optional[int] = None

@router.post("/chat", response_model=AIChatResponse)
async def chat_with_ai(
    request: AIChatRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    try:
        # 1. Fetch workspace context
        projects = crud.get_user_projects(db=db, user_id=current_user.id, workspace_id=request.workspace_id)
        
        # Build context string
        context_str = "CURRENT WORKSPACE CONTEXT:\n"
        if not projects:
            context_str += "No projects found.\n"
        else:
            for p in projects:
                context_str += f"Project: {p.name} (Status: {p.status})\n"
                for t in p.tasks:
                    context_str += f" - Task: {t.name} (Status: {t.status})\n"
                    
        # Build prompt
        system_instruction = f"""
        You are an expert AI Project Management Assistant.
        Your job is to answer questions about the workspace or automate tasks like creating a project.
        
        {context_str}
        
        If the user asks a question, use the context to answer it. 
        If the user wants to create a project (e.g. "We need to develop a PM tool"), figure out the project name, description, and a logical list of tasks to break it down. Set action to 'create_project'.
        """
        
        contents = [system_instruction]
        
        for msg in request.history:
            prefix = "User: " if msg.role == "user" else "Assistant: "
            contents.append(prefix + msg.content)
            
        contents.append("User: " + request.message)

        from google.genai import types
        import json

        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=contents,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=AIChatResponseSchema,
            ),
        )
        
        res_dict = json.loads(response.text)
        action = res_dict.get("action", "answer")
        response_message = res_dict.get("response_message", "")
        project_data = res_dict.get("project_data")
        
        new_project_id = None
        
        if action == "create_project" and project_data:
            new_project = models.Project(
                name=project_data.get("name", "New Project"),
                description=project_data.get("description", ""),
                workspace_id=request.workspace_id,
                created_by_id=current_user.id,
                status="Planning",
                board_type="kanban",
            )
            db.add(new_project)
            db.commit()
            db.refresh(new_project)
            new_project_id = new_project.id
            
            tasks_data = project_data.get("tasks", [])
            for t in tasks_data:
                new_task = models.Task(
                    name=t.get("name", "Task"),
                    description=t.get("description", ""),
                    project_id=new_project_id,
                    status="To Do",
                    priority="Medium"
                )
                db.add(new_task)
            
            db.execute(
                models.project_members.insert().values(
                    user_id=current_user.id,
                    project_id=new_project_id
                )
            )
            db.commit()
            
        return AIChatResponse(
            response_message=response_message,
            new_project_id=new_project_id
        )
        
    except Exception as e:
        print(f"\\n--- AI CHAT ERROR --- \\n{str(e)}\\n-----------------\\n")
        raise HTTPException(status_code=500, detail=f"AI Chat Error: {str(e)}")