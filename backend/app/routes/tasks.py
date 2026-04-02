from typing import List, Optional

from datetime import datetime, timedelta
import re

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload

from .. import models, schemas
from ..auth import get_current_user, get_current_user_optional
from ..database import get_db
from ..services.matching import match_percentage
from ..services.proposals import ProposalContext, generate_proposal
from ..services.chat import delete_task_chat_history


router = APIRouter()


def _slugify(value: str) -> str:
    value = (value or "").strip().lower()
    value = re.sub(r"[^a-z0-9\s-]", "", value)
    value = re.sub(r"[\s_-]+", "-", value)
    return value.strip("-") or "task"


def _build_unique_task_slug(db: Session, title: str, exclude_task_id: Optional[int] = None) -> str:
    base_slug = _slugify(title)
    slug = base_slug
    suffix = 2

    while True:
        q = db.query(models.Task).filter(models.Task.slug == slug)
        if exclude_task_id is not None:
            q = q.filter(models.Task.id != exclude_task_id)
        if not q.first():
            return slug
        slug = f"{base_slug}-{suffix}"
        suffix += 1


def _get_task_by_ref(db: Session, task_ref: str, with_owner: bool = False) -> Optional[models.Task]:
    query = db.query(models.Task)
    if with_owner:
        query = query.options(joinedload(models.Task.owner))

    task = None
    if task_ref.isdigit():
        task = query.filter(models.Task.id == int(task_ref)).first()
    if task is None:
        task = query.filter(models.Task.slug == task_ref).first()
    return task


def _serialize_application(app: models.TaskApplication, db: Session) -> schemas.TaskApplicationOut:
    applicant = db.query(models.User).filter(models.User.id == app.applicant_id).first()
    return schemas.TaskApplicationOut(
        id=app.id,
        task_id=app.task_id,
        applicant_id=app.applicant_id,
        applicant_name=applicant.name if applicant and applicant.name else None,
        applicant_email=applicant.email if applicant else None,
        status=app.status.value if hasattr(app.status, "value") else str(app.status),
        created_at=app.created_at,
    )


@router.get("/", response_model=List[schemas.TaskOut])
def list_tasks(
    db: Session = Depends(get_db),
    category: Optional[str] = Query(None, description="Filter by category: paid, learning, collaboration"),
    same_college_only: Optional[bool] = Query(None, description="Show only tasks from my college"),
    current_user: Optional[models.User] = Depends(get_current_user_optional),
):
    """
    List all tasks with optional category and college filters.

    Premium users see tasks posted up to 5 minutes ago.
    Non-premium users see tasks posted at least 5 minutes ago.
    """
    q = db.query(models.Task).options(joinedload(models.Task.owner)).order_by(models.Task.created_at.desc())
    if category and category in ("paid", "learning", "collaboration"):
        q = q.filter(models.Task.category == category)
    tasks = q.all()

    # Filter by early access: premium users see newer tasks
    now = datetime.utcnow()
    cutoff_time = now - timedelta(minutes=5)

    # Mark tasks that are premium early access
    for task in tasks:
        task.premium_early_access = task.created_at >= cutoff_time

    if current_user and current_user.is_premium:
        # Premium: show all tasks including early access
        pass
    else:
        # Non-premium: only show tasks posted at least 5 minutes ago
        tasks = [t for t in tasks if t.created_at < cutoff_time]

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


