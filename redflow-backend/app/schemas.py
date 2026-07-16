from pydantic import BaseModel, EmailStr, field_validator
from datetime import datetime
from typing import Optional, List, Dict

# --- ACCOUNTS ---
class AccountBase(BaseModel):
    name: str
    email: EmailStr

class AccountResponse(AccountBase):
    id: int
    is_verified: bool
    created_at: datetime
    class Config:
        from_attributes = True

# --- AUTH & ONBOARDING ---
class RegisterRequest(BaseModel):
    organization_name: str
    first_name: str
    last_name: str
    email: EmailStr

class SetPasswordRequest(BaseModel):
    token: str
    password: str

class VerifyOTPRequest(BaseModel):
    temp_token: str
    otp_code: str
    device_id: Optional[str] = None

# --- USERS ---
class TransferOrgRequest(BaseModel):
    new_super_admin_id: int

class UserBase(BaseModel):
    username: Optional[str] = None
    email: EmailStr
    full_name: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    company_role: Optional[str] = None
    department: Optional[str] = None
    profile_image: Optional[str] = None

class UserAvatarUpdate(BaseModel):
    avatar_base64: str

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    company_role: Optional[str] = None
    department: Optional[str] = None

class UserResponse(UserBase):
    id: int
    account_id: Optional[int] = None
    is_super_admin: bool = False
    created_at: datetime
    class Config:
        from_attributes = True

# --- WORKSPACES ---
class WorkspaceBase(BaseModel):
    name: str

class WorkspaceCreate(WorkspaceBase):
    pass

class WorkspaceUpdate(BaseModel):
    name: str

class WorkspaceTransfer(BaseModel):
    new_owner_id: int

class WorkspaceMemberRoleUpdate(BaseModel):
    role: str

class WorkspaceMemberAdd(BaseModel):
    user_id: int
    role: str

class WorkspaceResponse(WorkspaceBase):
    id: int
    account_id: int
    created_at: datetime
    user_role: Optional[str] = None
    class Config:
        from_attributes = True

# --- PROJECTS ---
class BoardColumn(BaseModel):
    name: str
    icon: Optional[str] = None
    color: Optional[str] = None

class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None
    start_date: Optional[str] = None 
    end_date: Optional[str] = None
    status: Optional[str] = "Planning"
    board_type: Optional[str] = "kanban"
    board_columns: Optional[List[BoardColumn]] = [
        {"name": "To Do", "icon": "Clock3", "color": "#facc15"},
        {"name": "In Progress", "icon": "PlayCircle", "color": "#22d3ee"},
        {"name": "Completed", "icon": "CheckCircle", "color": "#4ade80"}
    ]

    @field_validator("board_columns", mode="before")
    @classmethod
    def parse_board_columns(cls, v):
        if v is None:
            return v
        parsed = []
        for item in v:
            if isinstance(item, str):
                if item == "To Do":
                    parsed.append({"name": item, "icon": "Clock3", "color": "#facc15"})
                elif item == "In Progress":
                    parsed.append({"name": item, "icon": "PlayCircle", "color": "#22d3ee"})
                elif item == "Completed" or item == "Done":
                    parsed.append({"name": item, "icon": "CheckCircle", "color": "#4ade80"})
                else:
                    parsed.append({"name": item, "icon": "Circle", "color": "#94a3b8"})
            else:
                parsed.append(item)
        return parsed

class ProjectCreate(ProjectBase):
    workspace_id: int
    member_ids: List[int] = []

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    status: Optional[str] = None
    member_ids: Optional[List[int]] = None
    board_type: Optional[str] = None
    board_columns: Optional[List[BoardColumn]] = None

class ProjectResponse(ProjectBase):
    id: int
    created_by_id: int
    workspace_id: Optional[int] = None
    members: List[UserResponse] = []
    progress: int = 0
    calculated_status: str = "Planning"
    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    username: str
    password: str
    device_id: Optional[str] = None

# --- TASKS ---
class TaskBase(BaseModel):
    name: str
    description: Optional[str] = None
    status: Optional[str] = "To Do"
    priority: Optional[str] = "Medium"
    issue_type: Optional[str] = "Task"
    severity: Optional[str] = None
    due_date: Optional[str] = None
    project_id: int
    assignee_id: Optional[int] = None
    issue_type: Optional[str] = "Task"
    severity: Optional[str] = None
    position: Optional[float] = 0.0
    source_link: Optional[str] = None

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    issue_type: Optional[str] = None
    severity: Optional[str] = None
    due_date: Optional[str] = None
    project_id: Optional[int] = None
    assignee_id: Optional[int] = None
    position: Optional[float] = None
    source_link: Optional[str] = None

