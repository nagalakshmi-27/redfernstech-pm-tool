from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from .. import models, schemas
from .users import get_db, get_current_user

router = APIRouter(
    prefix="/subtasks",
    tags=["subtasks"]
)

@router.post("/", response_model=schemas.SubtaskResponse)
def create_subtask(
    subtask: schemas.SubtaskCreate, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
):
    # Verify task exists
    task = db.query(models.Task).filter(models.Task.id == subtask.task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    db_subtask = models.Subtask(**subtask.model_dump())
    db.add(db_subtask)
    db.commit()
    db.refresh(db_subtask)
    return db_subtask

@router.put("/{subtask_id}", response_model=schemas.SubtaskResponse)
def update_subtask(
    subtask_id: int, 
    subtask_update: schemas.SubtaskUpdate, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
):
    db_subtask = db.query(models.Subtask).filter(models.Subtask.id == subtask_id).first()
    if not db_subtask:
        raise HTTPException(status_code=404, detail="Subtask not found")

    update_data = subtask_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_subtask, key, value)

    db.commit()
    db.refresh(db_subtask)
    return db_subtask

@router.delete("/{subtask_id}")
def delete_subtask(
    subtask_id: int, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
):
    db_subtask = db.query(models.Subtask).filter(models.Subtask.id == subtask_id).first()
    if not db_subtask:
        raise HTTPException(status_code=404, detail="Subtask not found")

    db.delete(db_subtask)
    db.commit()
    return {"ok": True}
