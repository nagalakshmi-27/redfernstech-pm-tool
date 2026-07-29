from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
from .. import crud, schemas, models
from .users import get_current_user, get_db

router = APIRouter(prefix="/notifications", tags=["Notifications"])

@router.get("/", response_model=List[schemas.NotificationResponse])
def read_notifications(workspace_id: Optional[int] = None, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return crud.get_user_notifications(db=db, user_id=current_user.id, workspace_id=workspace_id, limit=20)
