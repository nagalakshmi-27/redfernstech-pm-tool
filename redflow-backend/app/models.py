from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Boolean, Table, Float, JSON
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

workspace_members = Table(
    "workspace_members",
    Base.metadata,
    Column("user_id", Integer, ForeignKey("users.id")),
    Column("workspace_id", Integer, ForeignKey("workspaces.id")),
    Column("role", String, default="Member") # Admin, Member, Client within this workspace
)

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    full_name = Column(String, nullable=True) # Keeping for backwards compatibility
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    hashed_password = Column(String)
    company_role = Column(String, nullable=True) # Developer, Designer, etc
    department = Column(String, nullable=True)
    profile_image = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    owned_workspaces = relationship("Workspace", back_populates="owner")
    workspaces = relationship("Workspace", secondary=workspace_members, back_populates="members")
    
    projects = relationship("Project", back_populates="creator")
    assigned_projects = relationship("Project", secondary=project_members, back_populates="members")
    notifications = relationship("Notification", back_populates="user")

class Workspace(Base):
    __tablename__ = "workspaces"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    owner_id = Column(Integer, ForeignKey("users.id"), index=True)

    owner = relationship("User", back_populates="owned_workspaces")
    members = relationship("User", secondary=workspace_members, back_populates="workspaces")
    projects = relationship("Project", back_populates="workspace", cascade="all, delete-orphan")
    invitations = relationship("Invitation", back_populates="workspace", cascade="all, delete-orphan")

class Project(Base):
    __tablename__ = "projects"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(String, nullable=True)
    start_date = Column(String, nullable=True) 
    end_date = Column(String, nullable=True)   
    status = Column(String, default="Planning") 
    created_by_id = Column(Integer, ForeignKey("users.id"), index=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=True, index=True)
    
    board_type = Column(String, default="kanban")
    board_columns = Column(JSON, default=[
        {"name": "To Do", "icon": "Clock3", "color": "#facc15"},
        {"name": "In Progress", "icon": "PlayCircle", "color": "#22d3ee"},
        {"name": "Completed", "icon": "CheckCircle", "color": "#4ade80"}
    ])
    project_key = Column(String, index=True, nullable=True)
    task_counter = Column(Integer, default=0)

    creator = relationship("User", back_populates="projects")
    workspace = relationship("Workspace", back_populates="projects")
    tasks = relationship("Task", back_populates="project", cascade="all, delete-orphan")
    members = relationship("User", secondary=project_members, back_populates="assigned_projects")
    messages = relationship("Message", back_populates="project", cascade="all, delete-orphan")
    wiki_pages = relationship("WikiPage", back_populates="project", cascade="all, delete-orphan")
    @property
    def progress(self):
        if not self.tasks:
           return 0

        completed = sum(
           1 for t in self.tasks
           if t.status.lower() == "completed"
        )

        return round((completed / len(self.tasks)) * 100)
        
    @property
    def calculated_status(self):
        if not self.tasks:
          return "Planning"

        completed = sum(
          1 for t in self.tasks
          if t.status.lower() == "completed"
        )

        if completed == len(self.tasks):
          return "Completed"

        if completed > 0:
          return "In Progress"

        return "Planning"

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
    position = Column(Float, default=0.0)
    source_link = Column(String, nullable=True)
    
    project_id = Column(Integer, ForeignKey("projects.id"), index=True)
    assignee_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)

    project = relationship("Project", back_populates="tasks")
    assignee = relationship("User", foreign_keys=[assignee_id])
    creator = relationship("User", foreign_keys=[created_by_id])

    comments = relationship("Comment", back_populates="task", cascade="all, delete-orphan")
    attachments = relationship("TaskAttachment", back_populates="task", cascade="all, delete-orphan")
    subtasks = relationship("Subtask", back_populates="task", cascade="all, delete-orphan")
    work_logs = relationship("WorkLog", back_populates="task", cascade="all, delete-orphan")

