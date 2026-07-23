from sqlalchemy.orm import Session, selectinload
from typing import Optional
from . import models, schemas
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Helper function to hash passwords
def get_password_hash(password):
    return pwd_context.hash(password)

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def get_user_by_username(db: Session, username: str):
    return db.query(models.User).filter(models.User.username == username).first()

def create_account(db: Session, name: str, email: str):
    db_account = models.Account(name=name, email=email)
    db.add(db_account)
    db.commit()
    db.refresh(db_account)
    return db_account

def get_account_by_email(db: Session, email: str):
    return db.query(models.Account).filter(models.Account.email == email).first()

def check_user_device(db: Session, user_id: int, device_id: str):
    return db.query(models.UserDevice).filter(
        models.UserDevice.user_id == user_id, 
        models.UserDevice.device_id == device_id
    ).first() is not None

def add_user_device(db: Session, user_id: int, device_id: str):
    if not check_user_device(db, user_id, device_id):
        device = models.UserDevice(user_id=user_id, device_id=device_id)
        db.add(device)
        db.commit()

def create_otp(db: Session, email: str, otp_code: str, expires_at):
    db_otp = models.OTP(email=email, otp_code=otp_code, expires_at=expires_at)
    db.add(db_otp)
    db.commit()

def verify_and_consume_otp(db: Session, email: str, otp_code: str):
    from datetime import datetime
    db_otp = db.query(models.OTP).filter(
        models.OTP.email == email, 
        models.OTP.otp_code == otp_code,
        models.OTP.expires_at > datetime.utcnow()
    ).first()
    if db_otp:
        db.delete(db_otp) # Consume it
        db.commit()
        return True
    return False

def log_activity(db: Session, project_id: int, user_id: int, action: str, target_name: str = None, target_type: str = None, ticket_id: str = None):
    activity = models.Activity(
        project_id=project_id,
        user_id=user_id,
        action=action,
        target_name=target_name,
        target_type=target_type,
        ticket_id=ticket_id
    )
    db.add(activity)
    db.commit()

def is_workspace_admin(db: Session, workspace_id: int, user_id: int):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user and user.is_owner: return True
    membership = db.query(models.workspace_members).filter(models.workspace_members.c.workspace_id == workspace_id, models.workspace_members.c.user_id == user_id).first()
    return membership and membership.role == "Admin"

def is_client(db: Session, workspace_id: int, user_id: int):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user and user.is_owner: return False
    membership = db.query(models.workspace_members).filter(models.workspace_members.c.workspace_id == workspace_id, models.workspace_members.c.user_id == user_id).first()
    return membership and membership.role == "Client"

