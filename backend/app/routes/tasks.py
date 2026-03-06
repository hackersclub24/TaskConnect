from typing import List
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import models, schemas
from ..auth import get_current_user
from ..database import get_db
from ..services.matching import match_percentage
from ..services.proposals import ProposalContext, generate_proposal


router = APIRouter()


@router.get("/", response_model=List[schemas.TaskOut])
def list_tasks(db: Session = Depends(get_db)):
    tasks = db.query(models.Task).order_by(models.Task.created_at.desc()).all()
    return tasks


@router.get("/mine", response_model=List[schemas.TaskOut])
def list_my_tasks(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    tasks = (
        db.query(models.Task)
        .filter(models.Task.owner_id == current_user.id)
        .order_by(models.Task.created_at.desc())
        .all()
    )
    return tasks


@router.get("/{task_id}", response_model=schemas.TaskOut)
def get_task(task_id: int, db: Session = Depends(get_db)):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    return task


@router.get("/{task_id}/contacts", response_model=schemas.TaskContacts)
def get_task_contacts(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    owner = task.owner
    owner_phone = owner.phone if owner and owner.phone else None

    acceptor_phone = None
    if current_user.id == task.owner_id and task.assigned_user and task.assigned_user.phone:
        acceptor_phone = task.assigned_user.phone

    return schemas.TaskContacts(owner_phone=owner_phone, acceptor_phone=acceptor_phone)


@router.get(
    "/{task_id}/recommended-freelancers",
    response_model=list[schemas.RecommendedFreelancerOut],
)
def recommended_freelancers(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    task_text = f"{task.title}\n{task.description}"

    # For demo: treat all users except task owner as potential freelancers.
    users = db.query(models.User).filter(models.User.id != task.owner_id).all()
    scored: list[tuple[int, models.User]] = []
    for user in users:
        skills = user.skills or ""
        pct = match_percentage(task_text, skills)
        scored.append((pct, user))

    top = sorted(scored, key=lambda x: x[0], reverse=True)[:5]
    return [
        {
            "freelancer": {"id": u.id, "email": u.email, "skills": u.skills},
            "match_percentage": pct,
        }
        for pct, u in top
    ]


@router.post("/{task_id}/proposal", response_model=schemas.ProposalOut)
def generate_task_proposal(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    ctx = ProposalContext(
        task_title=task.title,
        task_description=task.description,
        freelancer_skills=current_user.skills or "",
    )
    return {"proposal": generate_proposal(ctx)}


@router.post("/", response_model=schemas.TaskOut, status_code=status.HTTP_201_CREATED)
def create_task(
    task_in: schemas.TaskCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    deadline = task_in.deadline
    if isinstance(deadline, str):
        try:
            deadline = datetime.fromisoformat(deadline)
        except ValueError:
            deadline = None
    task = models.Task(
        title=task_in.title,
        description=task_in.description,
        deadline=deadline,
        reward=task_in.reward,
        owner_id=current_user.id,
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@router.patch("/{task_id}", response_model=schemas.TaskOut)
def update_task(
    task_id: int,
    task_in: schemas.TaskUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    if task.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not allowed to update this task",
        )

    update_data = task_in.dict(exclude_unset=True)

    deadline = update_data.get("deadline")
    if isinstance(deadline, str):
        try:
            deadline = datetime.fromisoformat(deadline)
        except ValueError:
            deadline = None
        update_data["deadline"] = deadline

    for field, value in update_data.items():
        setattr(task, field, value)

    db.commit()
    db.refresh(task)
    return task


@router.patch("/{task_id}/status", response_model=schemas.TaskOut)
def update_task_status(
    task_id: int,
    status_in: schemas.TaskUpdateStatus,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    if task.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not allowed to change the status of this task",
        )

    task.status = status_in.status
    db.commit()
    db.refresh(task)
    return task


@router.post("/{task_id}/accept", response_model=schemas.TaskOut)
def accept_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    if task.status != models.TaskStatus.open:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Task is not open for acceptance",
        )
    task.status = models.TaskStatus.accepted
    task.assigned_to = current_user.id
    db.commit()
    db.refresh(task)
    return task


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    if task.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not allowed to delete this task",
        )
    if task.status == models.TaskStatus.accepted:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot delete a task that has already been accepted",
        )

    db.delete(task)
    db.commit()
    return None

