import os
from datetime import datetime, timedelta
from jose import jwt
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "your_super_secret_jwt_key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 10080 # Token expires in 7 days

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def create_reset_token(email: str):
    expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode = {"exp": expire, "sub": email, "type": "reset"}
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def verify_reset_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        # Make sure this isn't a regular login token!
        if payload.get("type") != "reset":
            return None
        return payload.get("sub")
    except JWTError:
        return None

def create_temp_login_token(user_id: int):
    expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode = {"exp": expire, "sub": str(user_id), "type": "temp_login"}
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def verify_temp_login_token(token: str):
    try:
        from jose import JWTError
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "temp_login":
            return None
        return int(payload.get("sub"))
    except JWTError:
        return None

def create_verification_token(account_id: int, user_data: dict):
    expire = datetime.utcnow() + timedelta(hours=24)
    to_encode = {"exp": expire, "account_id": account_id, "user_data": user_data, "type": "account_verify"}
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def verify_account_token(token: str):
    try:
        from jose import JWTError
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "account_verify":
            return None
        return payload
    except JWTError:
        return None