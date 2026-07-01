from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import crud, schemas, database, auth, models
import smtplib
from email.mime.text import MIMEText
import os
import base64
import uuid
from pydantic import BaseModel

from fastapi import APIRouter, Depends, HTTPException, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError

security = HTTPBearer()

router = APIRouter(prefix="/users", tags=["Users"])

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Sign Up Route
@router.post("/", response_model=schemas.UserResponse)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    invitation = db.query(models.Invitation).filter(
        models.Invitation.email == user.email
    ).order_by(models.Invitation.id.desc()).first()
    
    # Global roles are removed; workspace roles are assigned upon workspace creation or invite acceptance.
        
    new_user = crud.create_user(db=db, user=user)
    
    # Create personal workspace
    workspace_name = f"{new_user.first_name}'s Workspace" if new_user.first_name else f"{new_user.email.split('@')[0]}'s Workspace"
    crud.create_workspace(db, schemas.WorkspaceCreate(name=workspace_name), new_user.id)
    
    # Check if they had a pending invitation and add them
    if invitation and invitation.workspace_id:
        invitation.status = "Accepted"
        stmt = models.workspace_members.insert().values(workspace_id=invitation.workspace_id, user_id=new_user.id, role=invitation.role)
        db.execute(stmt)
        db.commit()
        
    return new_user

# Sign In (Login) Route
@router.post("/login")
def login_user(user: schemas.UserLogin, db: Session = Depends(get_db)):
    authenticated_user = crud.authenticate_user(db, user.email, user.password)
    if not authenticated_user:
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    # Generate the JWT Token
    access_token = auth.create_access_token(data={"sub": authenticated_user.email})
    
    return {
        "access_token": access_token, 
        "token_type": "bearer", 
        "user": {
            "id": authenticated_user.id, 
            "email": authenticated_user.email, 
            "profile_image": authenticated_user.profile_image
        }
    }

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        email = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return crud.get_user_by_email(db, email=email)
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

@router.get("/me", response_model=schemas.UserResponse)
def get_my_settings(current_user: models.User = Depends(get_current_user)):
    return current_user

