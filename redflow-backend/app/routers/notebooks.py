from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import schemas, models
from .users import get_current_user, get_db

router = APIRouter(prefix="/notebooks", tags=["Notebooks"])

@router.get("/", response_model=List[schemas.NotebookItemResponse])
def get_notebook_items(
    workspace_id: int, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
):
    items = db.query(models.NotebookItem).filter(
        models.NotebookItem.workspace_id == workspace_id,
        models.NotebookItem.user_id == current_user.id
    ).order_by(models.NotebookItem.updated_at.desc()).all()
    return items

@router.post("/", response_model=schemas.NotebookItemResponse)
def create_notebook_item(
    item: schemas.NotebookItemCreate, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
):
    db_item = models.NotebookItem(
        **item.model_dump(),
        user_id=current_user.id
    )
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

@router.put("/{item_id}", response_model=schemas.NotebookItemResponse)
def update_notebook_item(
    item_id: int, 
    item_update: schemas.NotebookItemUpdate, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
):
    db_item = db.query(models.NotebookItem).filter(
        models.NotebookItem.id == item_id,
        models.NotebookItem.user_id == current_user.id
    ).first()
    
    if not db_item:
        raise HTTPException(status_code=404, detail="Notebook item not found")
        
    update_data = item_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_item, key, value)
        
    db.commit()
    db.refresh(db_item)
    return db_item

@router.delete("/{item_id}")
def delete_notebook_item(
    item_id: int, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
):
    db_item = db.query(models.NotebookItem).filter(
        models.NotebookItem.id == item_id,
        models.NotebookItem.user_id == current_user.id
    ).first()
    
    if not db_item:
        raise HTTPException(status_code=404, detail="Notebook item not found")
        
    db.delete(db_item)
    db.commit()
    return {"message": "Deleted successfully"}