class TaskAttachment(Base):
    __tablename__ = "task_attachments"
    id = Column(Integer, primary_key=True, index=True)
    file_name = Column(String)
    file_url = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    task_id = Column(Integer, ForeignKey("tasks.id"), index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    
    task = relationship("Task", back_populates="attachments")
    user = relationship("User")

class Subtask(Base):
    __tablename__ = "subtasks"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    is_completed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    task_id = Column(Integer, ForeignKey("tasks.id"), index=True)
    task = relationship("Task", back_populates="subtasks")

class WorkLog(Base):
    __tablename__ = "work_logs"
    id = Column(Integer, primary_key=True, index=True)
    hours_spent = Column(Float)
    description = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    task_id = Column(Integer, ForeignKey("tasks.id"), index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    
    task = relationship("Task", back_populates="work_logs")
    user = relationship("User")

class Notification(Base):
    __tablename__ = "notifications"
    id = Column(Integer, primary_key=True, index=True)
    message = Column(String)
    type = Column(String, nullable=True)
    link = Column(String, nullable=True)
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
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    workspace = relationship("Workspace", back_populates="invitations")

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

class Comment(Base):
    __tablename__ = "comments"
    id = Column(Integer, primary_key=True, index=True)
    content = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    task_id = Column(Integer, ForeignKey("tasks.id"), index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    
    task = relationship("Task", back_populates="comments")
    user = relationship("User")

    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True)
class Message(Base):
    __tablename__ = "messages"
    id = Column(Integer, primary_key=True, index=True)
    content = Column(String)
    file_url = Column(String, nullable=True)
    file_name = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    project_id = Column(Integer, ForeignKey("projects.id"), index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    
    project = relationship("Project", back_populates="messages")
    user = relationship("User")
class WikiPage(Base):
    __tablename__ = "wiki_pages"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    content = Column(String, nullable=True) # Will store HTML from rich text editor
    doc_type = Column(String, default="text") # "text", "file", "link"
    category = Column(String, nullable=True) # E.g., "Design", "Technical", "Notes"
    file_url = Column(String, nullable=True) # URL or path to file
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    project_id = Column(Integer, ForeignKey("projects.id"), index=True)
    author_id = Column(Integer, ForeignKey("users.id"))
    
    project = relationship("Project", back_populates="wiki_pages")
    author = relationship("User")
    histories = relationship("WikiPageHistory", back_populates="wiki", cascade="all, delete-orphan")

class WikiPageHistory(Base):
    __tablename__ = "wiki_page_histories"
    id = Column(Integer, primary_key=True, index=True)
    wiki_id = Column(Integer, ForeignKey("wiki_pages.id"), index=True)
    title = Column(String)
    content = Column(String, nullable=True)
    author_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    wiki = relationship("WikiPage", back_populates="histories")
    author = relationship("User")

class NotebookItem(Base):
    __tablename__ = "notebook_items"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, default="Untitled")
    item_type = Column(String, default="note") # "note" or "scribble"
    content = Column(String, nullable=True) # Text or base64 image data
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), index=True)
    
    user = relationship("User")
    workspace = relationship("Workspace")

class AppIntegration(Base):
    __tablename__ = "app_integrations"
    id = Column(Integer, primary_key=True, index=True)
    provider = Column(String, index=True) # e.g. 'github', 'slack'
    access_token = Column(String)
    refresh_token = Column(String, nullable=True)
    config = Column(JSON, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), index=True)
    workspace = relationship("Workspace")

class Activity(Base):
    __tablename__ = "activities"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    action = Column(String) # e.g. "created_task", "deleted_task", "changed_status"
    target_name = Column(String, nullable=True) # e.g. "Fix Navbar"
    target_type = Column(String, nullable=True) # e.g. "Task", "Project"
    ticket_id = Column(String, nullable=True) # e.g. "RED-1"
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project")
    user = relationship("User")