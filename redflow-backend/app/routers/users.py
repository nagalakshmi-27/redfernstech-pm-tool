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

import secrets

def send_email(to_email: str, subject: str, body: str):
    sender_email = os.getenv("SMTP_USERNAME")
    sender_password = os.getenv("SMTP_PASSWORD")
    msg = MIMEText(body)
    msg["Subject"] = subject
    msg["From"] = sender_email
    msg["To"] = to_email
    try:
        smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
        smtp_port = int(os.getenv("SMTP_PORT", 465))
        with smtplib.SMTP_SSL(smtp_host, smtp_port) as server:
            server.login(sender_email, sender_password)
            server.send_message(msg)
    except Exception:
        pass

@router.post("/register")
def register_account(request: schemas.RegisterRequest, db: Session = Depends(get_db)):
    if crud.get_user_by_email(db, request.email) or crud.get_account_by_email(db, request.email):
        raise HTTPException(status_code=400, detail="Email already registered")
        
    account = crud.create_account(db, request.organization_name, request.email)
    user_data = request.model_dump()
    token = auth.create_verification_token(account.id, user_data)
    
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173").split(",")[0].strip()
    verify_link = f"{frontend_url}/verify-account?token={token}"
    send_email(request.email, "Verify Your RedFlow Account", f"Click here to verify: {verify_link}")
    return {"message": "Verification email sent"}

@router.post("/set-password")
def set_password(request: schemas.SetPasswordRequest, db: Session = Depends(get_db)):
    payload = auth.verify_account_token(request.token)
    if not payload:
        raise HTTPException(status_code=400, detail="Invalid or expired token")
        
    account_id = payload["account_id"]
    user_data = payload["user_data"]
    
    account = db.query(models.Account).filter(models.Account.id == account_id).first()
    if not account: raise HTTPException(status_code=404)
    account.is_verified = True
    db.commit()
    
    user_data["password"] = request.password
    
    email_prefix = user_data["email"].split("@")[0]
    org_name = "".join(e for e in account.name if e.isalnum())
    base_username = f"{email_prefix}.{org_name}"
    username = base_username
    counter = 1
    while crud.get_user_by_username(db, username):
        username = f"{base_username}{counter}"
        counter += 1
    
    user_data["username"] = username
    
    user_create = schemas.UserCreate(**user_data)
    new_user = crud.create_user(db, user_create, account_id, is_super_admin=True)
    
    # Create default workspace
    default_ws = schemas.WorkspaceCreate(name=f"{account.name} Workspace")
    crud.create_workspace(db, default_ws, account.id, new_user.id)
    
    return {"message": "Account verified and user created successfully"}

@router.post("/login")
def login_user(user: schemas.UserLogin, db: Session = Depends(get_db)):
    authenticated_user = crud.authenticate_user(db, user.username, user.password)
    if not authenticated_user:
        raise HTTPException(status_code=400, detail="Incorrect User-Name or password")
        
    if user.device_id and crud.check_user_device(db, authenticated_user.id, user.device_id):
        access_token = auth.create_access_token(data={"sub": authenticated_user.username})
        return {
            "message": "Login successful",
            "access_token": access_token, 
            "token_type": "bearer", 
            "user": {
                "id": authenticated_user.id, 
                "email": authenticated_user.email, 
                "is_super_admin": authenticated_user.is_super_admin,
                "account_id": authenticated_user.account_id,
                "profile_image": authenticated_user.profile_image
            }
        }
        
    otp_code = str(secrets.choice(range(100000, 1000000)))
    from datetime import datetime, timedelta
    expires_at = datetime.utcnow() + timedelta(minutes=15)
    crud.create_otp(db, authenticated_user.email, otp_code, expires_at)
    
    send_email(authenticated_user.email, "Your RedFlow Login OTP", f"Your OTP is: {otp_code}. It expires in 15 minutes.\nYour User-Name is: {authenticated_user.username}")
    temp_token = auth.create_temp_login_token(authenticated_user.id)
    return {"message": "OTP sent to email", "temp_token": temp_token}

