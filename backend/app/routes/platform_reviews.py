"""
Platform reviews: what users write about the Skillstreet platform.
Public listing + authenticated users can submit their own review.
"""
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from .. import models, schemas
from ..auth import get_current_user
from ..database import get_db

router = APIRouter()


@router.get("/", response_model=List[schemas.PlatformReviewOut])
def list_platform_reviews(
    db: Session = Depends(get_db),
    limit: int = Query(50, ge=1, le=100),
):
    """Get all platform reviews (public)."""
    reviews = (
        db.query(models.PlatformReview)
        .order_by(models.PlatformReview.created_at.desc())
        .limit(limit)
        .all()
    )
    result = []
    for r in reviews:
        user = db.query(models.User).filter(models.User.id == r.user_id).first()
        result.append(
            schemas.PlatformReviewOut(
                id=r.id,
                user_id=r.user_id,
                rating=r.rating,
                review_text=r.review_text,
                created_at=r.created_at,
                user_email=user.email if user else None,
            )
        )
    return result


@router.post("/", response_model=schemas.PlatformReviewOut, status_code=status.HTTP_201_CREATED)
def create_platform_review(
    review_in: schemas.PlatformReviewCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Submit your own review about the platform."""
    if review_in.rating < 1 or review_in.rating > 5:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Rating must be between 1 and 5",
        )
    if not review_in.review_text or not review_in.review_text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Review text is required",
        )
    review = models.PlatformReview(
        user_id=current_user.id,
        rating=review_in.rating,
        review_text=review_in.review_text.strip(),
    )
    db.add(review)
    db.commit()
    db.refresh(review)
    return schemas.PlatformReviewOut(
        id=review.id,
        user_id=review.user_id,
        rating=review.rating,
        review_text=review.review_text,
        created_at=review.created_at,
        user_email=current_user.email,
    )
