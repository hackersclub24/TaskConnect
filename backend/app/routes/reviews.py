"""Review routes: star ratings and text feedback between users."""
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from .. import models, schemas
from ..auth import get_current_user
from ..database import get_db


router = APIRouter()


@router.post("/", response_model=schemas.ReviewOut, status_code=status.HTTP_201_CREATED)
def create_review(
    review_in: schemas.ReviewCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Leave a review for another user (e.g. after completing a task)."""
    if review_in.rating < 1 or review_in.rating > 5:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Rating must be between 1 and 5",
        )
    if review_in.reviewee_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot review yourself",
        )
    reviewee = db.query(models.User).filter(models.User.id == review_in.reviewee_id).first()
    if not reviewee:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    review = models.Review(
        reviewer_id=current_user.id,
        reviewee_id=review_in.reviewee_id,
        task_id=review_in.task_id,
        rating=review_in.rating,
        text=review_in.text,
    )
    db.add(review)
    db.commit()
    db.refresh(review)
    return review


@router.get("/user/{user_id}", response_model=List[schemas.ReviewWithReviewer])
def get_user_reviews(
    user_id: int,
    db: Session = Depends(get_db),
    limit: int = Query(20, ge=1, le=50),
):
    """Get all reviews received by a user (for profile display)."""
    reviews = (
        db.query(models.Review)
        .options(
            # Load reviewer for email display
        )
        .filter(models.Review.reviewee_id == user_id)
        .order_by(models.Review.created_at.desc())
        .limit(limit)
        .all()
    )
    result = []
    for r in reviews:
        reviewer = db.query(models.User).filter(models.User.id == r.reviewer_id).first()
        out = schemas.ReviewWithReviewer(
            id=r.id,
            reviewer_id=r.reviewer_id,
            reviewee_id=r.reviewee_id,
            task_id=r.task_id,
            rating=r.rating,
            text=r.text,
            created_at=r.created_at,
            reviewer_email=reviewer.email if reviewer else None,
        )
        result.append(out)
    return result