def create_user(db: Session, user: schemas.UserCreate, account_id: int, is_owner: bool = False):
    hashed_password = get_password_hash(user.password)
    db_user = models.User(
        username=user.username,
        email=user.email, 
        hashed_password=hashed_password, 
        first_name=user.first_name,
        last_name=user.last_name,
        full_name=f"{user.first_name} {user.last_name}" if user.first_name and user.last_name else user.full_name,
        account_id=account_id,
        is_owner=is_owner
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

# --- WORKSPACES ---
def create_workspace(db: Session, workspace: schemas.WorkspaceCreate, account_id: int, creator_id: int):
    db_workspace = models.Workspace(name=workspace.name, account_id=account_id)
    db.add(db_workspace)
    db.commit()
    db.refresh(db_workspace)
    # Add creator to workspace_members with Admin role
    db.execute(models.workspace_members.insert().values(workspace_id=db_workspace.id, user_id=creator_id, role="Admin"))
    db.commit()
    return db_workspace

def get_user_workspaces(db: Session, user_id: int):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user and user.is_owner:
        workspaces = db.query(models.Workspace).filter(models.Workspace.account_id == user.account_id).all()
        for ws in workspaces:
            ws.user_role = "Admin"
        return workspaces
        
    results = db.query(models.Workspace, models.workspace_members.c.role).join(
        models.workspace_members, 
        models.Workspace.id == models.workspace_members.c.workspace_id
    ).filter(models.workspace_members.c.user_id == user_id).all()
    
    workspaces = []
    for ws, role in results:
        ws.user_role = role
        workspaces.append(ws)
    return workspaces

def get_user_workspace_role(db: Session, user_id: int, workspace_id: int) -> str:
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user and user.is_owner:
        return "Admin"  # Super admins act as Admins everywhere
        
    result = db.query(models.workspace_members.c.role).filter(
        models.workspace_members.c.workspace_id == workspace_id,
        models.workspace_members.c.user_id == user_id
    ).first()
    
    return result[0] if result else None

def has_project_access(db: Session, project_id: int, user_id: int) -> bool:
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        return False
    role = get_user_workspace_role(db, user_id, project.workspace_id)
    if role == "Admin":
        return True
    return any(member.id == user_id for member in project.members)

# --- PROJECTS ---
def get_projects(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Project).offset(skip).limit(limit).all()

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def authenticate_user(db: Session, username: str, password: str):
    user = get_user_by_username(db, username)
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
    hashed_password = get_password_hash(new_password)
    users = db.query(models.User).filter(models.User.email == user.email).all()
    for u in users:
        u.hashed_password = hashed_password
    db.commit()
    db.refresh(user)
    return user

def generate_project_key(db: Session, name: str, workspace_id: int) -> str:
    base_key = "".join([c for c in name if c.isalnum()]).upper()[:3]
    if len(base_key) < 3:
        base_key = (base_key + "XXX")[:3]
        
    key = base_key
    counter = 1
    while True:
        existing = db.query(models.Project).filter(
            models.Project.project_key == key
        ).first()
        if not existing:
            return key
        key = f"{base_key}{counter}"
        counter += 1

def create_project(db: Session, project: schemas.ProjectCreate, user_id: int):
    role = get_user_workspace_role(db, user_id, project.workspace_id)
    if role != "Admin":
        return None
    project_key = generate_project_key(db, project.name, project.workspace_id)
    
    db_project = models.Project(
        name=project.name,
        description=project.description,
        start_date=project.start_date,
        end_date=project.end_date,
        status=project.status,
        created_by_id=user_id,
        workspace_id=project.workspace_id,
        board_type=project.board_type,
        board_columns=project.board_columns,
        project_key=project_key,
        task_counter=0
    )
    
    if project.member_ids:
        users = db.query(models.User).filter(models.User.id.in_(project.member_ids)).all()
        db_project.members = users
        for u in users:
            if u.id != user_id:
                notif = models.Notification(user_id=u.id, message=f"You have been added to the project '{db_project.name}'.", workspace_id=db_project.workspace_id)
                db.add(notif)
        
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    
    # Log project creation activity
    log_activity(db, project_id=db_project.id, user_id=user_id, action="created project", target_name=db_project.name, target_type="Project")
    
    return db_project

from sqlalchemy import or_

def get_user_projects(db: Session, user_id: int, workspace_id: int = None):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user: return []
    
    if user.is_owner:
        query = db.query(models.Project).join(models.Workspace).filter(models.Workspace.account_id == user.account_id)
    else:
        workspace_ids_admin = [
            wm.workspace_id for wm in 
            db.query(models.workspace_members).filter(
                models.workspace_members.c.user_id == user.id,
                models.workspace_members.c.role == "Admin"
            ).all()
        ]
        
        query = db.query(models.Project).filter(
            or_(
                models.Project.workspace_id.in_(workspace_ids_admin),
                models.Project.members.any(models.User.id == user.id)
            )
        )
        
    query = query.options(selectinload(models.Project.tasks))

    if workspace_id:
        query = query.filter(models.Project.workspace_id == workspace_id)

    projects = query.all()

    prefs = user.preferences or {}
    project_boards = prefs.get("project_boards", {})

    for project in projects:
        if str(project.id) in project_boards:
            project.board_type = project_boards[str(project.id)]
            
        total_tasks = len(project.tasks)
        completed_tasks = len(
            [t for t in project.tasks if t.status == "Completed"]
        )

        if total_tasks == 0:
            project.__dict__["progress"] = 0
            project.__dict__["calculated_status"] = project.status or "Planning"
        else:
            progress = round((completed_tasks / total_tasks) * 100)
            project.__dict__["progress"] = progress

            if completed_tasks == total_tasks:
                project.__dict__["calculated_status"] = "Completed"
            elif completed_tasks > 0:
                project.__dict__["calculated_status"] = "In Progress"
            else:
                project.__dict__["calculated_status"] = "Planning"

    return projects

def update_project(db: Session, project_id: int, project_update: schemas.ProjectUpdate, user_id: int):
    db_project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not db_project: return None
    
    role = get_user_workspace_role(db, user_id, db_project.workspace_id)
    if role != "Admin":
        return None
    
    update_data = project_update.model_dump(exclude_unset=True) # or .dict() for older pydantic
    
    changed_fields = []
    
    if "member_ids" in update_data:
        member_ids = update_data.pop("member_ids")
        users = db.query(models.User).filter(models.User.id.in_(member_ids)).all()
        
        old_user_ids = [u.id for u in db_project.members]
        if set(old_user_ids) != set([u.id for u in users]):
            changed_fields.append("Team Members")
            
        for u in users:
            if u.id not in old_user_ids and u.id != user_id:
                notif = models.Notification(user_id=u.id, message=f"You have been added to the project '{db_project.name}'.")
                db.add(notif)
                
        db_project.members = users

    if "board_columns" in update_data:
        new_columns = update_data["board_columns"]
        old_columns = db_project.board_columns or []
        
        def get_col_name(c):
            return c.get("name") if isinstance(c, dict) else c

        old_names = [get_col_name(c) for c in old_columns]
        new_names = [get_col_name(c) for c in new_columns]
        
        old_set = set(old_names)
        new_set = set(new_names)
        removed = list(old_set - new_set)
        added = list(new_set - old_set)
        
        rename_map = {}
        if len(removed) == 1 and len(added) == 1 and len(old_names) == len(new_names):
            rename_map[removed[0]] = added[0]
            
        tasks = db.query(models.Task).filter(models.Task.project_id == project_id).all()
        for task in tasks:
            if task.status in rename_map:
                task.status = rename_map[task.status]
            elif task.status not in new_names and new_names:
                task.status = new_names[0]

    for key, value in update_data.items():
        if key not in ["board_columns", "workspace_id"]:
            old_val = getattr(db_project, key, None)
            if old_val != value:
                if not (not old_val and not value):
                    changed_fields.append(key.replace("_", " ").title())
        setattr(db_project, key, value)
        
    db.commit()
    db.refresh(db_project)
    
    if changed_fields:
        log_activity(db, project_id=db_project.id, user_id=user_id, action=f"updated project (changed {', '.join(changed_fields)})", target_name=db_project.name, target_type="Project")
        
    return db_project

def delete_project(db: Session, project_id: int, user_id: int):
    db_project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not db_project: return False
    
    role = get_user_workspace_role(db, user_id, db_project.workspace_id)
    if role != "Admin":
        return False
        
    try:
        # Delete items without cascading relationships first
        db.query(models.Activity).filter(models.Activity.project_id == project_id).delete(synchronize_session=False)
        db.query(models.Invitation).filter(models.Invitation.project_id == project_id).delete(synchronize_session=False)
        db.query(models.Comment).filter(models.Comment.project_id == project_id).delete(synchronize_session=False)
        
        db.delete(db_project)
        db.commit()
        return True
    except Exception as e:
        db.rollback()
        print(f"Error deleting project: {e}")
        return False

def get_user_tasks(db: Session, user_id: int, workspace_id: int = None):
    query = db.query(models.Task).filter(
        models.Task.project.has(
            models.Project.members.any(models.User.id == user_id) |
            (models.Project.created_by_id == user_id)
        )
    )

    if workspace_id:
        query = query.filter(
            models.Task.project.has(
                models.Project.workspace_id == workspace_id
            )
        )

    raw_tasks = query.all()
    
    filtered_tasks = []
    role_cache = {}
    
    for task in raw_tasks:
        proj = task.project
        if not proj: continue
        
        ws_id = proj.workspace_id
        if ws_id not in role_cache:
            role_cache[ws_id] = get_user_workspace_role(db, user_id, ws_id)
            
        role = role_cache[ws_id]
        
        # Admin and Client see all tasks
        if role in ["Admin", "Client"]:
            filtered_tasks.append(task)
            continue
            
        # Member rules
        visibility = getattr(proj, "task_visibility", "everyone")
        viewers = getattr(proj, "task_viewers", []) or []
        
        if visibility == "everyone":
            filtered_tasks.append(task)
        elif visibility == "assigned":
            if task.assignee_id == user_id:
                filtered_tasks.append(task)
        elif visibility == "custom":
            if user_id in viewers or task.assignee_id == user_id:
                filtered_tasks.append(task)
                
    return filtered_tasks

def create_task(db: Session, task: schemas.TaskCreate, user_id: int):
    # Fetch the project to get its name for the ticket ID prefix
    project = db.query(models.Project).filter(models.Project.id == task.project_id).first()
    if not project:
        return None
        
    role = get_user_workspace_role(db, user_id, project.workspace_id)
    if role == "Client":
        return None
    if role == "Member" and not any(m.id == user_id for m in project.members):
        return None

    # Increment project task counter atomically
    project.task_counter = (project.task_counter or 0) + 1
    db.add(project)
    
    prefix = project.project_key if project.project_key else "".join([c for c in project.name if c.isalnum()]).upper()[:3]
    ticket_id = f"{prefix}-{project.task_counter}"
    
    task_data = task.dict()
    db_task = models.Task(**task_data, created_by_id=user_id)
    db_task.ticket_id = ticket_id
    
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    
    # Log task creation activity
    log_activity(db, project_id=db_task.project_id, user_id=user_id, action="created task", target_name=db_task.name, target_type="Task", ticket_id=db_task.ticket_id)
    
    return db_task

def update_task(db: Session, task_id: int, task_update: schemas.TaskUpdate, user_id: int):
    db_task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not db_task: return None
    
    project = db.query(models.Project).filter(models.Project.id == db_task.project_id).first()
    if not project:
        return None
        
    role = get_user_workspace_role(db, user_id, project.workspace_id)
    if role == "Client":
        return None
    if role == "Member" and not any(m.id == user_id for m in project.members):
        return None

    user = db.query(models.User).filter(models.User.id == user_id).first()

    update_data = task_update.model_dump(exclude_unset=True)
    status_changed = "status" in update_data and update_data["status"] != db_task.status
    new_status = update_data.get("status")
    
    changed_fields = []
    
    for key, value in update_data.items():
        if key == "assignee_id":
            if value != db_task.assignee_id:
                changed_fields.append("Assignee")
            if value != db_task.assignee_id and value is not None and value != user_id:
                notif = models.Notification(user_id=value, message=f"You have been assigned the task: '{update_data.get('name', db_task.name)}'.", workspace_id=project.workspace_id)
                db.add(notif)
        elif key != "status":
            old_val = getattr(db_task, key, None)
            if old_val != value:
                if not (not old_val and not value):
                    changed_fields.append(key.replace("_", " ").title())
        setattr(db_task, key, value)
        
    # If someone is just changing status (drag drop), they need to be the assignee, creator, or workspace admin
    if "status" in update_data and role != "Admin":
        if db_task.assignee_id != user_id and db_task.created_by_id != user_id:
            db_notification = models.Notification(
                user_id=project.created_by_id,
                message=f"Task '{db_task.name}' status updated to '{update_data['status']}'",
                workspace_id=project.workspace_id
            )
            db.add(db_notification)
            
    db.commit()
    db.refresh(db_task)
    
    if status_changed:
        log_activity(db, project_id=db_task.project_id, user_id=user_id, action=f"moved task to {new_status}", target_name=db_task.name, target_type="Task", ticket_id=db_task.ticket_id)
        
    if changed_fields:
        log_activity(db, project_id=db_task.project_id, user_id=user_id, action=f"updated task (changed {', '.join(changed_fields)})", target_name=db_task.name, target_type="Task", ticket_id=db_task.ticket_id)
        
    return db_task

def delete_task(db: Session, task_id: int, user_id: int):
    db_task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not db_task: return False
    
    project = db.query(models.Project).filter(models.Project.id == db_task.project_id).first()
    if not project: return False
    
    role = get_user_workspace_role(db, user_id, project.workspace_id)
    if role == "Client":
        return False
    if role == "Member" and not any(m.id == user_id for m in project.members):
        return False
        
    # Log task deletion activity
    log_activity(db, project_id=project.id, user_id=user_id, action="deleted task", target_name=db_task.name, target_type="Task", ticket_id=db_task.ticket_id)
    
    db.delete(db_task)
    db.commit()
    return True

def get_teammates(db: Session, workspace_id: Optional[int], account_id: int):
    users_dict = {}
    
    # 1. Add all Super Admins for this account
    owners = db.query(models.User).filter(
        models.User.account_id == account_id,
        models.User.is_owner == True
    ).all()
    
    for admin in owners:
        users_dict[admin.id] = {
            "id": admin.id,
            "email": admin.email,
            "full_name": admin.full_name or "Pending...",
            "role": "Super Admin",
            "company_role": admin.company_role,
            "department": admin.department or "Admin",
            "profile_image": admin.profile_image,
            "shared_projects": []
        }
        
    if workspace_id:
        workspace = db.query(models.Workspace).filter(models.Workspace.id == workspace_id).first()
        if workspace:
            # 2. Add explicit workspace members
            for member in workspace.members:
                if member.id in users_dict: continue # Skip if already added as Super Admin
                
                ws_assoc = db.query(models.workspace_members).filter(
                    models.workspace_members.c.workspace_id == workspace_id, 
                    models.workspace_members.c.user_id == member.id
                ).first()
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
    else:
        # If no workspace is selected, return all users in the entire account
        all_users = db.query(models.User).filter(models.User.account_id == account_id).all()
        for user in all_users:
            if user.id in users_dict: continue
            
            users_dict[user.id] = {
                "id": user.id,
                "email": user.email,
                "full_name": user.full_name or "Pending...",
                "role": "Organization Member",
                "company_role": user.company_role,
                "department": user.department or "Member",
                "profile_image": user.profile_image,
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

def get_user_notifications(db: Session, user_id: int, workspace_id: int = None, limit: int = 20):
    query = db.query(models.Notification).filter(models.Notification.user_id == user_id)
    if workspace_id:
        query = query.filter(models.Notification.workspace_id == workspace_id)
    return query.order_by(models.Notification.created_at.desc()).limit(limit).all()

def get_user_network(db: Session, user_id: int):
    # Get all workspace IDs the current user is a member of
    user_workspaces = db.query(models.workspace_members.c.workspace_id).filter(
        models.workspace_members.c.user_id == user_id
    ).subquery()
    
    # Get all users who are members of those workspaces (excluding the current user)
    network_users = db.query(models.User).join(
        models.workspace_members, models.User.id == models.workspace_members.c.user_id
    ).filter(
        models.workspace_members.c.workspace_id.in_(user_workspaces),
        models.User.id != user_id
    ).distinct().all()
    
    return network_users