@router.put("/me", response_model=schemas.UserResponse)
def update_my_settings(user_update: schemas.UserUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return crud.update_user(db=db, user=current_user, user_update=user_update)

@router.post("/me/avatar")
def upload_avatar(avatar_update: schemas.UserAvatarUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # Create uploads directory if not exists
    os.makedirs("uploads/users", exist_ok=True)
    
    # Process base64 string
    # Usually looks like: "data:image/png;base64,iVBORw0KGgo..."
    base64_str = avatar_update.avatar_base64
    if "," in base64_str:
        base64_str = base64_str.split(",")[1]
        
    try:
        image_data = base64.b64decode(base64_str)
        filename = f"avatar_{current_user.id}_{uuid.uuid4().hex[:8]}.png"
        file_path = f"uploads/users/{filename}"
        
        with open(file_path, "wb") as f:
            f.write(image_data)
            
        current_user.profile_image = f"/uploads/users/{filename}"
        db.commit()
        return {"message": "Profile picture updated successfully", "profile_image": current_user.profile_image}
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid image data")

@router.delete("/me/avatar")
def delete_avatar(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.profile_image:
        # Optional: Delete the physical file here if needed
        current_user.profile_image = None
        db.commit()
    return {"message": "Profile picture removed successfully"}

# --- CHANGE PASSWORD LOGIC ---
class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

@router.put("/me/password")
def change_password(passwords: ChangePasswordRequest, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # 1. Verify the current password is correct
    if not crud.verify_password(passwords.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect current password!")
    
    # 2. Save the new password
    crud.update_password(db, current_user, passwords.new_password)
    return {"message": "Password successfully updated!"}

# --- PASSWORD RESET LOGIC ---

# 1. Pydantic Schemas for our requests
class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

# 2. The actual Email Sending Function
def send_reset_email(to_email: str, token: str):
    sender_email = os.getenv("SMTP_USERNAME")
    sender_password = os.getenv("SMTP_PASSWORD")
    
    # Parse FRONTEND_URL to ensure it works in production
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173").split(",")[0].strip()
    reset_link = f"{frontend_url}/reset-password?token={token}"
    
    msg = MIMEText(f"Click the link to reset your RedFlow password:\n\n{reset_link}\n\nThis link expires in 15 minutes.")
    msg["Subject"] = "RedFlow Password Reset"
    msg["From"] = sender_email
    msg["To"] = to_email
    
    # Connect and send email
    smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", 465))
    
    with smtplib.SMTP_SSL(smtp_host, smtp_port) as server:
        server.login(sender_email, sender_password)
        server.send_message(msg)

# 3. Forgot Password Endpoint (Sends the email)
@router.post("/forgot-password")
def forgot_password(request: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = crud.get_user_by_email(db, email=request.email)
    
    if user:
        token = auth.create_reset_token(user.email)
        try:
            send_reset_email(user.email, token)
        except Exception as e:
            raise HTTPException(status_code=500, detail="Failed to send email. Check your SMTP credentials in .env!")
    
    # We always return success so hackers can't use this to guess who has an account!
    return {"message": "If that email exists, a reset link was sent!"}

# 4. Reset Password Endpoint (Changes the password)
@router.post("/reset-password")
def reset_password(request: ResetPasswordRequest, db: Session = Depends(get_db)):
    email = auth.verify_reset_token(request.token)
    if not email:
        raise HTTPException(status_code=400, detail="Invalid or expired reset link")
    
    user = crud.get_user_by_email(db, email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    crud.update_password(db, user, request.new_password)
    return {"message": "Password successfully reset!"}

# --- TEAMS & INVITATIONS LOGIC ---
@router.post("/invite")
def send_team_invite(invite: schemas.InviteCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if not invite.workspace_id:
        raise HTTPException(status_code=400, detail="Workspace ID is required to invite users.")
        
    workspace_membership = db.query(models.workspace_members).filter(
        models.workspace_members.c.workspace_id == invite.workspace_id, 
        models.workspace_members.c.user_id == current_user.id
    ).first()
    
    if not workspace_membership or workspace_membership.role == "Client":
        raise HTTPException(status_code=403, detail="Clients cannot invite new users.")
        
    if invite.role == "Admin" and workspace_membership.role != "Admin":
        raise HTTPException(status_code=403, detail="Only Workspace Admins can invite someone as an Admin.")
        
    if invite.email == current_user.email:
        raise HTTPException(status_code=400, detail="You cannot invite yourself.")
        
    token = auth.create_reset_token(invite.email) 
    crud.create_invitation(db, invite.email, token, current_user.id, invite.role, invite.workspace_id)
    
    sender_email = os.getenv("SMTP_USERNAME")
    sender_password = os.getenv("SMTP_PASSWORD")
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173").split(",")[0].strip()
    invite_link = f"{frontend_url}/accept-invite?token={token}"
    msg = MIMEText(f"You have been invited to join a team on RedFlow!\n\nClick here to accept:\n{invite_link}") # <--- Removed role
    msg["Subject"] = "You're invited to a RedFlow Team!"
    msg["From"] = sender_email
    msg["To"] = invite.email
    
    try:
        smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
        smtp_port = int(os.getenv("SMTP_PORT", 465))
        with smtplib.SMTP_SSL(smtp_host, smtp_port) as server:
            server.login(sender_email, sender_password)
            server.send_message(msg)
    except Exception as e:
        pass
        
    return {"message": "Invite sent successfully!"}

@router.get("/invite/{token}")
def get_invite_info(token: str, db: Session = Depends(get_db)):
    invite = crud.get_invitation_by_token(db, token)
    if not invite:
        raise HTTPException(status_code=400, detail="Invalid or expired invite link.")
    return {"email": invite.email} # <--- Removed role/dept

@router.post("/invite/accept")
def accept_team_invite(accept_data: schemas.InviteAccept, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    invite = crud.get_invitation_by_token(db, accept_data.token)
    if not invite:
        raise HTTPException(status_code=400, detail="Invalid or expired invite link.")
        
    if invite.email != current_user.email:
        raise HTTPException(status_code=403, detail=f"This invite was sent to {invite.email}, but you are logged in as {current_user.email}. Please log in with the correct account.")
        
    invite.status = "Accepted"
    
    if invite.workspace_id:
        exists = db.query(models.workspace_members).filter(models.workspace_members.c.workspace_id == invite.workspace_id, models.workspace_members.c.user_id == current_user.id).first()
        if not exists:
            stmt = models.workspace_members.insert().values(workspace_id=invite.workspace_id, user_id=current_user.id, role=invite.role)
            db.execute(stmt)
            
    notif = models.Notification(
        user_id=invite.invited_by_id, 
        message=f"{current_user.email} has accepted your workspace invitation!"
    )
    db.add(notif)
    
    db.commit()
    return {"message": "Successfully joined the workspace!"}

@router.get("/me/owned-workspaces", response_model=list[schemas.OwnedWorkspaceResponse])
def get_owned_workspaces(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    workspaces = db.query(models.Workspace).filter(models.Workspace.owner_id == current_user.id).all()
    response = []
    for ws in workspaces:
        ws_members = db.query(models.workspace_members).filter(models.workspace_members.c.workspace_id == ws.id).all()
        role_map = {m.user_id: m.role for m in ws_members}
        members = [{"id": m.id, "name": (m.first_name + " " + m.last_name).strip() if m.first_name and m.last_name else m.email, "role": role_map.get(m.id)} for m in ws.members if m.id != current_user.id]
        response.append({
            "workspace_id": ws.id,
            "workspace_name": ws.name,
            "members": members
        })
    return response

@router.put("/me/transfer-workspaces")
def transfer_owned_workspaces(
    request: schemas.TransferWorkspacesRequest, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
):
    user_id = current_user.id
    
    # Process deletions for empty workspaces
    for ws_id in request.workspaces_to_delete:
        workspace = db.query(models.Workspace).filter(models.Workspace.id == ws_id, models.Workspace.owner_id == user_id).first()
        if workspace:
            db.delete(workspace)
            
    # Process transfers to new owners
    for ws_id, new_owner_id in request.transfers.items():
        workspace = db.query(models.Workspace).filter(models.Workspace.id == int(ws_id), models.Workspace.owner_id == user_id).first()
        if workspace:
            workspace.owner_id = new_owner_id
            # Also ensure new owner is an Admin in workspace_members
            membership = db.query(models.workspace_members).filter(models.workspace_members.c.workspace_id == int(ws_id), models.workspace_members.c.user_id == new_owner_id).first()
            if membership:
                # Need to use update since it's a table, not a model
                stmt = models.workspace_members.update().where(
                    (models.workspace_members.c.workspace_id == int(ws_id)) & 
                    (models.workspace_members.c.user_id == new_owner_id)
                ).values(role="Admin")
                db.execute(stmt)
            else:
                stmt = models.workspace_members.insert().values(workspace_id=int(ws_id), user_id=new_owner_id, role="Admin")
                db.execute(stmt)
            
    db.commit()
    return {"message": "Workspaces transferred and deleted successfully"}

@router.delete("/me")
def delete_user_account(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    user_id = current_user.id
    
    # Delete workspaces owned by the user (this cascades to projects, tasks, etc.)
    workspaces = db.query(models.Workspace).filter(models.Workspace.owner_id == user_id).all()
    for ws in workspaces:
        db.delete(ws)

    
    # Transfer all projects created by this user to the workspace owner
    user_projects = db.query(models.Project).filter(models.Project.created_by_id == user_id).all()
    for proj in user_projects:
        workspace = db.query(models.Workspace).filter(models.Workspace.id == proj.workspace_id).first()
        if workspace:
            proj.created_by_id = workspace.owner_id
        else:
            proj.created_by_id = None
            
    # Nullify creator/author references for other items to preserve the data but anonymize the user
    db.query(models.Task).filter(models.Task.assignee_id == user_id).update({"assignee_id": None})
    db.query(models.Comment).filter(models.Comment.user_id == user_id).update({"user_id": None})
    db.query(models.Message).filter(models.Message.user_id == user_id).update({"user_id": None})
    db.query(models.TaskAttachment).filter(models.TaskAttachment.user_id == user_id).update({"user_id": None})
    db.query(models.WikiPage).filter(models.WikiPage.author_id == user_id).update({"author_id": None})
    db.query(models.WikiPageHistory).filter(models.WikiPageHistory.author_id == user_id).update({"author_id": None})
    db.query(models.Event).filter(models.Event.created_by_id == user_id).update({"created_by_id": None})
    db.query(models.Invitation).filter(models.Invitation.invited_by_id == user_id).update({"invited_by_id": None})
    
    # Delete personal notifications
    db.query(models.Notification).filter(models.Notification.user_id == user_id).delete()
    
    # Clear many-to-many relationship
    current_user.assigned_projects = []
    
    # Finally, delete the user record
    db.delete(current_user)
    db.commit()
    
    return {"message": "Account deleted successfully"}

@router.get("/teammates", response_model=list[schemas.TeammateResponse])
def get_my_teammates(workspace_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return crud.get_teammates(db, workspace_id)

@router.delete("/teammates/{teammate_id}")
def delete_teammate(teammate_id: int, workspace_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # SECURITY: Prevent the user from deleting themselves!
    if teammate_id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot remove yourself from your own team!")
        
    # SECURITY: Check Admin status for the specific workspace
    ws_membership = db.query(models.workspace_members).filter(models.workspace_members.c.workspace_id == workspace_id, models.workspace_members.c.user_id == current_user.id).first()
    if not ws_membership or ws_membership.role != "Admin":
        raise HTTPException(status_code=403, detail="Only Workspace Admins can remove teammates.")
        
    success = crud.remove_teammate(db, workspace_id, teammate_id)
    if not success:
        raise HTTPException(status_code=404, detail="Teammate not found or they are not on your team.")
    return {"message": "Teammate removed successfully!"}