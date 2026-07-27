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
from .. import models, crud, schemas
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
    frontend_context: Optional[dict] = None

class TaskDataSchema(BaseModel):
    name: str
    description: Optional[str] = ""
    status: Optional[str] = "To Do"
    priority: Optional[str] = "Medium"
    due_date: Optional[str] = None
    assignee_id: Optional[int] = None
    assignee_name: Optional[str] = None

class ProjectDataSchema(BaseModel):
    name: str
    description: str
    members: Optional[List[str]] = []
    tasks: Optional[List[TaskDataSchema]] = []

class SingleTaskCreateSchema(BaseModel):
    project_id: Optional[int] = None
    project_name: Optional[str] = None
    name: str
    description: Optional[str] = ""
    priority: Optional[str] = "Normal"
    due_date: Optional[str] = None
    assignee_id: Optional[int] = None
    assignee_name: Optional[str] = None

class SingleEventCreateSchema(BaseModel):
    title: str
    date: str
    category: Optional[str] = "Meeting"
    description: Optional[str] = ""

class AIChatResponseSchema(BaseModel):
    action: str
    response_message: str
    project_data: Optional[ProjectDataSchema] = None
    task_data: Optional[SingleTaskCreateSchema] = None
    event_data: Optional[SingleEventCreateSchema] = None

class AIChatResponse(BaseModel):
    response_message: str
    new_project_id: Optional[int] = None
    new_task_id: Optional[int] = None
    new_event_id: Optional[int] = None

