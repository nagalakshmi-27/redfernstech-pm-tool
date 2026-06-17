from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import crud, schemas, database, models
from .users import get_current_user, get_db

router = APIRouter(prefix="/tasks", tags=["Tasks"])

@router.get("/", response_model=List[schemas.TaskResponse])
def read_tasks(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return crud.get_user_tasks(db=db, user_id=current_user.id)

@router.post("/", response_model=schemas.TaskResponse)
def create_task(task: schemas.TaskCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    new_task = crud.create_task(db=db, task=task, user_id=current_user.id)
    if not new_task:
        raise HTTPException(status_code=403, detail="Not authorized! Only the project creator can add tasks.")
    return new_task

@router.put("/{task_id}", response_model=schemas.TaskResponse)
def update_task(task_id: int, task: schemas.TaskUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    updated_task = crud.update_task(db=db, task_id=task_id, task_update=task, user_id=current_user.id)
    if not updated_task:
        raise HTTPException(status_code=403, detail="Not authorized! Only the project creator can edit this task.")
    return updated_task

@router.delete("/{task_id}")
def delete_task(task_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    success = crud.delete_task(db=db, task_id=task_id, user_id=current_user.id)
    if not success:
        raise HTTPException(status_code=403, detail="Not authorized! Only the project creator can delete this task.")
    return {"message": "Task deleted successfully"}