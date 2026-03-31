from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from . import models
from .core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    create_refresh_token,
    decode_access_token,
    decode_refresh_token,
)
from .database import get_db


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")
optional_oauth2 = HTTPBearer(auto_error=False)


def authenticate_user(db: Session, email: str, password: str):
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user


def create_user(
    db: Session,
    email: str,
    password: str,
    phone: str | None = None,
    skills: str | None = None,
    college_name: str | None = None,
):
    existing = db.query(models.User).filter(models.User.email == email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    hashed_password = get_password_hash(password)
    user = models.User(
        email=email,
        hashed_password=hashed_password,
        phone=phone,
        skills=skills,
        college_name=college_name,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def create_user_token(user_id: int) -> str:
    return create_access_token({"sub": str(user_id)})


def create_user_tokens(user_id: int) -> dict[str, str]:
    return {
        "access_token": create_access_token({"sub": str(user_id)}),
        "refresh_token": create_refresh_token({"sub": str(user_id)}),
    }


def decode_user_refresh_token(token: str):
    return decode_refresh_token(token)


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> models.User:
    token_data = decode_access_token(token)
    if token_data is None or token_data.user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user = db.query(models.User).filter(models.User.id == token_data.user_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
    return user


def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(optional_oauth2),
    db: Session = Depends(get_db),
) -> Optional[models.User]:
    """Returns current user if logged in, else None. Used for optional auth in public endpoints."""
    if not credentials:
        return None
    token_data = decode_access_token(credentials.credentials)
    if token_data is None or token_data.user_id is None:
        return None
    user = db.query(models.User).filter(models.User.id == token_data.user_id).first()
    return user

