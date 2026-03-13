from typing import List, Optional

from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload

from .. import models, schemas
from ..auth import get_current_user, get_current_user_optional
from ..database import get_db
from ..services.matching import match_percentage
from ..services.proposals import ProposalContext, generate_proposal


router = APIRouter()


@router.get("/", response_model=List[schemas.TaskOut])
def list_tasks(
    db: Session = Depends(get_db),
    category: Optional[str] = Query(None, description="Filter by category: paid, learning, collaboration"),
    same_college_only: Optional[bool] = Query(None, description="Show only tasks from my college"),
    current_user: Optional[models.User] = Depends(get_current_user_optional),
):
    """List all tasks with optional category and college filters."""
    q = db.query(models.Task).options(joinedload(models.Task.owner)).order_by(models.Task.created_at.desc())
    if category and category in ("paid", "learning", "collaboration"):
        q = q.filter(models.Task.category == category)
    tasks = q.all()
    # Filter: inter_college_only tasks - hide from users from other colleges
    if current_user and current_user.college_name:
        tasks = [
            t for t in tasks
            if not t.inter_college_only or (t.owner and t.owner.college_name == current_user.college_name)
        ]
    elif current_user is None:
        # Not logged in: hide inter_college_only tasks (we can't verify college)
        tasks = [t for t in tasks if not t.inter_college_only]
    # Filter: same_college_only - show only tasks from my college
    if same_college_only and current_user and current_user.college_name:
        tasks = [t for t in tasks if t.owner and t.owner.college_name == current_user.college_name]
    return tasks


@router.get("/mine", response_model=List[schemas.TaskOut])
def list_my_tasks(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    tasks = (
        db.query(models.Task)
        .options(joinedload(models.Task.owner))
        .filter(models.Task.owner_id == current_user.id)
        .order_by(models.Task.created_at.desc())
        .all()
    )
    return tasks


@router.get("/urgent", response_model=List[schemas.UrgentTaskOut])
def get_urgent_tasks(
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_current_user_optional),
):
    """Get all urgent tasks sorted by nearest deadline."""
    now = datetime.utcnow()
    
    q = db.query(models.Task).options(joinedload(models.Task.owner)).filter(
        models.Task.status == models.TaskStatus.open
    )
    tasks = q.all()
    
    # Filter inter_college_only as we do in list_tasks
    if current_user and current_user.college_name:
        tasks = [
            t for t in tasks
            if not t.inter_college_only or (t.owner and t.owner.college_name == current_user.college_name)
        ]
    elif current_user is None:
        tasks = [t for t in tasks if not t.inter_college_only]
        
    urgent_tasks_response = []
    
    for t in tasks:
        is_urgent_time = False
        hours_remaining = 24.0 # Default for priority calc if no deadline
        
        if t.deadline:
            delta = t.deadline - now
            if timedelta(0) < delta <= timedelta(hours=24):
                is_urgent_time = True
                hours_remaining = delta.total_seconds() / 3600.0
            elif delta <= timedelta(0):
                # deadline passed
                pass
        
        is_user_marked_urgent = t.is_urgent
        
        if is_urgent_time or is_user_marked_urgent:
            difficulty_level = 1
            priority_score = (hours_remaining * -1) + difficulty_level
            urgency_status = "Critical (Time)" if is_urgent_time else "High Priority (Manual)"
            
            urgent_tasks_response.append({
                "task_id": t.id,
                "title": t.title,
                "description": t.description,
                "deadline": t.deadline,
                "posted_by": t.owner.name if t.owner and t.owner.name else t.owner.email if t.owner else "Unknown",
                "required_skill": t.category,
                "urgency_status": urgency_status,
                "priority_score": priority_score,
                "raw_deadline": t.deadline
            })
            
    # Sort by nearest deadline first
    urgent_tasks_response.sort(
        key=lambda x: x["raw_deadline"] if x["raw_deadline"] else datetime.max
    )
    
    return [schemas.UrgentTaskOut(**u) for u in urgent_tasks_response]


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


@router.get("/{task_id}/messages", response_model=List[schemas.MessageOut])
def get_task_messages(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Get chat messages for a task. Only owner or assigned user can access."""
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    if current_user.id != task.owner_id and current_user.id != task.assigned_to:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the task creator and assigned user can access this chat",
        )
    messages = (
        db.query(models.Message)
        .filter(models.Message.task_id == task_id)
        .order_by(models.Message.timestamp.asc())
        .all()
    )
    # Load sender emails
    result = []
    for m in messages:
        sender = db.query(models.User).filter(models.User.id == m.sender_id).first()
        result.append(
            schemas.MessageOut(
                id=m.id,
                task_id=m.task_id,
                sender_id=m.sender_id,
                sender_email=sender.email if sender else None,
                message=m.message,
                timestamp=m.timestamp,
            )
        )
    return result


@router.get("/{task_id}", response_model=schemas.TaskOut)
def get_task(task_id: int, db: Session = Depends(get_db)):
    """Get single task by ID. Must be after more specific routes like /messages."""
    task = db.query(models.Task).options(joinedload(models.Task.owner)).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    return task


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
    category = task_in.category if task_in.category else "paid"
    inter_college_only = task_in.inter_college_only or False
    is_urgent = task_in.is_urgent or False
    task = models.Task(
        title=task_in.title,
        description=task_in.description,
        deadline=deadline,
        reward=task_in.reward,
        owner_id=current_user.id,
        category=category,
        inter_college_only=inter_college_only,
        is_urgent=is_urgent,
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

    update_data = task_in.model_dump(exclude_unset=True)

    deadline = update_data.get("deadline")
    if isinstance(deadline, str):
        try:
            deadline = datetime.fromisoformat(deadline)
        except ValueError:
            deadline = None
        update_data["deadline"] = deadline

    if "category" in update_data:
        val = update_data["category"]
        update_data["category"] = val.value if hasattr(val, "value") else str(val)

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

    # Leaderboard update logic: only trigger if changing to completed
    if status_in.status == models.TaskStatus.completed and task.status != models.TaskStatus.completed:
        if task.assigned_to:
            assigned_user = db.query(models.User).filter(models.User.id == task.assigned_to).first()
            if assigned_user:
                assigned_user.tasks_completed += 1
                if task.deadline and datetime.utcnow() <= task.deadline:
                    assigned_user.tasks_completed_on_time += 1
                
                # Import here to avoid circular dependencies
                from ..services.leaderboard import update_user_score
                update_user_score(db, assigned_user)

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


@router.post("/{task_id}/cancel-acceptance", response_model=schemas.TaskOut)
def cancel_task_acceptance(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    if task.status != models.TaskStatus.accepted:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Task is not currently accepted",
        )
    if task.owner_id != current_user.id and task.assigned_to != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not allowed to cancel this task's acceptance",
        )
    
    task.status = models.TaskStatus.open
    task.assigned_to = None
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

