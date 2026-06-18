from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Boolean, Table
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

# Association Table for Many-to-Many relationship between Users and Teams
team_members = Table(
    "team_members",
    Base.metadata,
    Column("user_id", Integer, ForeignKey("users.id")),
    Column("team_id", Integer, ForeignKey("teams.id"))
)

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
    teams = relationship("Team", secondary=team_members, back_populates="members")
    notifications = relationship("Notification", back_populates="user")

class Team(Base):
    __tablename__ = "teams"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    members = relationship("User", secondary=team_members, back_populates="teams")

class Project(Base):
    __tablename__ = "projects"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(String, nullable=True)
    start_date = Column(String, nullable=True) 
    end_date = Column(String, nullable=True)   
    status = Column(String, default="Planning") 
    created_by_id = Column(Integer, ForeignKey("users.id"))

    creator = relationship("User", back_populates="projects")
    tasks = relationship("Task", back_populates="project")
    members = relationship("User", secondary=project_members, back_populates="assigned_projects")

class Task(Base):
    __tablename__ = "tasks"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True) # Changed from title to name
    description = Column(String, nullable=True)
    status = Column(String, default="To Do") 
    priority = Column(String, default="Medium") 
    due_date = Column(String, nullable=True) # Changed to String
    created_at = Column(DateTime, default=datetime.utcnow)
    
    project_id = Column(Integer, ForeignKey("projects.id"))
    assignee_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    project = relationship("Project", back_populates="tasks")
    assignee = relationship("User")

class Notification(Base):
    __tablename__ = "notifications"
    id = Column(Integer, primary_key=True, index=True)
    message = Column(String)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user_id = Column(Integer, ForeignKey("users.id"))
    user = relationship("User", back_populates="notifications")

class Invitation(Base):
    __tablename__ = "invitations"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, index=True)
    token = Column(String, unique=True, index=True)
    status = Column(String, default="Pending")
    invited_by_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)

class Event(Base):
    __tablename__ = "events"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    description = Column(String, nullable=True)
    date = Column(String) # e.g., "2026-06-25"
    type = Column(String, default="Meeting") # Meeting, Reminder, etc.
    status = Column(String, default="Upcoming") 
    
    created_by_id = Column(Integer, ForeignKey("users.id"))
    creator = relationship("User")