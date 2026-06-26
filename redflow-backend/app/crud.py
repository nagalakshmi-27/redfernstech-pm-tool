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
    db_user = models.User(
        email=user.email, 
        hashed_password=hashed_password, 
        role=user.role,
        first_name=user.first_name,
        last_name=user.last_name,
        full_name=f"{user.first_name} {user.last_name}" if user.first_name and user.last_name else user.full_name
    )
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
    if user_update.first_name is not None:
        user.first_name = user_update.first_name
    if user_update.last_name is not None:
        user.last_name = user_update.last_name
    if user_update.first_name or user_update.last_name:
        user.full_name = f"{user.first_name or ''} {user.last_name or ''}".strip()
    elif user_update.full_name is not None:
        user.full_name = user_update.full_name
    if user_update.role is not None:
        user.role = user_update.role
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
    db_project = models.Project(
        name=project.name,
        description=project.description,
        start_date=project.start_date,
        end_date=project.end_date,
        status=project.status,
        created_by_id=user_id
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
def get_user_projects(db: Session, user_id: int):
    return db.query(models.Project).filter(
        or_(
            models.Project.created_by_id == user_id,
            models.Project.members.any(models.User.id == user_id)
        )
    ).all()

def update_project(db: Session, project_id: int, project_update: schemas.ProjectUpdate, user_id: int):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    db_project = db.query(models.Project).filter(models.Project.id == project_id).first()
    
    if not db_project or not user: return None
    
    if user.role != "Admin" and db_project.created_by_id != user_id:
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
    
    if user.role != "Admin" and db_project.created_by_id != user_id:
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
    
    # Security: Ensure only authorized users can add tasks
    is_creator = project.created_by_id == user_id
    is_member = any(m.id == user_id for m in project.members)
    if not is_creator and not is_member:
        return None

    prefix = project.name[:3].upper() if project else "TSK"
    task_count = db.query(models.Task).filter(models.Task.project_id == task.project_id).count()
    ticket_id = f"{prefix}-{task_count + 1}"

    # Create the task with our auto-generated ticket_id
    db_task = models.Task(
        **task.dict(),
        ticket_id=ticket_id
    )
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task

def update_task(db: Session, task_id: int, task_update: schemas.TaskUpdate, user_id: int):
    db_task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not db_task: return None
    
    project = db.query(models.Project).filter(models.Project.id == db_task.project_id).first()
    user = db.query(models.User).filter(models.User.id == user_id).first()

    is_creator = project.created_by_id == user_id
    is_assignee = db_task.assignee_id == user_id
    
    if user.role != "Admin" and not is_creator and not is_assignee:
        return None

    update_data = task_update.model_dump(exclude_unset=True)
    
    for key, value in update_data.items():
        if key == "assignee_id" and value != db_task.assignee_id and value is not None and value != user_id:
            notif = models.Notification(user_id=value, message=f"You have been assigned the task: '{update_data.get('name', db_task.name)}'.")
            db.add(notif)
        setattr(db_task, key, value)
        
    if "status" in update_data and not is_creator and user.role != "Admin":
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
    
    if user.role != "Admin" and project.created_by_id != user_id:
        return False
        
    db.delete(db_task)
    db.commit()
    return True

def get_teammates(db: Session, user_id: int):
    me = db.query(models.User).filter(models.User.id == user_id).first()
    
    users_dict = {}
    users_dict[me.id] = {
        "id": me.id,
        "email": me.email,
        "full_name": me.full_name or "Me",
        "role": me.role or "Member",
        "company_role": me.company_role,
        "department": me.department or "Management",
        "shared_projects": []
    }
    
    all_projects = db.query(models.Project).all()
    
    if me.role == "Admin":
        all_users = db.query(models.User).all()
        for u in all_users:
            if u.id not in users_dict:
                users_dict[u.id] = {
                    "id": u.id,
                    "email": u.email,
                    "full_name": u.full_name or "Pending...",
                    "role": u.role or "Member",
                    "company_role": u.company_role,
                    "department": u.department or "Member",
                    "shared_projects": []
                }
        for proj in all_projects:
            proj_users = set([proj.created_by_id] + [m.id for m in proj.members])
            for u_id in proj_users:
                if u_id in users_dict and proj.name not in users_dict[u_id]["shared_projects"]:
                    users_dict[u_id]["shared_projects"].append(proj.name)
    else:
        for proj in all_projects:
            proj_users = set([proj.created_by_id] + [m.id for m in proj.members])
            if me.id in proj_users:
                for u_id in proj_users:
                    if u_id not in users_dict:
                        u = db.query(models.User).filter(models.User.id == u_id).first()
                        if u:
                            users_dict[u.id] = {
                                "id": u.id,
                                "email": u.email,
                                "full_name": u.full_name or "Pending...",
                                "role": u.role or "Member",
                                "company_role": u.company_role,
                                "department": u.department or "Member",
                                "shared_projects": []
                            }
                    if u_id in users_dict and proj.name not in users_dict[u_id]["shared_projects"]:
                        users_dict[u_id]["shared_projects"].append(proj.name)

    return list(users_dict.values())

def create_invitation(db: Session, email: str, token: str, user_id: int, role: str = "Teammate"): 
    db.query(models.Invitation).filter(models.Invitation.email == email, models.Invitation.invited_by_id == user_id).delete()
    db_invite = models.Invitation(email=email, token=token, invited_by_id=user_id, role=role)
    db.add(db_invite)
    db.commit()
    db.refresh(db_invite)
    return db_invite

def get_invitation_by_token(db: Session, token: str):
    return db.query(models.Invitation).filter(models.Invitation.token == token, models.Invitation.status == "Pending").first()

def remove_teammate(db: Session, user_id: int, teammate_id: int):
    # 1. Find the target user's account
    target_user = db.query(models.User).filter(models.User.id == teammate_id).first()
    if not target_user:
        return False
        
    # 2. Find the exact invitation YOU sent to THEM
    invitation = db.query(models.Invitation).filter(
        models.Invitation.invited_by_id == user_id,
        models.Invitation.email == target_user.email
    ).first()
    
    # 3. If it exists, delete it!
    if not invitation:
        return False
        
    db.delete(invitation)
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