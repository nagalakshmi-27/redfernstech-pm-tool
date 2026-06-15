from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import crud, schemas, database, auth

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