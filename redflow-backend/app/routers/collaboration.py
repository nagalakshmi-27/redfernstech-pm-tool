import os
import shutil
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, UploadFile, File, Form
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from typing import List, Dict, Optional
from .. import schemas, models
from .users import get_current_user, get_db

router = APIRouter(tags=["Collaboration"])

# --- COMMENTS ---
@router.get("/tasks/{task_id}/comments", response_model=List[schemas.CommentResponse])
def get_comments(task_id: int, db: Session = Depends(get_db)):
    return db.query(models.Comment).filter(models.Comment.task_id == task_id).all()

@router.post("/tasks/{task_id}/comments", response_model=schemas.CommentResponse)
def create_comment(task_id: int, comment: schemas.CommentCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_comment = models.Comment(**comment.model_dump(), task_id=task_id, user_id=current_user.id)
    db.add(db_comment)
    db.commit()
    db.refresh(db_comment)
    import re
    mentions = re.findall(r'@(\w+)', comment.content)
    if mentions:
        task = db.query(models.Task).filter(models.Task.id == task_id).first()
        for m in mentions:
            mentioned_user = db.query(models.User).filter(func.replace(models.User.full_name, ' ', '').ilike(f"{m}%")).first()
            if mentioned_user and mentioned_user.id != current_user.id:
                notif = models.Notification(
                    user_id=mentioned_user.id,
                    message=f"{current_user.full_name or current_user.email} mentioned you in a comment on {task.ticket_id if task and task.ticket_id else f'Task #{task_id}'}: '{comment.content[:30]}...'",
                    type="Mention",
                    link=f"/projects/{task.project_id}" if task else "/projects"
                )
                db.add(notif)
        db.commit()
    
    return db_comment

# --- WIKI ---
@router.get("/projects/{project_id}/wikis", response_model=List[schemas.WikiResponse])
def get_wikis(project_id: int, search: Optional[str] = None, category: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(models.WikiPage).filter(models.WikiPage.project_id == project_id)
    if search:
        query = query.filter(models.WikiPage.title.ilike(f"%{search}%"))
    if category:
        query = query.filter(models.WikiPage.category == category)
    return query.all()

@router.post("/projects/{project_id}/wikis/upload", response_model=schemas.WikiResponse)
def upload_wiki_file(
    project_id: int, 
    file: UploadFile = File(...), 
    title: str = Form(...),
    category: Optional[str] = Form(None),
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
):
    os.makedirs("uploads/docs", exist_ok=True)
    file_path = f"uploads/docs/{file.filename}"
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    db_wiki = models.WikiPage(
        title=title, 
        doc_type="file",
        category=category,
        file_url=f"/uploads/docs/{file.filename}",
        project_id=project_id, 
        author_id=current_user.id
    )
    db.add(db_wiki)
    db.commit()
    db.refresh(db_wiki)
    return db_wiki

@router.post("/projects/{project_id}/wikis", response_model=schemas.WikiResponse)
def create_wiki(project_id: int, wiki: schemas.WikiCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_wiki = models.WikiPage(**wiki.model_dump(), project_id=project_id, author_id=current_user.id)
    db.add(db_wiki)
    db.commit()
    db.refresh(db_wiki)
    return db_wiki

@router.put("/projects/{project_id}/wikis/{wiki_id}", response_model=schemas.WikiResponse)
def update_wiki(project_id: int, wiki_id: int, wiki_update: schemas.WikiUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_wiki = db.query(models.WikiPage).filter(models.WikiPage.id == wiki_id, models.WikiPage.project_id == project_id).first()
    if not db_wiki:
        raise HTTPException(status_code=404, detail="Wiki not found")
        
    # Save Snapshot to History before updating
    snapshot = models.WikiPageHistory(
        wiki_id=db_wiki.id,
        title=db_wiki.title,
        content=db_wiki.content,
        author_id=current_user.id
    )
    db.add(snapshot)
    
    if wiki_update.title is not None:
        db_wiki.title = wiki_update.title
    if wiki_update.content is not None:
        db_wiki.content = wiki_update.content
    if wiki_update.doc_type is not None:
        db_wiki.doc_type = wiki_update.doc_type
    if wiki_update.category is not None:
        db_wiki.category = wiki_update.category
    if wiki_update.file_url is not None:
        db_wiki.file_url = wiki_update.file_url
        
    db.commit()
    db.refresh(db_wiki)
    return db_wiki

@router.delete("/projects/{project_id}/wikis/{wiki_id}")
def delete_wiki(project_id: int, wiki_id: int, db: Session = Depends(get_db)):
    db_wiki = db.query(models.WikiPage).filter(models.WikiPage.id == wiki_id, models.WikiPage.project_id == project_id).first()
    if not db_wiki:
        raise HTTPException(status_code=404, detail="Wiki not found")
    
    if db_wiki.doc_type == "file" and db_wiki.file_url:
        file_path = db_wiki.file_url.lstrip("/")
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
            except Exception as e:
                print(f"Error deleting file {file_path}: {e}")
                
    db.delete(db_wiki)
    db.commit()
    return {"message": "Wiki deleted successfully"}

# --- WIKI HISTORY ---
@router.get("/projects/{project_id}/wikis/{wiki_id}/history", response_model=List[schemas.WikiHistoryResponse])
def get_wiki_history(project_id: int, wiki_id: int, db: Session = Depends(get_db)):
    history = db.query(models.WikiPageHistory).join(models.WikiPage).filter(
        models.WikiPageHistory.wiki_id == wiki_id,
        models.WikiPage.project_id == project_id
    ).order_by(models.WikiPageHistory.created_at.desc()).all()
    return history

@router.get("/projects/{project_id}/wikis/{wiki_id}/history/{version_id}", response_model=schemas.WikiHistoryResponse)
def get_wiki_history_detail(project_id: int, wiki_id: int, version_id: int, db: Session = Depends(get_db)):
    version = db.query(models.WikiPageHistory).join(models.WikiPage).filter(
        models.WikiPageHistory.id == version_id,
        models.WikiPageHistory.wiki_id == wiki_id,
        models.WikiPage.project_id == project_id
    ).first()
    if not version:
        raise HTTPException(status_code=404, detail="Version not found")
    return version

@router.post("/projects/{project_id}/wikis/{wiki_id}/restore/{version_id}", response_model=schemas.WikiResponse)
def restore_wiki_version(project_id: int, wiki_id: int, version_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_wiki = db.query(models.WikiPage).filter(models.WikiPage.id == wiki_id, models.WikiPage.project_id == project_id).first()
    if not db_wiki:
        raise HTTPException(status_code=404, detail="Wiki not found")
        
    version = db.query(models.WikiPageHistory).filter(models.WikiPageHistory.id == version_id, models.WikiPageHistory.wiki_id == wiki_id).first()
    if not version:
        raise HTTPException(status_code=404, detail="Version not found")
        
    # Save a snapshot of the current state before we overwrite it with the restored version
    snapshot = models.WikiPageHistory(
        wiki_id=db_wiki.id,
        title=db_wiki.title,
        content=db_wiki.content,
        author_id=current_user.id
    )
    db.add(snapshot)
    
    # Restore
    db_wiki.title = version.title
    db_wiki.content = version.content
    
    db.commit()
    db.refresh(db_wiki)
    return db_wiki

# --- CHAT MESSAGES HISTORY ---
@router.get("/projects/{project_id}/messages", response_model=List[schemas.MessageResponse])
def get_project_messages(project_id: int, db: Session = Depends(get_db)):
    return db.query(models.Message).filter(models.Message.project_id == project_id).order_by(models.Message.created_at.asc()).all()

# --- WEBSOCKET CHAT MANAGER ---
class ConnectionManager:
    def __init__(self):
        # Maps project_id to a list of active WebSocket connections
        self.active_connections: Dict[int, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, project_id: int):
        await websocket.accept()
        if project_id not in self.active_connections:
            self.active_connections[project_id] = []
        self.active_connections[project_id].append(websocket)

    def disconnect(self, websocket: WebSocket, project_id: int):
        if project_id in self.active_connections:
            self.active_connections[project_id].remove(websocket)

    async def broadcast_to_project(self, message: str, project_id: int):
        if project_id in self.active_connections:
            for connection in self.active_connections[project_id]:
                await connection.send_text(message)

manager = ConnectionManager()

@router.post("/projects/{project_id}/messages/upload", response_model=schemas.MessageResponse)
async def upload_chat_file(
    project_id: int, 
    file: UploadFile = File(...), 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
):
    os.makedirs("uploads/chat", exist_ok=True)
    file_path = f"uploads/chat/{file.filename}"
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    db_message = models.Message(
        content="[Shared a file]", 
        file_url=f"/uploads/chat/{file.filename}",
        file_name=file.filename,
        project_id=project_id, 
        user_id=current_user.id
    )
    db.add(db_message)
    
    # Add to wiki as well
    wiki_page = models.WikiPage(
        title=f"{file.filename} (Shared in Chat)",
        doc_type="file",
        file_url=f"/uploads/chat/{file.filename}",
        project_id=project_id,
        author_id=current_user.id
    )
    db.add(wiki_page)
    
    db.commit()
    db.refresh(db_message)
    
    # Broadcast
    import json
    broadcast_msg = json.dumps({
        "id": db_message.id,
        "content": db_message.content,
        "file_url": db_message.file_url,
        "file_name": db_message.file_name,
        "user_id": current_user.id,
        "user": {"id": current_user.id, "full_name": current_user.full_name},
        "created_at": db_message.created_at.isoformat()
    })
    await manager.broadcast_to_project(broadcast_msg, project_id)
    
    return db_message

@router.websocket("/ws/projects/{project_id}/chat")
async def websocket_endpoint(websocket: WebSocket, project_id: int, db: Session = Depends(get_db)):
    await manager.connect(websocket, project_id)
    try:
        while True:
            # Wait for a message from the client
            data = await websocket.receive_text()
            
            # The client will send JSON with user_id and content. 
            # In a production app, we'd authenticate the WebSocket using a token here!
            import json
            try:
                payload = json.loads(data)
                user_id = payload.get("user_id")
                content = payload.get("content")
                
                # Save to Database
                if user_id and content:
                    db_message = models.Message(content=content, project_id=project_id, user_id=user_id)
                    db.add(db_message)
                    db.commit()
                    db.refresh(db_message)
                    
                    user = db.query(models.User).filter(models.User.id == user_id).first()
                    
                    import re
                    mentions = re.findall(r'@(\w+)', content)
                    if mentions:
                        for m in mentions:
                            mentioned_user = db.query(models.User).filter(func.replace(models.User.full_name, ' ', '').ilike(f"{m}%")).first()
                            if mentioned_user and mentioned_user.id != user_id:
                                notif = models.Notification(
                                    user_id=mentioned_user.id,
                                    message=f"{user.full_name or user.email} mentioned you in Project #{project_id} Chat: '{content[:30]}...'",
                                    type="Mention",
                                    link=f"/projects/{project_id}"
                                )
                                db.add(notif)
                        db.commit()
                    
                    # Broadcast to everyone else in this project's room
                    broadcast_msg = json.dumps({
                        "id": db_message.id,
                        "content": db_message.content,
                        "user_id": user.id,
                        "user": {"id": user.id, "full_name": user.full_name},
                        "created_at": db_message.created_at.isoformat()
                    })
                    await manager.broadcast_to_project(broadcast_msg, project_id)
            except Exception as e:
                pass
                
    except WebSocketDisconnect:
        manager.disconnect(websocket, project_id)

from typing import Any, Dict

@router.get("/projects/{project_id}/activity", response_model=List[Dict[str, Any]])
def get_project_activity(project_id: int, db: Session = Depends(get_db)):
    comments = db.query(models.Comment).outerjoin(models.Task, models.Comment.task_id == models.Task.id).filter(
        or_(
            models.Task.project_id == project_id,
            models.Comment.project_id == project_id
        )
    ).all()
    
    activities = db.query(models.Activity).filter(
        models.Activity.project_id == project_id
    ).all()
    
    feed = []
    
    for c in comments:
        user_data = None
        if c.user:
            user_data = {"id": c.user.id, "full_name": c.user.full_name, "email": c.user.email}
            
        task_data = None
        if c.task:
            task_data = {"id": c.task.id, "ticket_id": c.task.ticket_id, "name": c.task.name}
            
        feed.append({
            "type": "comment",
            "id": c.id,
            "content": c.content,
            "created_at": c.created_at.isoformat() if c.created_at else None,
            "user": user_data,
            "task": task_data,
            "project_id": c.project_id,
            "task_id": c.task_id
        })
        
    for a in activities:
        user_data = None
        if a.user:
            user_data = {"id": a.user.id, "full_name": a.user.full_name, "email": a.user.email}
            
        feed.append({
            "type": "event",
            "id": a.id,
            "action": a.action,
            "target_name": a.target_name,
            "target_type": a.target_type,
            "ticket_id": a.ticket_id,
            "created_at": a.created_at.isoformat() if a.created_at else None,
            "user": user_data,
            "project_id": a.project_id
        })
        
    # Sort by created_at descending
    feed.sort(key=lambda x: x["created_at"] or "", reverse=True)
    return feed

@router.post("/projects/{project_id}/comments", response_model=schemas.CommentResponse)
def create_project_comment(project_id: int, comment: schemas.CommentCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_comment = models.Comment(**comment.model_dump(), project_id=project_id, user_id=current_user.id)
    db.add(db_comment)
    db.commit()
    db.refresh(db_comment)
    
    import re
    mentions = re.findall(r'@(\w+)', comment.content)
    if mentions:
        for m in mentions:
            mentioned_user = db.query(models.User).filter(func.replace(models.User.full_name, ' ', '').ilike(f"{m}%")).first()
            if mentioned_user and mentioned_user.id != current_user.id:
                notif = models.Notification(
                    user_id=mentioned_user.id,
                    message=f"{current_user.full_name or current_user.email} mentioned you in a project comment: '{comment.content[:30]}...'",
                    type="Mention",
                    link=f"/projects/{project_id}"
                )
                db.add(notif)
        db.commit()
    
    return db_comment