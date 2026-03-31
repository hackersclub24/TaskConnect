import os
import secrets

from fastapi import APIRouter, Depends, HTTPException, status
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
from sqlalchemy.orm import Session

from .. import models, schemas
from ..auth import create_user_tokens
from ..core.security import get_password_hash
from ..database import get_db


router = APIRouter(tags=["auth"])


@router.post("/auth/google", response_model=schemas.GoogleAuthResponse)
@router.post("/api/auth/google", response_model=schemas.GoogleAuthResponse)
def google_login(payload: schemas.GoogleTokenIn, db: Session = Depends(get_db)):
    try:
        project_id = os.getenv("FIREBASE_PROJECT_ID")
        token_data = id_token.verify_firebase_token(
            payload.token,
            google_requests.Request(),
            audience=project_id,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired Firebase ID token",
        ) from exc

    if not token_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token verification failed",
        )

    email = token_data.get("email")
    name = token_data.get("name")

    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email claim is missing in token",
        )

    user = db.query(models.User).filter(models.User.email == email).first()

    if not user:
        # Mock-friendly create flow for first Google login.
        user = models.User(
            email=email,
            name=name,
            hashed_password=get_password_hash(secrets.token_urlsafe(32)),
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    tokens = create_user_tokens(user.id)

    return {
        "success": True,
        "user": user,
        "access_token": tokens["access_token"],
        "refresh_token": tokens["refresh_token"],
        "token_type": "bearer",
    }