class TaskAttachmentResponse(BaseModel):
    id: int
    file_name: str
    file_url: str
    created_at: datetime
    task_id: int
    user_id: Optional[int] = None

    class Config:
        from_attributes = True

class SubtaskBase(BaseModel):
    title: str
    is_completed: Optional[bool] = False

class SubtaskCreate(SubtaskBase):
    task_id: int

class SubtaskUpdate(BaseModel):
    title: Optional[str] = None
    is_completed: Optional[bool] = None

class SubtaskResponse(SubtaskBase):
    id: int
    task_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class WorkLogBase(BaseModel):
    hours_spent: float
    description: Optional[str] = None

class WorkLogCreate(WorkLogBase):
    task_id: int

class WorkLogUpdate(BaseModel):
    hours_spent: Optional[float] = None
    description: Optional[str] = None

class WorkLogResponse(WorkLogBase):
    id: int
    task_id: int
    user_id: int
    created_at: datetime
    # We will exclude user info for now to avoid circular import with TeammateResponse
    # or we can import it if it's already defined

    class Config:
        from_attributes = True

class TaskResponse(TaskBase):
    id: int
    created_at: datetime
    ticket_id: Optional[str] = None
    attachments: List[TaskAttachmentResponse] = []
    subtasks: List[SubtaskResponse] = []
    work_logs: List[WorkLogResponse] = []
    
    class Config:
        from_attributes = True
    
# --- INVITATIONS ---
class InviteCreate(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    is_super_admin: bool = False
    workspace_id: Optional[int] = None
    workspace_access: Optional[str] = None
    project_id: Optional[int] = None

class InviteAccept(BaseModel):
    token: str
    password: Optional[str] = None
class TeammateResponse(BaseModel):
    id: int
    username: Optional[str] = None
    email: EmailStr
    full_name: Optional[str] = None
    role: str
    company_role: Optional[str] = None
    department: Optional[str] = None
    profile_image: Optional[str] = None
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
    workspace_id: Optional[int] = None
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
    category: Optional[str] = None
    file_url: Optional[str] = None

class WikiCreate(WikiBase):
    pass

class WikiUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    doc_type: Optional[str] = None
    category: Optional[str] = None
    file_url: Optional[str] = None

class WikiResponse(WikiBase):
    id: int
    project_id: int
    author_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    author: Optional["UserResponse"] = None

    class Config:
        from_attributes = True

class WikiHistoryResponse(BaseModel):
    id: int
    wiki_id: int
    title: str
    content: Optional[str] = None
    author_id: Optional[int] = None
    created_at: datetime
    author: Optional["UserResponse"] = None

    class Config:
        from_attributes = True

# --- ACCOUNT DELETION & TRANSFERS ---
class OwnedProjectMember(BaseModel):
    id: int
    name: str
    role: Optional[str] = None


class OwnedWorkspaceResponse(BaseModel):
    workspace_id: int
    workspace_name: str
    members: List[OwnedProjectMember]

class TransferWorkspacesRequest(BaseModel):
    workspaces_to_delete: List[int] = []
    transfers: Dict[int, int] = {}

# --- NOTEBOOK ITEMS ---
class NotebookItemBase(BaseModel):
    title: str
    item_type: str # "note" or "scribble"
    content: Optional[str] = None
    workspace_id: int

class NotebookItemCreate(NotebookItemBase):
    pass

class NotebookItemUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None

class NotebookItemResponse(NotebookItemBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# --- APP INTEGRATIONS ---
class IntegrationBase(BaseModel):
    provider: str
    access_token: str
    refresh_token: Optional[str] = None
    config: Optional[Dict] = None
    is_active: bool = True

class IntegrationCreate(IntegrationBase):
    workspace_id: int

class IntegrationResponse(IntegrationBase):
    id: int
    workspace_id: int
    created_at: datetime

    class Config:
        from_attributes = True

# --- ACTIVITY ---
class ActivityResponse(BaseModel):
    id: int
    project_id: int
    user_id: int
    action: str
    target_name: Optional[str] = None
    target_type: Optional[str] = None
    ticket_id: Optional[str] = None
    created_at: datetime
    user: Optional[TeammateResponse] = None

    class Config:
        from_attributes = True