@router.post("/chat", response_model=AIChatResponse)
async def chat_with_ai(
    request: AIChatRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    try:
        # 1. Build workspace context directly from frontend state if available
        context_str = "CURRENT WORKSPACE CONTEXT (FROM FRONTEND STATE):\n"
        if request.frontend_context:
            fc = request.frontend_context
            workspaces_data = fc.get("workspaces", [])
            projects_data = fc.get("projects", [])
            tasks_data = fc.get("tasks", [])
            events_data = fc.get("events", [])
            members_data = fc.get("members", [])
            current_user_data = fc.get("currentUser", {})
            
            context_str += f"Logged in User: {current_user_data.get('full_name') or current_user_data.get('email')} (ID: {current_user_data.get('id')})\n\n"
            
            context_str += "--- WORKSPACES ---\n"
            for ws in workspaces_data:
                context_str += f"Workspace ID: {ws.get('id')}, Name: '{ws.get('name')}', Role: {ws.get('user_role')}\n"
                
            context_str += "\n--- TEAM MEMBERS ---\n"
            for m in members_data:
                context_str += f"Member ID: {m.get('id')}, Name: '{m.get('name') or m.get('full_name')}', Email: {m.get('email')}, Role: {m.get('role')}\n"
                
            context_str += "\n--- PROJECTS ---\n"
            if not projects_data:
                context_str += "(No projects found)\n"
            else:
                for p in projects_data:
                    context_str += f"Project ID: {p.get('id')}, Name: '{p.get('name')}', Status: {p.get('status')}, Description: {p.get('description') or 'None'}\n"
                    
            context_str += "\n--- TASKS ---\n"
            if not tasks_data:
                context_str += "(No tasks found)\n"
            else:
                for t in tasks_data:
                    assignee_name = t.get('assignee_name') or (t.get('assignee') and (t.get('assignee').get('full_name') or t.get('assignee').get('email'))) or "Unassigned"
                    context_str += f"Task ID: {t.get('id')}, Project ID: {t.get('project_id')}, Name: '{t.get('name')}', Status: '{t.get('status')}', Priority: '{t.get('priority') or 'Normal'}', Due Date: '{t.get('due_date') or 'No Deadline'}', Assignee: '{assignee_name}', Description: '{t.get('description') or 'None'}'\n"
                    
            context_str += "\n--- CALENDAR EVENTS & MEETINGS ---\n"
            if not events_data:
                context_str += "(No calendar events found)\n"
            else:
                for e in events_data:
                    context_str += f"Event ID: {e.get('id')}, Title: '{e.get('title')}', Date/Time: '{e.get('date') or e.get('start_time')}', Category: '{e.get('category') or e.get('type') or 'Meeting'}', Status: '{e.get('status')}', Description: '{e.get('description') or 'None'}'\n"
        else:
            projects = crud.get_user_projects(db=db, user_id=current_user.id, workspace_id=request.workspace_id)
            if not projects:
                context_str += "No projects found.\n"
            else:
                for p in projects:
                    context_str += f"Project: {p.name} (Status: {p.status}, Description: {p.description or 'None'})\n"
                    for t in p.tasks:
                        assignee_name = t.assignee.full_name or t.assignee.email if getattr(t, 'assignee', None) else "Unassigned"
                        context_str += f" - Task ID {t.id}: '{t.name}' | Status: {t.status} | Priority: {t.priority or 'Normal'} | Due Date: {t.due_date or 'No Deadline'} | Assignee: {assignee_name}\n"
                    
        # Build prompt
        system_instruction = f"""
        You are an expert AI Project Management Assistant.
        Your job is to answer questions about the workspace or automate tasks like creating a project, creating a task, or adding a meeting/event.
        
        {context_str}
        
        If the user asks a question about tasks, projects, meetings, team members, or deadlines, use the CURRENT WORKSPACE CONTEXT to answer it.
        If the user wants to create a project (e.g. "We need to develop a PM tool" or "Create a project with members X and Y" or any project creation instruction), set action to 'create_project'.
        When creating a project, you MUST intelligently generate a fitting project name and a rich, professional description based on whatever instructions or context the user provided. If the user mentions specific team members (by email or name), you MUST include those identifiers in the 'members' array of project_data so they get assigned! You should also generate 2-4 realistic initial tasks for the project and assign them to the members if appropriate.
        If the user wants to create a single task (e.g. "Generate a task in the Dummy project to create a design..."), set action to 'create_task' and provide task_data with the correct project_id or project_name from context.
        If the user wants to schedule a meeting or calendar event (e.g. "Add a team meeting tomorrow at 3pm"), set action to 'create_event' and provide event_data with title, date, category='Meeting'.

        CRITICAL: You MUST respond in pure JSON matching this structure:
        {{
          "action": "answer" or "create_project" or "create_task" or "create_event",
          "response_message": "your helpful reply confirming what you did or answering the question",
          "project_data": null or {{ "name": "Generated Project Name", "description": "Comprehensive project description generated from user instructions.", "members": [ "email@example.com", "Member Name" ], "tasks": [ {{ "name": "Initial Task", "description": "Task Desc", "assignee_name": "Member Name" }} ] }},
          "task_data": null or {{ "project_id": 123, "project_name": "Name", "name": "Task Name", "description": "Desc", "priority": "High", "due_date": "2026-07-30", "assignee_name": "Member Name" }},
          "event_data": null or {{ "title": "Meeting Title", "date": "2026-07-28", "category": "Meeting", "description": "Desc" }}
        }}
        Do NOT wrap your response in markdown code blocks like ```json ... ```. Return ONLY valid JSON.
        """
        
        prompt_text = f"{system_instruction}\n\n--- PREVIOUS CONVERSATION HISTORY ---\n"
        if not request.history:
            prompt_text += "(No previous messages)\n"
        else:
            for msg in request.history:
                role_label = "USER" if msg.role == "user" else "AI ASSISTANT"
                prompt_text += f"[{role_label}]: {msg.content}\n\n"
                
        prompt_text += f"--- NEW USER MESSAGE ---\n[USER]: {request.message}\n\n[AI ASSISTANT]:"
        
        contents = [prompt_text]

        from google.genai import types
        import json

        response = client.models.generate_content(
            model='gemini-flash-lite-latest',
            contents=contents,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
            ),
        )
        
        res_text = response.text.replace('```json', '').replace('```', '').strip()
        res_dict = json.loads(res_text)
        action = res_dict.get("action", "answer")
        response_message = res_dict.get("response_message", "")
        project_data = res_dict.get("project_data")
        
        new_project_id = None
        new_task_id = None
        new_event_id = None
        
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
            
            added_member_ids = {current_user.id}
            db.execute(
                models.project_members.insert().values(
                    user_id=current_user.id,
                    project_id=new_project_id
                )
            )
            
            members_data = project_data.get("members", [])
            for m_str in members_data:
                if not m_str or not isinstance(m_str, str):
                    continue
                found_id = None
                if request.frontend_context and request.frontend_context.get("members"):
                    for fc_m in request.frontend_context.get("members", []):
                        fc_email = fc_m.get("email") or ""
                        fc_name = fc_m.get("name") or fc_m.get("full_name") or ""
                        if m_str.lower() == fc_email.lower() or m_str.lower() in fc_name.lower() or fc_name.lower() in m_str.lower():
                            found_id = fc_m.get("id")
                            break
                if not found_id:
                    u_match = db.query(models.User).filter(
                        (models.User.email.ilike(f"{m_str}")) | (models.User.full_name.ilike(f"%{m_str}%"))
                    ).first()
                    if u_match:
                        found_id = u_match.id
                        
                if found_id and found_id not in added_member_ids:
                    added_member_ids.add(found_id)
                    db.execute(
                        models.project_members.insert().values(
                            user_id=found_id,
                            project_id=new_project_id
                        )
                    )
            
            tasks_data = project_data.get("tasks", [])
            for t in tasks_data:
                t_assignee_id = t.get("assignee_id")
                t_assignee_name = t.get("assignee_name") or t.get("assignee")
                if not t_assignee_id and t_assignee_name and isinstance(t_assignee_name, str):
                    if request.frontend_context and request.frontend_context.get("members"):
                        for fc_m in request.frontend_context.get("members", []):
                            fc_name = fc_m.get("name") or fc_m.get("full_name") or fc_m.get("email") or ""
                            if t_assignee_name.lower() in fc_name.lower() or fc_name.lower() in t_assignee_name.lower():
                                t_assignee_id = fc_m.get("id")
                                break
                    if not t_assignee_id:
                        u_match = db.query(models.User).filter(
                            (models.User.email.ilike(t_assignee_name)) | (models.User.full_name.ilike(f"%{t_assignee_name}%"))
                        ).first()
                        if u_match:
                            t_assignee_id = u_match.id
                
                new_task = models.Task(
                    name=t.get("name", "Task"),
                    description=t.get("description", ""),
                    project_id=new_project_id,
                    status=t.get("status") or "To Do",
                    priority=t.get("priority") or "Medium",
                    due_date=t.get("due_date"),
                    assignee_id=t_assignee_id,
                    created_by_id=current_user.id
                )
                db.add(new_task)
            
            db.commit()
            
        elif action == "create_task" and res_dict.get("task_data"):
            t_data = res_dict.get("task_data", {})
            proj_id = t_data.get("project_id")
            if not proj_id and t_data.get("project_name"):
                p_match = db.query(models.Project).filter(models.Project.name.ilike(f"%{t_data['project_name']}%")).first()
                if p_match:
                    proj_id = p_match.id
            if not proj_id:
                first_proj = db.query(models.Project).filter(models.Project.workspace_id == request.workspace_id).first()
                if first_proj:
                    proj_id = first_proj.id
            if proj_id:
                assignee_id = t_data.get("assignee_id")
                if not assignee_id and t_data.get("assignee_name") and request.frontend_context:
                    for m in request.frontend_context.get("members", []):
                        m_name = m.get("name") or m.get("full_name") or ""
                        if t_data["assignee_name"].lower() in m_name.lower():
                            assignee_id = m.get("id")
                            break
                task_schema = schemas.TaskCreate(
                    name=t_data.get("name") or "New Task",
                    description=t_data.get("description") or "",
                    project_id=proj_id,
                    priority=t_data.get("priority") or "Medium",
                    due_date=t_data.get("due_date"),
                    assignee_id=assignee_id
                )
                created_task = crud.create_task(db=db, task=task_schema, user_id=current_user.id)
                if created_task:
                    db.commit()
                    db.refresh(created_task)
                    new_task_id = created_task.id

        elif action == "create_event" and res_dict.get("event_data"):
            e_data = res_dict.get("event_data", {})
            event_schema = schemas.EventCreate(
                title=e_data.get("title") or "New Meeting",
                date=e_data.get("date") or "Today",
                type=e_data.get("category") or "Meeting",
                description=e_data.get("description") or ""
            )
            created_event = crud.create_event(db=db, event=event_schema, user_id=current_user.id)
            if created_event:
                db.commit()
                db.refresh(created_event)
                new_event_id = created_event.id
            
        return AIChatResponse(
            response_message=response_message,
            new_project_id=new_project_id,
            new_task_id=new_task_id,
            new_event_id=new_event_id
        )
        
    except Exception as e:
        print(f"\\n--- AI CHAT ERROR --- \\n{str(e)}\\n-----------------\\n")
        raise HTTPException(status_code=500, detail=f"AI Chat Error: {str(e)}")