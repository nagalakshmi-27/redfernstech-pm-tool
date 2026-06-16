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
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None

class ProjectCreate(ProjectBase):
    pass

class ProjectResponse(ProjectBase):
    id: int
    created_by_id: int
    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    email: EmailStr
    password: str