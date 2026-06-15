from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import crud, schemas, database, auth
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