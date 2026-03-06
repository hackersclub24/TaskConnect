from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from .. import models, schemas
from ..auth import get_current_user
from ..database import get_db
from ..services.matching import match_percentage


router = APIRouter()


@router.get("/{user_id}/recommended-tasks", response_model=list[schemas.RecommendedTaskOut])
def recommended_tasks(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not allowed to view recommendations for this user",
        )

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    skills = user.skills or ""
    tasks = (
        db.query(models.Task)
        .options(joinedload(models.Task.owner))
        .filter(models.Task.status == models.TaskStatus.open)
        .order_by(models.Task.created_at.desc())
        .all()
    )

    scored: list[tuple[int, models.Task]] = []
    for task in tasks:
        task_text = f"{task.title}\n{task.description}"
        pct = match_percentage(task_text, skills)
        scored.append((pct, task))

    top = sorted(scored, key=lambda x: x[0], reverse=True)[:5]
    return [{"task": t, "match_percentage": pct} for pct, t in top]


@router.get("/{user_id}", response_model=schemas.UserOut)
def get_user(user_id: int, db: Session = Depends(get_db)):
    """Get public user profile (for viewing reviews, etc.)."""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user

