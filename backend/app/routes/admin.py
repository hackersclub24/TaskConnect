from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from .. import models, schemas
from ..auth import get_current_user
from ..database import get_db
from ..services.chat import delete_task_chat_history


router = APIRouter()


def _require_admin(current_user: models.User) -> None:
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )


@router.get("/tasks", response_model=list[schemas.AdminTaskOut])
def list_tasks_for_admin(
    q: str | None = Query(None, description="Search by task title, slug, or owner email"),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    _require_admin(current_user)

    tasks_query = db.query(models.Task)

    if q:
        needle = q.strip().lower()
        tasks_query = tasks_query.join(models.User, models.User.id == models.Task.owner_id).filter(
            models.Task.title.ilike(f"%{needle}%")
            | models.Task.slug.ilike(f"%{needle}%")
            | models.User.email.ilike(f"%{needle}%")
        )

    tasks = tasks_query.order_by(models.Task.created_at.desc()).limit(limit).all()

    response = []
    for task in tasks:
        message_count = db.query(models.Message).filter(models.Message.task_id == task.id).count()
        attachment_count = (
            db.query(models.Message)
            .filter(models.Message.task_id == task.id, models.Message.file_url.isnot(None))
            .count()
        )

        response.append(
            schemas.AdminTaskOut(
                id=task.id,
                slug=task.slug,
                title=task.title,
                status=task.status,
                owner_id=task.owner_id,
                owner_email=task.owner.email if task.owner else None,
                assigned_to=task.assigned_to,
                message_count=message_count,
                attachment_count=attachment_count,
                created_at=task.created_at,
            )
        )

    return response


@router.delete("/tasks/{task_ref}", status_code=status.HTTP_204_NO_CONTENT)
def admin_delete_task(
    task_ref: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    _require_admin(current_user)

    task = None
    if task_ref.isdigit():
        task = db.query(models.Task).filter(models.Task.id == int(task_ref)).first()
    if task is None:
        task = db.query(models.Task).filter(models.Task.slug == task_ref).first()

    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    task_id = task.id

    # Ensure DB messages and uploaded files (including Cloudinary) are cleaned.
    delete_task_chat_history(db, task_id)

    db.query(models.TaskApplication).filter(models.TaskApplication.task_id == task_id).delete()
    db.query(models.Review).filter(models.Review.task_id == task_id).delete()

    db.delete(task)
    db.commit()
    return None
