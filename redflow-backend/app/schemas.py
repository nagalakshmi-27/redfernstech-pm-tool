from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

# --- USER SCHEMAS ---
class UserBase(BaseModel):
    email: EmailStr
    role: str

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    created_at: datetime
    class Config:
        orm_mode = True

# --- PROJECT SCHEMAS ---
class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None

class ProjectCreate(ProjectBase):
    pass

class ProjectResponse(ProjectBase):
    id: int
    created_by_id: int
    class Config:
        orm_mode = True

# --- TASK SCHEMAS ---
class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    status: str = "To Do"
    priority: str = "Medium"
    due_date: Optional[datetime] = None

class TaskCreate(TaskBase):
    project_id: int
    assignee_id: Optional[int] = None

class TaskResponse(TaskBase):
    id: int
    project_id: int
    assignee_id: Optional[int]
    created_at: datetime
    class Config:
        orm_mode = True