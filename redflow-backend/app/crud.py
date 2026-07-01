from sqlalchemy.orm import Session
from . import models, schemas
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Helper function to hash passwords
def get_password_hash(password):
    return pwd_context.hash(password)

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def is_workspace_admin(db: Session, workspace_id: int, user_id: int):
    membership = db.query(models.workspace_members).filter(models.workspace_members.c.workspace_id == workspace_id, models.workspace_members.c.user_id == user_id).first()
    return membership and membership.role == "Admin"

def is_client(db: Session, workspace_id: int, user_id: int):
    membership = db.query(models.workspace_members).filter(models.workspace_members.c.workspace_id == workspace_id, models.workspace_members.c.user_id == user_id).first()
    return membership and membership.role == "Client"

def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = get_password_hash(user.password)
    db_user = models.User(
        email=user.email, 
        hashed_password=hashed_password, 
        first_name=user.first_name,
        last_name=user.last_name,
        full_name=f"{user.first_name} {user.last_name}" if user.first_name and user.last_name else user.full_name
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

# --- WORKSPACES ---
def create_workspace(db: Session, workspace: schemas.WorkspaceCreate, user_id: int):
    db_workspace = models.Workspace(name=workspace.name, owner_id=user_id)
    db.add(db_workspace)
    db.commit()
    db.refresh(db_workspace)
    # Add owner to workspace_members with Admin role
    db.execute(models.workspace_members.insert().values(workspace_id=db_workspace.id, user_id=user_id, role="Admin"))
    db.commit()
    return db_workspace

def get_user_workspaces(db: Session, user_id: int):
    results = db.query(models.Workspace, models.workspace_members.c.role).join(
        models.workspace_members, 
        models.Workspace.id == models.workspace_members.c.workspace_id
    ).filter(models.workspace_members.c.user_id == user_id).all()
    
    workspaces = []
    for ws, role in results:
        ws.user_role = role
        workspaces.append(ws)
    return workspaces

# --- PROJECTS ---
def get_projects(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Project).offset(skip).limit(limit).all()

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def authenticate_user(db: Session, email: str, password: str):
    user = get_user_by_email(db, email)
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user

def update_user(db: Session, user: models.User, user_update: schemas.UserUpdate):
    if user_update.first_name is not None:
        user.first_name = user_update.first_name
    if user_update.last_name is not None:
        user.last_name = user_update.last_name
    if user_update.first_name or user_update.last_name:
        user.full_name = f"{user.first_name or ''} {user.last_name or ''}".strip()
    elif user_update.full_name is not None:
        user.full_name = user_update.full_name

    if user_update.company_role is not None:
        user.company_role = user_update.company_role
    if user_update.department is not None:
        user.department = user_update.department
    db.commit()
    db.refresh(user)
    return user

def update_password(db: Session, user: models.User, new_password: str):
    user.hashed_password = get_password_hash(new_password)
    db.commit()
    db.refresh(user)
    return user

def create_project(db: Session, project: schemas.ProjectCreate, user_id: int):
    if is_client(db, project.workspace_id, user_id):
        return None
    db_project = models.Project(
        name=project.name,
        description=project.description,
        start_date=project.start_date,
        end_date=project.end_date,
        status=project.status,
        created_by_id=user_id,
        workspace_id=project.workspace_id
    )
    
    if project.member_ids:
        users = db.query(models.User).filter(models.User.id.in_(project.member_ids)).all()
        db_project.members = users
        for u in users:
            if u.id != user_id:
                notif = models.Notification(user_id=u.id, message=f"You have been added to the project '{db_project.name}'.")
                db.add(notif)
        
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return db_project

from sqlalchemy import or_
def get_user_projects(db: Session, user_id: int, workspace_id: int = None):
    query = db.query(models.Project).filter(
        or_(
            models.Project.created_by_id == user_id,
            models.Project.members.any(models.User.id == user_id)
        )
    )
    if workspace_id:
        query = query.filter(models.Project.workspace_id == workspace_id)
    return query.all()

def update_project(db: Session, project_id: int, project_update: schemas.ProjectUpdate, user_id: int):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    db_project = db.query(models.Project).filter(models.Project.id == project_id).first()
    
    if not db_project or not user: return None
    
    if not is_workspace_admin(db, db_project.workspace_id, user_id) and db_project.created_by_id != user_id:
        return None
    
    update_data = project_update.model_dump(exclude_unset=True) # or .dict() for older pydantic
    
    if "member_ids" in update_data:
        member_ids = update_data.pop("member_ids")
        users = db.query(models.User).filter(models.User.id.in_(member_ids)).all()
        
        old_user_ids = [u.id for u in db_project.members]
        for u in users:
            if u.id not in old_user_ids and u.id != user_id:
                notif = models.Notification(user_id=u.id, message=f"You have been added to the project '{db_project.name}'.")
                db.add(notif)
                
        db_project.members = users

    for key, value in update_data.items():
        setattr(db_project, key, value)
        
    db.commit()
    db.refresh(db_project)
    return db_project

def delete_project(db: Session, project_id: int, user_id: int):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    db_project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not db_project or not user: return False
    
    if not is_workspace_admin(db, db_project.workspace_id, user_id) and db_project.created_by_id != user_id:
        return False
        
    db.delete(db_project)
    db.commit()
    return True

def get_user_tasks(db: Session, user_id: int):
    return db.query(models.Task).filter(
        models.Task.project.has(
            models.Project.members.any(models.User.id == user_id) |
            (models.Project.created_by_id == user_id)
        )
    ).all()

def create_task(db: Session, task: schemas.TaskCreate, user_id: int):
    # Fetch the project to get its name for the ticket ID prefix
    project = db.query(models.Project).filter(models.Project.id == task.project_id).first()
    if not project or is_client(db, project.workspace_id, user_id):
        return None
    
    # Security: Ensure only authorized users can add tasks
    is_creator = project.created_by_id == user_id
    is_member = any(m.id == user_id for m in project.members)
    if not is_creator and not is_member:
        return None

    prefix = project.name[:3].upper() if project else "TSK"
    
    # First, create the task to get its globally unique auto-incrementing ID
    db_task = models.Task(**task.dict())
    db.add(db_task)
    db.commit()
    db.refresh(db_task)

    # Now assign a guaranteed unique ticket_id based on its global ID
    db_task.ticket_id = f"{prefix}-{db_task.id}"
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task

def update_task(db: Session, task_id: int, task_update: schemas.TaskUpdate, user_id: int):
    db_task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not db_task: return None
    
    project = db.query(models.Project).filter(models.Project.id == db_task.project_id).first()
    if not project or is_client(db, project.workspace_id, user_id):
        return None
    user = db.query(models.User).filter(models.User.id == user_id).first()

    is_creator = db_task.created_by_id == user_id
    is_assignee = db_task.assignee_id == user_id
    project = db.query(models.Project).filter(models.Project.id == db_task.project_id).first()
    
    if not is_workspace_admin(db, project.workspace_id, user_id) and not is_creator and not is_assignee:
        return None

    update_data = task_update.model_dump(exclude_unset=True)
    
    for key, value in update_data.items():
        if key == "assignee_id" and value != db_task.assignee_id and value is not None and value != user_id:
            notif = models.Notification(user_id=value, message=f"You have been assigned the task: '{update_data.get('name', db_task.name)}'.")
            db.add(notif)
        setattr(db_task, key, value)
        
    # If someone is just changing status (drag drop), they need to be the assignee or workspace admin
    if "status" in update_data and not is_creator and not is_workspace_admin(db, project.workspace_id, user_id):
        if not is_assignee:
            db_notification = models.Notification(
                user_id=project.created_by_id,
                message=f"Task '{db_task.name}' status updated to '{update_data['status']}'"
            )
            db.add(db_notification)
            
    db.commit()
    db.refresh(db_task)
    return db_task

def delete_task(db: Session, task_id: int, user_id: int):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    db_task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not db_task or not user: return False
    
    project = db.query(models.Project).filter(models.Project.id == db_task.project_id).first()
    
    if not is_workspace_admin(db, project.workspace_id, user_id) and db_task.created_by_id != user_id:
        return False
    db.delete(db_task)
    db.commit()
    return True

def get_teammates(db: Session, workspace_id: int):
    workspace = db.query(models.Workspace).filter(models.Workspace.id == workspace_id).first()
    if not workspace:
        return []
    
    users_dict = {}
    for member in workspace.members:
        ws_assoc = db.query(models.workspace_members).filter(models.workspace_members.c.workspace_id == workspace_id, models.workspace_members.c.user_id == member.id).first()
        role = ws_assoc.role if ws_assoc else "Member"
        
        users_dict[member.id] = {
            "id": member.id,
            "email": member.email,
            "full_name": member.full_name or "Pending...",
            "role": role,
            "company_role": member.company_role,
            "department": member.department or "Member",
            "profile_image": member.profile_image,
            "shared_projects": []
        }

    return list(users_dict.values())

def create_invitation(db: Session, email: str, token: str, user_id: int, role: str = "Teammate", workspace_id: int = None): 
    db.query(models.Invitation).filter(models.Invitation.email == email, models.Invitation.invited_by_id == user_id).delete()
    db_invite = models.Invitation(email=email, token=token, invited_by_id=user_id, role=role, workspace_id=workspace_id)
    db.add(db_invite)
    db.commit()
    db.refresh(db_invite)
    return db_invite

def get_invitation_by_token(db: Session, token: str):
    return db.query(models.Invitation).filter(models.Invitation.token == token, models.Invitation.status == "Pending").first()

def remove_teammate(db: Session, workspace_id: int, teammate_id: int):
    # 1. Verify user exists
    target_user = db.query(models.User).filter(models.User.id == teammate_id).first()
    if not target_user:
        return False
        
    # 2. Remove from workspace
    stmt = models.workspace_members.delete().where(
        models.workspace_members.c.workspace_id == workspace_id,
        models.workspace_members.c.user_id == teammate_id
    )
    db.execute(stmt)
    
    # 3. Remove from all projects in this workspace and nullify tasks
    workspace_projects = db.query(models.Project).filter(models.Project.workspace_id == workspace_id).all()
    for proj in workspace_projects:
        # Remove from members array
        if target_user in proj.members:
            proj.members.remove(target_user)
            
        # Nullify tasks assigned to them in this project
        db.query(models.Task).filter(models.Task.project_id == proj.id, models.Task.assignee_id == teammate_id).update({"assignee_id": None})
    
    db.commit()
    return True

def get_user_events(db: Session, user_id: int):
    return db.query(models.Event).filter(models.Event.created_by_id == user_id).all()

def create_event(db: Session, event: schemas.EventCreate, user_id: int):
    db_event = models.Event(
        title=event.title,
        description=event.description,
        date=event.date,
        type=event.type,
        status=event.status,
        created_by_id=user_id
    )
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    return db_event

def update_event(db: Session, event_id: int, event_update: schemas.EventUpdate, user_id: int):
    db_event = db.query(models.Event).filter(models.Event.id == event_id, models.Event.created_by_id == user_id).first()
    if not db_event: return None
    
    update_data = event_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_event, key, value)
        
    db.commit()
    db.refresh(db_event)
    return db_event

def delete_event(db: Session, event_id: int, user_id: int):
    db_event = db.query(models.Event).filter(models.Event.id == event_id, models.Event.created_by_id == user_id).first()
    if not db_event: return False
    db.delete(db_event)
    db.commit()
    return True

def get_user_notifications(db: Session, user_id: int, limit: int = 10):
    return db.query(models.Notification).filter(models.Notification.user_id == user_id).order_by(models.Notification.created_at.desc()).limit(limit).all()