@router.get("/{task_ref}/contacts", response_model=schemas.TaskContacts)
def get_task_contacts(
    task_ref: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    task = _get_task_by_ref(db, task_ref)
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    owner = task.owner
    owner_phone = owner.phone if owner and owner.phone else None

    acceptor_phone = None
    if current_user.id == task.owner_id and task.assigned_user and task.assigned_user.phone:
        acceptor_phone = task.assigned_user.phone

    return schemas.TaskContacts(owner_phone=owner_phone, acceptor_phone=acceptor_phone)


@router.get("/{task_ref}/messages", response_model=List[schemas.MessageOut])
def get_task_messages(
    task_ref: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Get chat messages for a task. Only owner or assigned user can access."""
    task = _get_task_by_ref(db, task_ref)
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    task_id = task.id
    if current_user.id != task.owner_id and current_user.id != task.assigned_to:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the task creator and assigned user can access this chat",
        )

    unseen_messages = (
        db.query(models.Message)
        .filter(
            models.Message.task_id == task_id,
            models.Message.sender_id != current_user.id,
            models.Message.seen_at.is_(None),
        )
        .all()
    )
    if unseen_messages:
        seen_time = datetime.utcnow()
        for unseen in unseen_messages:
            unseen.seen_at = seen_time
        db.commit()

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
                sender_name=sender.name or sender.email if sender else None,
                message=m.message,
                file_url=m.file_url,
                file_name=m.file_name,
                seen_at=m.seen_at,
                timestamp=m.timestamp,
            )
        )
    return result


@router.get("/{task_ref}", response_model=schemas.TaskOut)
def get_task(task_ref: str, db: Session = Depends(get_db)):
    """Get single task by ID. Must be after more specific routes like /messages."""
    task = _get_task_by_ref(db, task_ref, with_owner=True)
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    return task


@router.get(
    "/{task_ref}/recommended-freelancers",
    response_model=list[schemas.RecommendedFreelancerOut],
)
def recommended_freelancers(
    task_ref: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    task = _get_task_by_ref(db, task_ref)
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


@router.post("/{task_ref}/proposal", response_model=schemas.ProposalOut)
def generate_task_proposal(
    task_ref: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    task = _get_task_by_ref(db, task_ref)
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
        slug=_build_unique_task_slug(db, task_in.title),
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


@router.patch("/{task_ref}", response_model=schemas.TaskOut)
def update_task(
    task_ref: str,
    task_in: schemas.TaskUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    task = _get_task_by_ref(db, task_ref)
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

    if "title" in update_data and update_data["title"]:
        task.slug = _build_unique_task_slug(db, update_data["title"], exclude_task_id=task.id)

    db.commit()
    db.refresh(task)
    return task


@router.patch("/{task_ref}/status", response_model=schemas.TaskOut)
def update_task_status(
    task_ref: str,
    status_in: schemas.TaskUpdateStatus,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    task = _get_task_by_ref(db, task_ref)
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    task_id = task.id
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
        
        # Delete chat history and PDFs when task is completed
        delete_task_chat_history(db, task_id)

    task.status = status_in.status
    db.commit()
    db.refresh(task)
    return task


@router.patch("/{task_ref}/negotiate-reward", response_model=schemas.TaskOut)
def negotiate_task_reward(
    task_ref: str,
    reward_in: schemas.TaskRewardNegotiationIn,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    task = _get_task_by_ref(db, task_ref)
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    if task.status != models.TaskStatus.accepted:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reward can be negotiated only after a task doer is accepted",
        )

    is_owner_or_assignee = current_user.id in {task.owner_id, task.assigned_to}
    if not is_owner_or_assignee:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the task owner or accepted doer can negotiate reward",
        )

    if reward_in.reward < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reward cannot be negative",
        )

    task.reward = reward_in.reward
    db.commit()
    db.refresh(task)
    return task


@router.post("/{task_ref}/apply", response_model=schemas.TaskApplicationOut)
def apply_for_task(
    task_ref: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    task = _get_task_by_ref(db, task_ref)
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    task_id = task.id
    if task.status != models.TaskStatus.open:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Task is not open for applications",
        )
    if task.owner_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot apply to your own task",
        )

    existing = (
        db.query(models.TaskApplication)
        .filter(
            models.TaskApplication.task_id == task_id,
            models.TaskApplication.applicant_id == current_user.id,
            models.TaskApplication.status.in_(
                [models.TaskApplicationStatus.pending, models.TaskApplicationStatus.approved]
            ),
        )
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already applied for this task",
        )

    app = models.TaskApplication(
        task_id=task_id,
        applicant_id=current_user.id,
        status=models.TaskApplicationStatus.pending,
    )
    db.add(app)
    db.commit()
    db.refresh(app)
    return _serialize_application(app, db)


@router.post("/{task_ref}/accept", response_model=schemas.TaskApplicationOut)
def accept_task_legacy_alias(
    task_ref: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    # Backward-compatible alias for old frontend action name.
    return apply_for_task(task_ref, db, current_user)


@router.get("/{task_ref}/applications", response_model=list[schemas.TaskApplicationOut])
def list_task_applications(
    task_ref: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    task = _get_task_by_ref(db, task_ref)
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    task_id = task.id

    query = db.query(models.TaskApplication).filter(models.TaskApplication.task_id == task_id)
    if task.owner_id != current_user.id:
        query = query.filter(models.TaskApplication.applicant_id == current_user.id)

    applications = query.order_by(models.TaskApplication.created_at.desc()).all()
    return [_serialize_application(app, db) for app in applications]


@router.delete("/{task_ref}/applications/{application_id}", status_code=status.HTTP_204_NO_CONTENT)
def withdraw_task_application(
    task_ref: str,
    application_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    task = _get_task_by_ref(db, task_ref)
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    task_id = task.id

    application = (
        db.query(models.TaskApplication)
        .filter(
            models.TaskApplication.id == application_id,
            models.TaskApplication.task_id == task_id,
        )
        .first()
    )
    if not application:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")

    if application.applicant_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only withdraw your own application",
        )

    if application.status != models.TaskApplicationStatus.pending:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only pending applications can be withdrawn",
        )

    db.delete(application)
    db.commit()
    return None


@router.post("/{task_ref}/applications/{application_id}/approve", response_model=schemas.TaskOut)
def approve_task_application(
    task_ref: str,
    application_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    task = _get_task_by_ref(db, task_ref)
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    task_id = task.id
    if task.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the task owner can approve applications",
        )
    if task.status != models.TaskStatus.open:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Task is not open for approval",
        )

    application = (
        db.query(models.TaskApplication)
        .filter(
            models.TaskApplication.id == application_id,
            models.TaskApplication.task_id == task_id,
        )
        .first()
    )
    if not application:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")
    if application.status != models.TaskApplicationStatus.pending:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only pending applications can be approved",
        )

    application.status = models.TaskApplicationStatus.approved
    task.status = models.TaskStatus.accepted
    task.assigned_to = application.applicant_id

    other_pending = (
        db.query(models.TaskApplication)
        .filter(
            models.TaskApplication.task_id == task_id,
            models.TaskApplication.id != application_id,
            models.TaskApplication.status == models.TaskApplicationStatus.pending,
        )
        .all()
    )
    for app in other_pending:
        app.status = models.TaskApplicationStatus.rejected

    db.commit()
    db.refresh(task)
    return task


@router.post("/{task_ref}/applications/{application_id}/reject", response_model=schemas.TaskApplicationOut)
def reject_task_application(
    task_ref: str,
    application_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    task = _get_task_by_ref(db, task_ref)
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    task_id = task.id
    if task.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the task owner can reject applications",
        )

    application = (
        db.query(models.TaskApplication)
        .filter(
            models.TaskApplication.id == application_id,
            models.TaskApplication.task_id == task_id,
        )
        .first()
    )
    if not application:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")

    # If an already-approved assignee is rejected, unassign and reopen the task.
    if (
        task.status == models.TaskStatus.accepted
        and application.status == models.TaskApplicationStatus.approved
        and task.assigned_to == application.applicant_id
    ):
        # Delete chat history and attachments between owner and assignee on rejection.
        delete_task_chat_history(db, task_id)
        task.status = models.TaskStatus.open
        task.assigned_to = None

    application.status = models.TaskApplicationStatus.rejected
    db.commit()
    db.refresh(application)
    return _serialize_application(application, db)


@router.post("/{task_ref}/cancel-acceptance", response_model=schemas.TaskOut)
def cancel_task_acceptance(
    task_ref: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    task = _get_task_by_ref(db, task_ref)
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    task_id = task.id
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
    
    # Delete chat history and PDFs when acceptance is cancelled
    delete_task_chat_history(db, task_id)
    
    previous_assignee_id = task.assigned_to

    task.status = models.TaskStatus.open
    task.assigned_to = None

    if previous_assignee_id:
        approved_application = (
            db.query(models.TaskApplication)
            .filter(
                models.TaskApplication.task_id == task_id,
                models.TaskApplication.applicant_id == previous_assignee_id,
                models.TaskApplication.status == models.TaskApplicationStatus.approved,
            )
            .first()
        )
        if approved_application:
            approved_application.status = models.TaskApplicationStatus.rejected

    db.commit()
    db.refresh(task)
    return task


@router.delete("/{task_ref}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(
    task_ref: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    task = _get_task_by_ref(db, task_ref)
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    task_id = task.id
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

    # Delete chat history and PDFs first
    delete_task_chat_history(db, task_id)
    
    # Remove dependent records to avoid FK constraint failures.
    db.query(models.TaskApplication).filter(models.TaskApplication.task_id == task_id).delete()
    db.query(models.Review).filter(models.Review.task_id == task_id).delete()

    db.delete(task)
    db.commit()
    return None

