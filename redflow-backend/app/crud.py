from sqlalchemy.orm import Session
from . import models, schemas
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Helper function to hash passwords
def get_password_hash(password):
    return pwd_context.hash(password)

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = get_password_hash(user.password)
    db_user = models.User(email=user.email, hashed_password=hashed_password, role=user.role)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

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
    if user_update.full_name is not None:
        user.full_name = user_update.full_name
    if user_update.role is not None:
        user.role = user_update.role
    db.commit()
    db.refresh(user)
    return user

def update_password(db: Session, user: models.User, new_password: str):
    user.hashed_password = get_password_hash(new_password)
    db.commit()
    db.refresh(user)
    return user

def create_project(db: Session, project: schemas.ProjectCreate, user_id: int):
    db_project = models.Project(
        name=project.name,
        description=project.description,
        start_date=project.start_date,
        end_date=project.end_date,
        status=project.status,
        members=project.members,
        created_by_id=user_id
    )
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return db_project

from sqlalchemy import or_
def get_user_projects(db: Session, user_id: int):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user or not user.full_name:
        return db.query(models.Project).filter(models.Project.created_by_id == user_id).all()
        
    return db.query(models.Project).filter(
        or_(
            models.Project.created_by_id == user_id,
            models.Project.members.contains(user.full_name)
        )
    ).all()

def update_project(db: Session, project_id: int, project_update: schemas.ProjectUpdate, user_id: int):
    db_project = db.query(models.Project).filter(models.Project.id == project_id, models.Project.created_by_id == user_id).first()
    if not db_project: return None
    
    update_data = project_update.model_dump(exclude_unset=True) # or .dict() for older pydantic
    for key, value in update_data.items():
        setattr(db_project, key, value)
        
    db.commit()
    db.refresh(db_project)
    return db_project

def delete_project(db: Session, project_id: int, user_id: int):
    db_project = db.query(models.Project).filter(models.Project.id == project_id, models.Project.created_by_id == user_id).first()
    if not db_project: return False
    db.delete(db_project)
    db.commit()
    return True

def create_task(db: Session, task: schemas.TaskCreate, user_id: int):
    # SECURITY CHECK: Make sure the current user created the project!
    project = db.query(models.Project).filter(models.Project.id == task.project_id, models.Project.created_by_id == user_id).first()
    if not project:
        return None # Block it!
        
    db_task = models.Task(
        name=task.name,
        description=task.description,
        status=task.status,
        priority=task.priority,
        due_date=task.due_date,
        project_id=task.project_id,
        assignee_name=task.assignee_name
    )
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task

def get_user_tasks(db: Session, user_id: int):
    # First, get the user so we know their full name
    user = db.query(models.User).filter(models.User.id == user_id).first()
    
    # If they don't have a name yet, fallback to only showing what they created
    if not user or not user.full_name:
        return db.query(models.Task).join(models.Project).filter(models.Project.created_by_id == user_id).all()

    # Return tasks if they created the project OR if they are a member of the project!
    return db.query(models.Task).join(models.Project).filter(
        or_(
            models.Project.created_by_id == user_id,
            models.Project.members.contains(user.full_name)
        )
    ).all()

def update_task(db: Session, task_id: int, task_update: schemas.TaskUpdate, user_id: int):
    # SECURITY CHECK: We join the Project table to verify they own the project this task belongs to!
    db_task = db.query(models.Task).join(models.Project).filter(models.Task.id == task_id, models.Project.created_by_id == user_id).first()
    if not db_task: return None
    
    update_data = task_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_task, key, value)
        
    db.commit()
    db.refresh(db_task)
    return db_task

def delete_task(db: Session, task_id: int, user_id: int):
    db_task = db.query(models.Task).join(models.Project).filter(models.Task.id == task_id, models.Project.created_by_id == user_id).first()
    if not db_task: return False
    db.delete(db_task)
    db.commit()
    return True

def get_teammates(db: Session, user_id: int):
    # 1. Grab your own user profile first!
    me = db.query(models.User).filter(models.User.id == user_id).first()
    
    # 2. Add yourself as the first default team member
    teammates = [{
        "id": me.id,
        "email": me.email,
        "full_name": me.full_name or "Me",
        "role": me.role or "Admin",
        "department": "Owner"
    }]
    
    # 3. Now find all the people you invited and add them too
    invites = db.query(models.Invitation).filter(models.Invitation.invited_by_id == user_id, models.Invitation.status == "Accepted").all()
    for invite in invites:
        user = get_user_by_email(db, invite.email)
        if user:
            teammates.append({
                "id": user.id,
                "email": user.email,
                "full_name": user.full_name,
                "role": invite.role,
                "department": invite.department
            })
            
    return teammates

def create_invitation(db: Session, email: str, role: str, department: str, token: str, user_id: int):
    db.query(models.Invitation).filter(models.Invitation.email == email, models.Invitation.invited_by_id == user_id).delete()
    db_invite = models.Invitation(email=email, role=role, department=department, token=token, invited_by_id=user_id)
    db.add(db_invite)
    db.commit()
    db.refresh(db_invite)
    return db_invite

def get_invitation_by_token(db: Session, token: str):
    return db.query(models.Invitation).filter(models.Invitation.token == token, models.Invitation.status == "Pending").first()