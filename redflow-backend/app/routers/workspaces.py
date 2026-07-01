from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from .. import schemas, crud, models, database
from .users import get_current_user

router = APIRouter(prefix="/workspaces", tags=["Workspaces"])

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=schemas.WorkspaceResponse)
def create_workspace(workspace: schemas.WorkspaceCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return crud.create_workspace(db=db, workspace=workspace, user_id=current_user.id)

@router.get("/", response_model=List[schemas.WorkspaceResponse])
def get_workspaces(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return crud.get_user_workspaces(db=db, user_id=current_user.id)

@router.delete("/{workspace_id}/leave")
def leave_workspace(workspace_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    user_id = current_user.id
    workspace = db.query(models.Workspace).filter(models.Workspace.id == workspace_id).first()
    
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
        
    if workspace.owner_id == user_id:
        raise HTTPException(status_code=400, detail="You cannot leave a workspace you own. Please transfer ownership or delete it first.")
        
    # Transfer their projects in this workspace to the workspace owner
    db.query(models.Project).filter(
        models.Project.workspace_id == workspace_id,
        models.Project.created_by_id == user_id
    ).update({"created_by_id": workspace.owner_id})
    
    # Remove from workspace members
    db.query(models.workspace_members).filter_by(workspace_id=workspace_id, user_id=user_id).delete()
    
    # Remove from all projects in this workspace and nullify tasks
    workspace_projects = db.query(models.Project).filter(models.Project.workspace_id == workspace_id).all()
    for proj in workspace_projects:
        # Remove from members array
        if current_user in proj.members:
            proj.members.remove(current_user)
            
        # Nullify tasks assigned to them in this project
        db.query(models.Task).filter(models.Task.project_id == proj.id, models.Task.assignee_id == user_id).update({"assignee_id": None})
    
    db.commit()
    return {"message": "Successfully left the workspace."}

@router.put("/{workspace_id}")
def rename_workspace(workspace_id: int, update_data: schemas.WorkspaceUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    workspace = db.query(models.Workspace).filter(models.Workspace.id == workspace_id).first()
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
    if workspace.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the workspace owner can rename it")
    
    workspace.name = update_data.name
    db.commit()
    return {"message": "Workspace renamed successfully", "name": workspace.name}

@router.put("/{workspace_id}/transfer")
def transfer_workspace(workspace_id: int, transfer_data: schemas.WorkspaceTransfer, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    workspace = db.query(models.Workspace).filter(models.Workspace.id == workspace_id).first()
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
    if workspace.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the workspace owner can transfer it")
        
    member = db.query(models.workspace_members).filter(
        models.workspace_members.c.workspace_id == workspace_id, 
        models.workspace_members.c.user_id == transfer_data.new_owner_id
    ).first()
    
    if not member or member.role == "Client":
        raise HTTPException(status_code=400, detail="The selected user is either not in this workspace or is a Client.")
        
    workspace.owner_id = transfer_data.new_owner_id
    
    stmt = models.workspace_members.update().where(
        models.workspace_members.c.workspace_id == workspace_id,
        models.workspace_members.c.user_id == transfer_data.new_owner_id
    ).values(role="Admin")
    db.execute(stmt)
    
    old_owner_member = db.query(models.workspace_members).filter_by(workspace_id=workspace_id, user_id=current_user.id).first()
    if not old_owner_member:
        stmt = models.workspace_members.insert().values(workspace_id=workspace_id, user_id=current_user.id, role="Admin")
        db.execute(stmt)
    else:
        stmt = models.workspace_members.update().where(
            models.workspace_members.c.workspace_id == workspace_id,
            models.workspace_members.c.user_id == current_user.id
        ).values(role="Admin")
        db.execute(stmt)
        
    db.commit()
    return {"message": "Workspace transferred successfully"}

@router.delete("/{workspace_id}")
def delete_workspace(workspace_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    workspace = db.query(models.Workspace).filter(models.Workspace.id == workspace_id).first()
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
    if workspace.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the workspace owner can delete it")
        
    db.delete(workspace)
    db.commit()
    return {"message": "Workspace deleted successfully"}

@router.put("/{workspace_id}/members/{user_id}/role")
def update_workspace_member_role(
    workspace_id: int, 
    user_id: int, 
    role_data: schemas.WorkspaceMemberRoleUpdate, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
):
    workspace = db.query(models.Workspace).filter(models.Workspace.id == workspace_id).first()
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
        
    current_user_member = db.query(models.workspace_members).filter(
        models.workspace_members.c.workspace_id == workspace_id,
        models.workspace_members.c.user_id == current_user.id
    ).first()
    
    if not current_user_member or current_user_member.role != "Admin":
        raise HTTPException(status_code=403, detail="Only workspace Admins can change roles")
        
    target_member = db.query(models.workspace_members).filter(
        models.workspace_members.c.workspace_id == workspace_id,
        models.workspace_members.c.user_id == user_id
    ).first()
    
    if not target_member:
        raise HTTPException(status_code=404, detail="User is not a member of this workspace")
        
    if workspace.owner_id == user_id:
        raise HTTPException(status_code=400, detail="Cannot change the role of the workspace owner")
        
    if role_data.role not in ["Admin", "Member", "Client"]:
        raise HTTPException(status_code=400, detail="Invalid role")
        
    stmt = models.workspace_members.update().where(
        models.workspace_members.c.workspace_id == workspace_id,
        models.workspace_members.c.user_id == user_id
    ).values(role=role_data.role)
    db.execute(stmt)
    db.commit()
    
    return {"message": "Role updated successfully"}
