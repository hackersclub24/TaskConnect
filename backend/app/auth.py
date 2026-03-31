from datetime import datetime
from typing import Optional
import re

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from . import models
from .core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    create_refresh_token,
    get_refresh_token_expiry,
    hash_refresh_token,
    decode_access_token,
    decode_refresh_token,
)
from .database import get_db


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")
optional_oauth2 = HTTPBearer(auto_error=False)


def _slugify_user(value: str) -> str:
    value = (value or "").strip().lower()
    value = re.sub(r"[^a-z0-9\s-]", "", value)
    value = re.sub(r"[\s_-]+", "-", value)
    return value.strip("-") or "user"


def build_unique_user_slug(
    db: Session,
    seed: str,
    exclude_user_id: int | None = None,
) -> str:
    base_slug = _slugify_user(seed)
    slug = base_slug
    suffix = 2

    while True:
        q = db.query(models.User).filter(models.User.slug == slug)
        if exclude_user_id is not None:
            q = q.filter(models.User.id != exclude_user_id)
        if not q.first():
            return slug
        slug = f"{base_slug}-{suffix}"
        suffix += 1


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
    name: str | None = None,
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
    slug_seed = name if name and name.strip() else email.split("@")[0]
    user = models.User(
        slug=build_unique_user_slug(db, slug_seed),
        email=email,
        hashed_password=hashed_password,
        name=name,
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


def create_user_tokens(
    db: Session,
    user_id: int,
    user_agent: str | None = None,
    ip_address: str | None = None,
) -> dict[str, str]:
    refresh_token = create_refresh_token({"sub": str(user_id)})
    token_record = models.RefreshToken(
        user_id=user_id,
        token_hash=hash_refresh_token(refresh_token),
        expires_at=get_refresh_token_expiry(),
        user_agent=user_agent,
        ip_address=ip_address,
    )
    db.add(token_record)
    db.commit()

    return {
        "access_token": create_access_token({"sub": str(user_id)}),
        "refresh_token": refresh_token,
    }


def rotate_refresh_token(
    db: Session,
    refresh_token: str,
    user_agent: str | None = None,
    ip_address: str | None = None,
) -> dict[str, str] | None:
    token_hash = hash_refresh_token(refresh_token)
    token_record = (
        db.query(models.RefreshToken)
        .filter(models.RefreshToken.token_hash == token_hash)
        .first()
    )
    if token_record is None:
        # Backward compatibility: accept previously issued JWT refresh tokens once.
        token_data = decode_refresh_token(refresh_token)
        if token_data is None or token_data.user_id is None:
            return None
        user = db.query(models.User).filter(models.User.id == token_data.user_id).first()
        if user is None:
            return None

        new_refresh_token = create_refresh_token({"sub": str(user.id)})
        next_token = models.RefreshToken(
            user_id=user.id,
            token_hash=hash_refresh_token(new_refresh_token),
            expires_at=get_refresh_token_expiry(),
            user_agent=user_agent,
            ip_address=ip_address,
        )
        db.add(next_token)
        db.commit()
        return {
            "access_token": create_access_token({"sub": str(user.id)}),
            "refresh_token": new_refresh_token,
        }

    now = datetime.utcnow()

    if token_record.revoked_at is not None:
        # Reuse of a revoked token indicates possible theft; revoke all active sessions.
        (
            db.query(models.RefreshToken)
            .filter(
                models.RefreshToken.user_id == token_record.user_id,
                models.RefreshToken.revoked_at.is_(None),
            )
            .update({models.RefreshToken.revoked_at: now}, synchronize_session=False)
        )
        db.commit()
        return None

    if token_record.expires_at <= now:
        token_record.revoked_at = now
        db.commit()
        return None

    user = db.query(models.User).filter(models.User.id == token_record.user_id).first()
    if user is None:
        token_record.revoked_at = now
        db.commit()
        return None

    new_refresh_token = create_refresh_token({"sub": str(user.id)})
    next_token = models.RefreshToken(
        user_id=user.id,
        token_hash=hash_refresh_token(new_refresh_token),
        expires_at=get_refresh_token_expiry(),
        user_agent=user_agent,
        ip_address=ip_address,
    )
    db.add(next_token)
    db.flush()

    token_record.last_used_at = now
    token_record.revoked_at = now
    token_record.replaced_by_token_id = next_token.id
    db.commit()

    return {
        "access_token": create_access_token({"sub": str(user.id)}),
        "refresh_token": new_refresh_token,
    }


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

