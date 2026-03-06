"""Contact and feedback routes: submit feedback, report issues, contact platform."""
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from .. import models, schemas
from ..auth import get_current_user_optional
from ..database import get_db


router = APIRouter()

VALID_FEEDBACK_TYPES = ("feedback", "report", "contact")


@router.post("/", response_model=schemas.ContactFeedbackOut, status_code=status.HTTP_201_CREATED)
def submit_contact_feedback(
    feedback_in: schemas.ContactFeedbackCreate,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_current_user_optional),
):
    """Submit feedback, report an issue, or contact the platform team."""
    if feedback_in.type not in VALID_FEEDBACK_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Type must be one of: {', '.join(VALID_FEEDBACK_TYPES)}",
        )
    entry = models.ContactFeedback(
        user_id=current_user.id if current_user else None,
        type=feedback_in.type,
        subject=feedback_in.subject,
        message=feedback_in.message,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


@router.get("/", response_model=List[schemas.ContactFeedbackOut])
def list_contact_feedback(
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_current_user_optional),
    limit: int = Query(50, ge=1, le=100),
):
    """List feedback submissions (for admin - optionally restrict to current user's submissions)."""
    # For hackathon demo: if logged in, show only user's submissions; else empty
    if not current_user:
        return []
    entries = (
        db.query(models.ContactFeedback)
        .filter(models.ContactFeedback.user_id == current_user.id)
        .order_by(models.ContactFeedback.created_at.desc())
        .limit(limit)
        .all()
    )
    return entries
