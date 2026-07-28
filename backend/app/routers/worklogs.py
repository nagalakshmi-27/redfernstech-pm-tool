from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from .. import models, schemas
from .users import get_db, get_current_user

router = APIRouter(
    prefix="/worklogs",
    tags=["worklogs"]
)

@router.post("/", response_model=schemas.WorkLogResponse)
def create_work_log(
    work_log: schemas.WorkLogCreate, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
):
    # Verify task exists
    task = db.query(models.Task).filter(models.Task.id == work_log.task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    db_work_log = models.WorkLog(
        **work_log.model_dump(),
        user_id=current_user.id
    )
    db.add(db_work_log)
    db.commit()
    db.refresh(db_work_log)
    return db_work_log

@router.delete("/{worklog_id}")
def delete_work_log(
    worklog_id: int, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
):
    db_work_log = db.query(models.WorkLog).filter(models.WorkLog.id == worklog_id).first()
    if not db_work_log:
        raise HTTPException(status_code=404, detail="Work log not found")

    # Only allow creator to delete it
    if db_work_log.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this work log")

    db.delete(db_work_log)
    db.commit()
    return {"ok": True}
