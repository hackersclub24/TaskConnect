from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from .. import models, schemas
from ..auth import (
    authenticate_user,
    create_user,
    create_user_tokens,
    rotate_refresh_token,
    get_current_user,
)
from ..database import get_db


router = APIRouter()


@router.post("/register", response_model=schemas.UserOut)
def register(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    user = create_user(
        db=db,
        email=user_in.email,
        password=user_in.password,
        phone=user_in.phone,
        skills=user_in.skills,
        college_name=user_in.college_name,
    )
    return user


@router.post("/login", response_model=schemas.Token)
def login(
    user_in: schemas.UserLogin,
    request: Request,
    db: Session = Depends(get_db),
):
    user = authenticate_user(db, user_in.email, user_in.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    tokens = create_user_tokens(
        db,
        user.id,
        user_agent=request.headers.get("user-agent"),
        ip_address=request.client.host if request.client else None,
    )
    return {
        "access_token": tokens["access_token"],
        "refresh_token": tokens["refresh_token"],
        "token_type": "bearer",
    }


@router.post("/refresh", response_model=schemas.Token)
def refresh_access_token(
    payload: schemas.RefreshTokenRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    tokens = rotate_refresh_token(
        db,
        payload.refresh_token,
        user_agent=request.headers.get("user-agent"),
        ip_address=request.client.host if request.client else None,
    )
    if tokens is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )

    return {
        "access_token": tokens["access_token"],
        "refresh_token": tokens["refresh_token"],
        "token_type": "bearer",
    }


@router.get("/me", response_model=schemas.UserOut)
def read_current_user(current_user: models.User = Depends(get_current_user)):
    return current_user

