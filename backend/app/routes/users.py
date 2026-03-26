from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile
from sqlalchemy.orm import Session, joinedload
import requests
import os
import shutil
from pathlib import Path
from datetime import datetime

from .. import models, schemas
from ..auth import get_current_user
from ..database import get_db
from ..services.matching import match_percentage


router = APIRouter()


@router.patch("/me", response_model=schemas.UserOut)
def update_current_user(
    update_data: schemas.UserUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    update_dict = update_data.model_dump(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(current_user, key, value)

    db.commit()
    db.refresh(current_user)
    return current_user


@router.post("/me/upload-profile-image", response_model=schemas.UserOut)
def upload_profile_image(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Upload profile image - stores locally as fallback"""

    # Validate file size (max 5MB)
    max_size = 5 * 1024 * 1024  # 5MB
    content = file.file.read()
    if len(content) > max_size:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File too large (max 5MB)"
        )

    # Validate file type
    allowed_types = {"image/jpeg", "image/png", "image/webp", "image/gif"}
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Only JPEG, PNG, WebP, and GIF allowed"
        )

    try:
        # Try Cloudinary first
        cloudinary_url = "https://api.cloudinary.com/v1_1/{}/image/upload".format(
            os.getenv("CLOUDINARY_CLOUD_NAME")
        )

        files_data = {
            "file": (file.filename, content, file.content_type)
        }

        data = {
            "upload_preset": os.getenv("CLOUDINARY_UPLOAD_PRESET"),
            "folder": "profile_images"
        }

        try:
            response = requests.post(cloudinary_url, files=files_data, data=data, timeout=10)
            response.raise_for_status()
            result = response.json()
            image_url = result.get("secure_url")

            if image_url:
                # Cloudinary succeeded
                current_user.profile_image_url = image_url
                db.commit()
                db.refresh(current_user)
                return current_user

        except Exception as cloudinary_error:
            print(f"Cloudinary failed, using local storage: {str(cloudinary_error)}")

        # Fallback: Store locally
        uploads_dir = Path(__file__).parent.parent / "uploads" / "profile_images"
        uploads_dir.mkdir(parents=True, exist_ok=True)

        # Generate unique filename
        file_ext = Path(file.filename).suffix
        filename = f"user_{current_user.id}_{datetime.now().timestamp()}{file_ext}"
        file_path = uploads_dir / filename

        # Save file
        with open(file_path, "wb") as f:
            f.write(content)

        # Create URL (this assumes you'll serve static files)
        image_url = f"/api/uploads/profile_images/{filename}"

        # Save URL to database
        current_user.profile_image_url = image_url
        db.commit()
        db.refresh(current_user)

        return current_user

    except Exception as e:
        print(f"Upload error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Upload failed: {str(e)}"
        )


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


@router.get("/{user_id}/stats", response_model=schemas.UserStatsOut)
def get_user_stats(user_id: int, db: Session = Depends(get_db)):
    """Get user statistics: total posted, accepted, completed AND full task lists."""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    posted_tasks = db.query(models.Task).options(joinedload(models.Task.owner)).filter(models.Task.owner_id == user_id).all()
    accepted_tasks = db.query(models.Task).options(joinedload(models.Task.owner)).filter(models.Task.assigned_to == user_id).all()

    total_posted = len(posted_tasks)
    total_accepted = len(accepted_tasks)
    
    # Calculate completed (can be either tasks they posted that are completed, or accepted tasks that are completed)
    total_completed = sum(1 for t in posted_tasks if t.status == models.TaskStatus.completed) + \
                      sum(1 for t in accepted_tasks if t.status == models.TaskStatus.completed)

    return {
        "total_posted": total_posted,
        "total_accepted": total_accepted,
        "total_completed": total_completed,
        "posted_tasks": posted_tasks,
        "accepted_tasks": accepted_tasks
    }

