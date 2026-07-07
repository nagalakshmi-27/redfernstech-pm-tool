from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
import os
import shutil
from sqlalchemy.orm import Session
from typing import List
from .. import crud, schemas, database, models
from .users import get_current_user, get_db
from ..services import calendar_service, notification_service

router = APIRouter(prefix="/tasks", tags=["Tasks"])

@router.get("/", response_model=List[schemas.TaskResponse])
def read_tasks(
    workspace_id: int = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return crud.get_user_tasks(
        db=db,
        user_id=current_user.id,
        workspace_id=workspace_id,
    )

@router.post("/", response_model=schemas.TaskResponse)
def create_task(task: schemas.TaskCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    new_task = crud.create_task(db=db, task=task, user_id=current_user.id)
    if not new_task:
        raise HTTPException(status_code=403, detail="Not authorized! Only project members can add tasks.")
        
    if new_task.project and new_task.project.workspace_id:
        if new_task.due_date:
            calendar_service.sync_task_due_date(new_task, new_task.project.workspace_id, db)
        notification_service.notify_task_created(new_task, new_task.project.workspace_id, db)
        
    return new_task

@router.put("/{task_id}", response_model=schemas.TaskResponse)
def update_task(task_id: int, task: schemas.TaskUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # Fetch old state before updating
    old_task = db.query(models.Task).filter(models.Task.id == task_id).first()
    old_status = old_task.status if old_task else None

    updated_task = crud.update_task(db=db, task_id=task_id, task_update=task, user_id=current_user.id)
    if not updated_task:
        raise HTTPException(status_code=403, detail="Not authorized to edit this task.")
        
    if updated_task.project and updated_task.project.workspace_id:
        if updated_task.due_date:
            calendar_service.sync_task_due_date(updated_task, updated_task.project.workspace_id, db)
        if old_status:
            notification_service.notify_task_update(updated_task, old_status, updated_task.project.workspace_id, db)
        
    return updated_task

@router.delete("/{task_id}")
def delete_task(task_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    success = crud.delete_task(db=db, task_id=task_id, user_id=current_user.id)
    if not success:
        raise HTTPException(status_code=403, detail="Not authorized! Only the project creator can delete this task.")
    return {"message": "Task deleted successfully"}

@router.post("/{task_id}/attachments", response_model=schemas.TaskAttachmentResponse)
def upload_task_attachment(task_id: int, file: UploadFile = File(...), db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    os.makedirs("uploads/tasks", exist_ok=True)
    file_path = f"uploads/tasks/{file.filename}"
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # Create TaskAttachment
    attachment = models.TaskAttachment(
        file_name=file.filename,
        file_url=f"/uploads/tasks/{file.filename}",
        task_id=task_id,
        user_id=current_user.id
    )
    db.add(attachment)
    
    # Also add to Wiki as requested
    wiki_page = models.WikiPage(
        title=f"{file.filename} (Task: {task.name})",
        doc_type="file",
        file_url=f"/uploads/tasks/{file.filename}",
        project_id=task.project_id,
        author_id=current_user.id
    )
    db.add(wiki_page)
    
    db.commit()
    db.refresh(attachment)
    return attachment

@router.get("/{task_id}/attachments", response_model=List[schemas.TaskAttachmentResponse])
def get_task_attachments(task_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    attachments = db.query(models.TaskAttachment).filter(models.TaskAttachment.task_id == task_id).all()
    return attachments

@router.delete("/{task_id}/attachments/{attachment_id}")
def delete_task_attachment(task_id: int, attachment_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    attachment = db.query(models.TaskAttachment).filter(models.TaskAttachment.id == attachment_id, models.TaskAttachment.task_id == task_id).first()
    if not attachment:
        raise HTTPException(status_code=404, detail="Attachment not found")
    
    db.delete(attachment)
    db.commit()
    return {"message": "Attachment deleted successfully"}