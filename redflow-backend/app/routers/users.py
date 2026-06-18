from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import crud, schemas, database, auth, models
import smtplib
from email.mime.text import MIMEText
import os
from pydantic import BaseModel

from fastapi import APIRouter, Depends, HTTPException, Header
from jose import jwt, JWTError # Add this too!

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
    return crud.create_user(db=db, user=user)

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
            "role": authenticated_user.role
        }
    }

def get_current_user(authorization: str = Header(None), db: Session = Depends(get_db)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid token")
    token = authorization.split(" ")[1]
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
    
    # This is the React page we will build in Phase 2!
    reset_link = f"http://localhost:5173/reset-password?token={token}"
    
    msg = MIMEText(f"Click the link to reset your RedFlow password:\n\n{reset_link}\n\nThis link expires in 15 minutes.")
    msg["Subject"] = "RedFlow Password Reset"
    msg["From"] = sender_email
    msg["To"] = to_email
    
    # Connect to Gmail and send it
    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
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
    target_user = crud.get_user_by_email(db, email=invite.email)
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found! They must register an account first.")
    
    if invite.email == current_user.email:
        raise HTTPException(status_code=400, detail="You cannot invite yourself.")
        
    token = auth.create_reset_token(invite.email) 
    crud.create_invitation(db, invite.email, token, current_user.id) # <--- Removed role/dept
    
    sender_email = os.getenv("SMTP_USERNAME")
    sender_password = os.getenv("SMTP_PASSWORD")
    invite_link = f"http://localhost:5173/accept-invite?token={token}"
    msg = MIMEText(f"You have been invited to join a team on RedFlow!\n\nClick here to accept:\n{invite_link}") # <--- Removed role
    msg["Subject"] = "You're invited to a RedFlow Team!"
    msg["From"] = sender_email
    msg["To"] = invite.email
    
    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
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
def accept_team_invite(accept_data: schemas.InviteAccept, db: Session = Depends(get_db)):
    invite = crud.get_invitation_by_token(db, accept_data.token)
    if not invite:
        raise HTTPException(status_code=400, detail="Invalid or expired invite link.")
        
    invite.status = "Accepted"
    
    notif = models.Notification(
        user_id=invite.invited_by_id, 
        message=f"{invite.email} has accepted your team invitation!"
    )
    db.add(notif)
    
    db.commit()
    return {"message": "Successfully joined the team!"}

@router.get("/teammates", response_model=list[schemas.TeammateResponse])
def get_my_teammates(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # crud.get_teammates already includes the current_user at the top of the list!
    return crud.get_teammates(db, current_user.id)

@router.delete("/teammates/{teammate_id}")
def delete_teammate(teammate_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # SECURITY: Prevent the user from deleting themselves!
    if teammate_id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot remove yourself from your own team!")
        
    success = crud.remove_teammate(db, current_user.id, teammate_id)
    if not success:
        raise HTTPException(status_code=404, detail="Teammate not found or they are not on your team.")
    return {"message": "Teammate removed successfully!"}