@router.post("/verify-otp")
def verify_otp(request: schemas.VerifyOTPRequest, db: Session = Depends(get_db)):
    user_id = auth.verify_temp_login_token(request.temp_token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Session expired, please login again")
        
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not crud.verify_and_consume_otp(db, user.email, request.otp_code):
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")
        
    if request.device_id:
        crud.add_user_device(db, user_id, request.device_id)
        
    access_token = auth.create_access_token(data={"sub": user.username})
    return {
        "access_token": access_token, 
        "token_type": "bearer", 
        "user": {
            "id": user.id, 
            "email": user.email, 
            "is_super_admin": user.is_super_admin,
            "account_id": user.account_id,
            "profile_image": user.profile_image
        }
    }

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        username = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        user = crud.get_user_by_username(db, username=username)
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        return user
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
    frontend_url = os.getenv("FRONTEND_URL", "https://main.d2zlo70oepu5a3.amplifyapp.com").split(",")[0].strip()
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
    
    access_token = auth.create_access_token(data={"sub": user.email})
    return {
        "message": "Password successfully reset!",
        "access_token": access_token,
        "user": {
            "id": user.id,
            "email": user.email,
            "profile_image": user.profile_image
        }
    }

# --- TEAMS & INVITATIONS LOGIC ---
@router.post("/invite")
def send_team_invite(invite: schemas.InviteCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if not current_user.is_super_admin:
        raise HTTPException(status_code=403, detail="Only super admins can invite users.")
        
    if not invite.is_super_admin:
        if invite.workspace_access == "Client" and not invite.project_id:
            raise HTTPException(status_code=400, detail="Project is mandatory when workspace access is Client.")
            
    existing_invite = db.query(models.Invitation).filter(
        models.Invitation.email == invite.email,
        models.Invitation.status == "Pending"
    ).first()
    
    if existing_invite:
        token = existing_invite.token
    else:
        token = uuid.uuid4().hex
        db_invite = models.Invitation(
            email=invite.email,
            full_name=f"{invite.first_name} {invite.last_name}",
            is_super_admin=invite.is_super_admin,
            role=invite.workspace_access,
            token=token,
            status="Pending",
            invited_by_id=current_user.id,
            workspace_id=invite.workspace_id,
            project_id=invite.project_id
        )
        db.add(db_invite)
        db.commit()
        
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173").split(",")[0].strip()
    invite_link = f"{frontend_url}/accept-invite?token={token}"
    
    send_email(invite.email, "You're invited to a RedFlow Team!", f"Click here to review and accept the invitation:\n{invite_link}")
    return {"message": "Invite sent successfully!"}

@router.get("/invite/{token}")
def get_invite(token: str, db: Session = Depends(get_db)):
    invitation = db.query(models.Invitation).filter(models.Invitation.token == token).first()
    if not invitation or invitation.status != "Pending":
        raise HTTPException(status_code=404, detail="Invite not found or already processed.")
        
    workspace = db.query(models.Workspace).filter(models.Workspace.id == invitation.workspace_id).first()
    inviter = db.query(models.User).filter(models.User.id == invitation.invited_by_id).first()
    user_exists = db.query(models.User).filter(
        models.User.email == invitation.email, 
        models.User.account_id == inviter.account_id
    ).first() is not None
    return {
        "email": invitation.email,
        "role": invitation.role,
        "department": workspace.name if workspace else "Organization Level",
        "user_exists": user_exists
    }

@router.post("/invite/{token}/accept")
def accept_invite(token: str, request: schemas.InviteAccept, db: Session = Depends(get_db)):
    invitation = db.query(models.Invitation).filter(models.Invitation.token == request.token).first()
    if not invitation or invitation.status != "Pending":
        raise HTTPException(status_code=404, detail="Invite not found or already processed.")
        
    invitation.status = "Accepted"
    
    inviter = db.query(models.User).filter(models.User.id == invitation.invited_by_id).first()
    if not inviter:
        raise HTTPException(status_code=400, detail="Inviter no longer exists")
        
    account_id = inviter.account_id
    account = db.query(models.Account).filter(models.Account.id == account_id).first()
    
    existing_org_user = db.query(models.User).filter(
        models.User.email == invitation.email,
        models.User.account_id == account_id
    ).first()
    
    if existing_org_user:
        new_user = existing_org_user
    else:
        if not request.password:
            raise HTTPException(status_code=400, detail="Password is required for new users")
            
        parts = invitation.full_name.split(" ", 1) if invitation.full_name else ["", ""]
        first_name = parts[0] if len(parts) > 0 else ""
        last_name = parts[1] if len(parts) > 1 else ""

        email_prefix = invitation.email.split("@")[0]
        org_name = "".join(e for e in account.name if e.isalnum())
        base_username = f"{email_prefix}.{org_name}"
        username = base_username
        counter = 1
        while crud.get_user_by_username(db, username):
            username = f"{base_username}{counter}"
            counter += 1

        new_user_data = schemas.UserCreate(
            username=username,
            email=invitation.email,
            password=request.password,
            first_name=first_name,
            last_name=last_name
        )
        new_user = crud.create_user(db=db, user=new_user_data, account_id=account_id, is_super_admin=invitation.is_super_admin)
    
    if not invitation.is_super_admin and invitation.workspace_id:
        # Check if they are already in the workspace to prevent duplicate key error
        existing_ws_member = db.query(models.workspace_members).filter(
            models.workspace_members.c.workspace_id == invitation.workspace_id,
            models.workspace_members.c.user_id == new_user.id
        ).first()
        if not existing_ws_member:
            stmt = models.workspace_members.insert().values(workspace_id=invitation.workspace_id, user_id=new_user.id, role=invitation.role)
            db.execute(stmt)
        
    if invitation.role == "Client" and invitation.project_id:
        existing_proj_member = db.query(models.project_members).filter(
            models.project_members.c.project_id == invitation.project_id,
            models.project_members.c.user_id == new_user.id
        ).first()
        if not existing_proj_member:
            stmt = models.project_members.insert().values(project_id=invitation.project_id, user_id=new_user.id)
            db.execute(stmt)
        
    db.commit()
    
    # Generate OTP for seamless login after accepting
    otp_code = str(secrets.choice(range(100000, 1000000)))
    from datetime import datetime, timedelta
    expires_at = datetime.utcnow() + timedelta(minutes=15)
    crud.create_otp(db, new_user.email, otp_code, expires_at)
    
    send_email(new_user.email, "Your RedFlow Login OTP", f"Your OTP is: {otp_code}. It expires in 15 minutes.\nYour User-Name is: {new_user.username}")
    temp_token = auth.create_temp_login_token(new_user.id)
    return {"message": "Invite accepted successfully. Check email for OTP to sign in.", "temp_token": temp_token, "username": new_user.username}

@router.post("/invite/{token}/decline")
def decline_invite(token: str, db: Session = Depends(get_db)):
    invitation = db.query(models.Invitation).filter(models.Invitation.token == token).first()
    if not invitation or invitation.status != "Pending":
        raise HTTPException(status_code=404, detail="Invite not found or already processed.")
        
    invitation.status = "Declined"
    db.commit()
    return {"message": "Invite declined successfully."}

@router.get("/eligible-super-admins")
def get_eligible_super_admins(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if not current_user.is_super_admin:
        raise HTTPException(status_code=403, detail="Only super admins can view this")
    
    # Find users who are Admins in ANY workspace in this account
    eligible_users = db.query(models.User).join(
        models.workspace_members, models.User.id == models.workspace_members.c.user_id
    ).join(
        models.Workspace, models.Workspace.id == models.workspace_members.c.workspace_id
    ).filter(
        models.Workspace.account_id == current_user.account_id,
        models.workspace_members.c.role == "Admin",
        models.User.id != current_user.id
    ).distinct().all()
    
    return [{"id": u.id, "email": u.email, "full_name": u.full_name or "Pending..."} for u in eligible_users]

@router.put("/me/transfer-organization")
def transfer_organization(
    request: schemas.TransferOrgRequest, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
):
    if not current_user.is_super_admin:
        raise HTTPException(status_code=403, detail="Only super admins can transfer the organization")
        
    target_user = db.query(models.User).filter(models.User.id == request.new_super_admin_id, models.User.account_id == current_user.account_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="Target user not found")
        
    # Verify they are an admin in some workspace
    is_admin = db.query(models.workspace_members).join(models.Workspace, models.Workspace.id == models.workspace_members.c.workspace_id).filter(
        models.Workspace.account_id == current_user.account_id,
        models.workspace_members.c.user_id == target_user.id,
        models.workspace_members.c.role == "Admin"
    ).first()
    
    if not is_admin:
        raise HTTPException(status_code=400, detail="Target user must be an Admin in at least one workspace")
        
    # Promote target user
    target_user.is_super_admin = True
    
    # Demote current user
    current_user.is_super_admin = False
    
    db.commit()
    return {"message": "Organization transferred successfully"}

@router.delete("/me")
def delete_user_account(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    user_id = current_user.id
    
    if current_user.is_super_admin:
        # If super admin, delete the entire organization account
        account = db.query(models.Account).filter(models.Account.id == current_user.account_id).first()
        if account:
            # Prevent FK violations for new tables without cascades
            user_ids = [u.id for u in account.users]
            if user_ids:
                db.query(models.UserDevice).filter(models.UserDevice.user_id.in_(user_ids)).delete(synchronize_session=False)
                
            db.delete(account)
            db.commit()
            return {"message": "Organization account deleted successfully"}
    else:
        # Prevent FK violations
        db.query(models.UserDevice).filter(models.UserDevice.user_id == user_id).delete(synchronize_session=False)

        # Transfer all projects created by this user to the account super admin
        super_admin = db.query(models.User).filter(
            models.User.account_id == current_user.account_id, 
            models.User.is_super_admin == True
        ).first()
        admin_id = super_admin.id if super_admin else None
        
        user_projects = db.query(models.Project).filter(models.Project.created_by_id == user_id).all()
        for proj in user_projects:
            proj.created_by_id = admin_id
                
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
def get_my_teammates(workspace_id: Optional[int] = None, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return crud.get_teammates(db, workspace_id, current_user.account_id)

@router.get("/network", response_model=list[schemas.UserResponse])
def get_user_network(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return crud.get_user_network(db, current_user.id)


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

@router.get("/fix_teammates_sync")
def fix_teammates_sync(db: Session = Depends(get_db)):
    # Find all accepted invitations without a workspace
    accepted = db.query(models.Invitation).filter(
        models.Invitation.status == "Accepted",
        models.Invitation.workspace_id == None
    ).all()
    for inv in accepted:
        inviter = db.query(models.User).filter(models.User.id == inv.invited_by_id).first()
        target = db.query(models.User).filter(models.User.email == inv.email).first()
        if inviter and target:
            target.account_id = inviter.account_id
    db.commit()
    return {"message": "Sync complete"}