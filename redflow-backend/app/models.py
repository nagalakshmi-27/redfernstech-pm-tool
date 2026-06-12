from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Boolean, Table
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

# Association table for Users and Teams (Many-to-Many)
team_members = Table(
    "team_members",
    Base.metadata,
    Column("user_id", Integer, ForeignKey("users.id")),
    Column("team_id", Integer, ForeignKey("teams.id"))
)

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(String) # admin, pm, team_mate, client
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    teams = relationship("Team", secondary=team_members, back_populates="members")
    projects_created = relationship("Project", back_populates="creator")
    tasks_assigned = relationship("Task", back_populates="assignee")
    notifications = relationship("Notification", back_populates="user")

class Team(Base):
    __tablename__ = "teams"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    members = relationship("User", secondary=team_members, back_populates="teams")

class Project(Base):
    __tablename__ = "projects"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(String, nullable=True)
    start_date = Column(DateTime, nullable=True)
    end_date = Column(DateTime, nullable=True)
    created_by_id = Column(Integer, ForeignKey("users.id"))
    
    # Relationships
    creator = relationship("User", back_populates="projects_created")
    tasks = relationship("Task", back_populates="project")

class Task(Base):
    __tablename__ = "tasks"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(String, nullable=True)
    status = Column(String, default="To Do")
    priority = Column(String, default="Medium")
    due_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    project_id = Column(Integer, ForeignKey("projects.id"))
    assignee_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Relationships
    project = relationship("Project", back_populates="tasks")
    assignee = relationship("User", back_populates="tasks_assigned")

class Notification(Base):
    __tablename__ = "notifications"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    message = Column(String)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="notifications")