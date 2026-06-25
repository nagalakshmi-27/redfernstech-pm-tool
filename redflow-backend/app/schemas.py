from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, List

# --- USERS ---
class UserBase(BaseModel):
    email: EmailStr
    role: str
    full_name: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    company_role: Optional[str] = None
    department: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    role: Optional[str] = None
    company_role: Optional[str] = None
    department: Optional[str] = None

class UserResponse(UserBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True

# --- PROJECTS ---
class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None
    start_date: Optional[str] = None 
    end_date: Optional[str] = None
    status: Optional[str] = "Planning"

class ProjectCreate(ProjectBase):
    member_ids: List[int] = []

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    status: Optional[str] = None
    member_ids: Optional[List[int]] = None

class ProjectResponse(ProjectBase):
    id: int
    created_by_id: int
    members: List[UserResponse] = []
    progress: int = 0
    calculated_status: str = "Planning"
    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    email: EmailStr
    password: str

# --- TASKS ---
class TaskBase(BaseModel):
    name: str
    description: Optional[str] = None
    status: Optional[str] = "To Do"
    priority: Optional[str] = "Medium"
    due_date: Optional[str] = None
    project_id: int
    assignee_id: Optional[int] = None
    issue_type: Optional[str] = "Task"
    severity: Optional[str] = None
    position: Optional[float] = 0.0

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    due_date: Optional[str] = None
    project_id: Optional[int] = None
    assignee_id: Optional[int] = None
    position: Optional[float] = None

class TaskAttachmentResponse(BaseModel):
    id: int
    file_name: str
    file_url: str
    created_at: datetime
    task_id: int
    user_id: int

    class Config:
        from_attributes = True

class TaskResponse(TaskBase):
    id: int
    created_at: datetime
    ticket_id: Optional[str] = None
    attachments: List[TaskAttachmentResponse] = []
    
    class Config:
        from_attributes = True
    
# --- INVITATIONS ---
class InviteCreate(BaseModel):
    email: EmailStr
    role: str = "Standard"
class InviteAccept(BaseModel):
    token: str
class TeammateResponse(BaseModel):
    id: int
    email: EmailStr
    full_name: Optional[str] = None
    role: str
    company_role: Optional[str] = None
    department: Optional[str] = None
    shared_projects: list[str] = []

# --- EVENTS ---
class EventBase(BaseModel):
    title: str
    description: Optional[str] = None
    date: str
    type: Optional[str] = "Meeting"
    status: Optional[str] = "Upcoming"

class EventCreate(EventBase):
    pass

class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    date: Optional[str] = None
    type: Optional[str] = None
    status: Optional[str] = None

class EventResponse(EventBase):
    id: int
    created_by_id: int
    class Config:
        from_attributes = True

# --- NOTIFICATIONS ---
class NotificationResponse(BaseModel):
    id: int
    message: str
    is_read: bool
    created_at: datetime
    user_id: int
    class Config:
        from_attributes = True

# --- COLLABORATION ---
class CommentBase(BaseModel):
    content: str

class CommentCreate(CommentBase):
    pass

class CommentResponse(CommentBase):
    id: int
    task_id: Optional[int] = None
    project_id: Optional[int] = None
    user_id: int
    created_at: datetime
    user: "UserResponse"  # Allows us to show the avatar/name of the commenter
    task: Optional[TaskResponse] = None

    class Config:
        from_attributes = True

class MessageBase(BaseModel):
    content: str
    file_url: Optional[str] = None
    file_name: Optional[str] = None

class MessageResponse(MessageBase):
    id: int
    project_id: int
    user_id: int
    created_at: datetime
    user: "UserResponse"

    class Config:
        from_attributes = True

class WikiBase(BaseModel):
    title: str
    content: Optional[str] = None
    doc_type: Optional[str] = "text"
    file_url: Optional[str] = None

class WikiCreate(WikiBase):
    pass

class WikiUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    doc_type: Optional[str] = None
    file_url: Optional[str] = None

class WikiResponse(WikiBase):
    id: int
    project_id: int
    author_id: int
    created_at: datetime
    updated_at: datetime
    author: "UserResponse"

    class Config:
        from_attributes = True