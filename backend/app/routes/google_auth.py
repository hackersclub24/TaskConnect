import os
import secrets

from fastapi import APIRouter, Depends, HTTPException, Request, status
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
from sqlalchemy.orm import Session

from .. import models, schemas
from ..auth import create_user_tokens, build_unique_user_slug
from ..core.security import get_password_hash
from ..database import get_db


router = APIRouter(tags=["auth"])


@router.post("/auth/google", response_model=schemas.GoogleAuthResponse)
@router.post("/api/auth/google", response_model=schemas.GoogleAuthResponse)
def google_login(
    payload: schemas.GoogleTokenIn,
    request: Request,
    db: Session = Depends(get_db),
):
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
        slug_seed = name if name and name.strip() else email.split("@")[0]
        user = models.User(
            slug=build_unique_user_slug(db, slug_seed),
            email=email,
            name=name,
            hashed_password=get_password_hash(secrets.token_urlsafe(32)),
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    elif not user.slug:
        slug_seed = user.name if user.name and user.name.strip() else user.email.split("@")[0]
        user.slug = build_unique_user_slug(db, slug_seed, exclude_user_id=user.id)
        db.commit()
        db.refresh(user)

    tokens = create_user_tokens(
        db,
        user.id,
        user_agent=request.headers.get("user-agent"),
        ip_address=request.client.host if request.client else None,
    )

    return {
        "success": True,
        "user": user,
        "access_token": tokens["access_token"],
        "refresh_token": tokens["refresh_token"],
        "token_type": "bearer",
    }
