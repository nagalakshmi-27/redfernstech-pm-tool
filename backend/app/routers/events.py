from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import crud, schemas, models
from .users import get_current_user, get_db

router = APIRouter(prefix="/events", tags=["Events"])

@router.get("/", response_model=List[schemas.EventResponse])
def read_events(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return crud.get_user_events(db=db, user_id=current_user.id)

@router.post("/", response_model=schemas.EventResponse)
def create_event(event: schemas.EventCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return crud.create_event(db=db, event=event, user_id=current_user.id)

@router.put("/{event_id}", response_model=schemas.EventResponse)
def update_event(event_id: int, event: schemas.EventUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    updated_event = crud.update_event(db=db, event_id=event_id, event_update=event, user_id=current_user.id)
    if not updated_event:
        raise HTTPException(status_code=403, detail="Not authorized to edit this event")
    return updated_event

@router.delete("/{event_id}")
def delete_event(event_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    success = crud.delete_event(db=db, event_id=event_id, user_id=current_user.id)
    if not success:
        raise HTTPException(status_code=403, detail="Not authorized to delete this event")
    return {"message": "Event deleted successfully"}