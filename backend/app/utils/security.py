from datetime import datetime, timedelta
from typing import Optional, Union
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.config import settings
from app.database import get_db
from app.models import Participant, Admin

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# HTTP Bearer token scheme
security = HTTPBearer()

# PASSWORD HASHING
def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return pwd_context.verify(plain_password, hashed_password)


# JWT TOKEN FUNCTIONS
def create_access_token(
    data: dict,
    expires_delta: Optional[timedelta] = None
) -> str:
    """
    Create JWT access token
    
    Args:
        data: Dictionary with user info (sub, role, etc.)
        expires_delta: Optional custom expiration time
    
    Returns:
        Encoded JWT token string
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )
    
    return encoded_jwt


def verify_token(token: str) -> dict:
    """
    Verify and decode JWT token
    
    Args:
        token: JWT token string
    
    Returns:
        Decoded token payload
    
    Raises:
        HTTPException: If token is invalid or expired
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        return payload
    except JWTError:
        raise credentials_exception



# AUTHENTICATION DEPENDENCIES
def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> Union[Participant, Admin]:
    """
    Get current authenticated user from JWT token
    Works for both participants and admins
    """
    token = credentials.credentials
    payload = verify_token(token)
    
    user_id: str = payload.get("sub")
    role: str = payload.get("role")
    
    if user_id is None or role is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials"
        )
    
    # Query based on role
    if role == "participant":
        user = db.query(Participant).filter(Participant.id == user_id).first()
    elif role == "admin":
        user = db.query(Admin).filter(Admin.id == user_id).first()
    else:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid role"
        )
    
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    return user


def get_current_participant(
    current_user: Union[Participant, Admin] = Depends(get_current_user)
) -> Participant:
    """
    Get current participant (role-restricted dependency)
    Raises 403 if user is not a participant
    """
    if not isinstance(current_user, Participant):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Participant access required"
        )
    return current_user


def get_current_admin(
    current_user: Union[Participant, Admin] = Depends(get_current_user)
) -> Admin:
    """
    Get current admin (role-restricted dependency)
    Raises 403 if user is not an admin
    """
    if not isinstance(current_user, Admin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user