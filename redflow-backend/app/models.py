from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Boolean, Table
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

# Association Table for Many-to-Many relationship between Users and Teams
project_members = Table(
    "project_members",
    Base.metadata,
    Column("user_id", Integer, ForeignKey("users.id")),
    Column("project_id", Integer, ForeignKey("projects.id"))
)

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    full_name = Column(String, nullable=True)
    hashed_password = Column(String)
    role = Column(String) 
    department = Column(String, nullable=True) # <--- ADDED THIS!
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    projects = relationship("Project", back_populates="creator")
    assigned_projects = relationship("Project", secondary=project_members, back_populates="members")
    notifications = relationship("Notification", back_populates="user")

class Project(Base):
    __tablename__ = "projects"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(String, nullable=True)
    start_date = Column(String, nullable=True) 
    end_date = Column(String, nullable=True)   
    status = Column(String, default="Planning") 
    created_by_id = Column(Integer, ForeignKey("users.id"), index=True)

    creator = relationship("User", back_populates="projects")
    tasks = relationship("Task", back_populates="project")
    members = relationship("User", secondary=project_members, back_populates="assigned_projects")

    @property
    def progress(self):
        if not self.tasks:
            return 0
        completed = sum(1 for t in self.tasks if t.status == "Completed")
        return round((completed / len(self.tasks)) * 100)
        
    @property
    def calculated_status(self):
        if not self.tasks:
            return "Planning"
        if all(t.status == "Completed" for t in self.tasks):
            return "Completed"
        return "In Progress"

class Task(Base):
    __tablename__ = "tasks"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True) # Changed from title to name
    description = Column(String, nullable=True)
    status = Column(String, default="To Do") 
    priority = Column(String, default="Medium") 
    due_date = Column(String, nullable=True) # Changed to String
    created_at = Column(DateTime, default=datetime.utcnow)
    issue_type = Column(String, default="Task") # "Task" or "Bug"
    severity = Column(String, nullable=True)    # "Critical", "High", "Medium", "Low"
    ticket_id = Column(String, unique=True, index=True, nullable=True) # e.g. RED-1
    
    project_id = Column(Integer, ForeignKey("projects.id"), index=True)
    assignee_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)

    project = relationship("Project", back_populates="tasks")
    assignee = relationship("User")

class Notification(Base):
    __tablename__ = "notifications"
    id = Column(Integer, primary_key=True, index=True)
    message = Column(String)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    user = relationship("User", back_populates="notifications")

class Invitation(Base):
    __tablename__ = "invitations"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, index=True)
    role = Column(String, default="Teammate")
    token = Column(String, unique=True, index=True)
    status = Column(String, default="Pending")
    invited_by_id = Column(Integer, ForeignKey("users.id"), index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Event(Base):
    __tablename__ = "events"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    description = Column(String, nullable=True)
    date = Column(String) # e.g., "2026-06-25"
    type = Column(String, default="Meeting") # Meeting, Reminder, etc.
    status = Column(String, default="Upcoming") 
    
    created_by_id = Column(Integer, ForeignKey("users.id"), index=True)
    creator = relationship("User")