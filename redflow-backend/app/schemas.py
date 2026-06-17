from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, List

# --- USERS ---
class UserBase(BaseModel):
    email: EmailStr
    role: str
    full_name: Optional[str] = None # Added this!
class UserCreate(UserBase):
    password: str
class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    role: Optional[str] = None
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
    members: Optional[str] = None # <--- ADDED MEMBERS!

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    status: Optional[str] = None
    members: Optional[str] = None # <--- ADDED MEMBERS!

class ProjectResponse(ProjectBase):
    id: int
    created_by_id: int
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
    assignee_name: Optional[str] = None

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    due_date: Optional[str] = None
    project_id: Optional[int] = None
    assignee_name: Optional[str] = None

class TaskResponse(TaskBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True
    
# --- INVITATIONS ---
class InviteCreate(BaseModel):
    email: EmailStr
    role: str
    department: str
class InviteAccept(BaseModel):
    token: str
class TeammateResponse(BaseModel):
    id: int
    email: EmailStr
    full_name: Optional[str] = None
    role: str
    department: str