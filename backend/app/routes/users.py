from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, Query
from typing import Optional
from sqlalchemy.orm import Session, joinedload
import requests
import os
import shutil
from pathlib import Path
from datetime import datetime
from urllib.parse import urlparse

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

    # Upload to Cloudinary (required - no local fallback on Render)
    # Parse CLOUDINARY_URL to extract cloud_name
    cloudinary_url_env = os.getenv("CLOUDINARY_URL", "")
    if cloudinary_url_env.startswith("cloudinary://"):
        # Extract cloud_name from URL: cloudinary://key:secret@cloud_name
        parsed = urlparse(cloudinary_url_env)
        cloud_name = parsed.hostname
    else:
        cloud_name = os.getenv("CLOUDINARY_CLOUD_NAME")
    
    if not cloud_name:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Cloudinary cloud name not configured"
        )
    
    cloudinary_upload_url = f"https://api.cloudinary.com/v1_1/{cloud_name}/image/upload"

    files_data = {
        "file": (file.filename, content, file.content_type)
    }

    data = {
        "upload_preset": os.getenv("CLOUDINARY_UPLOAD_PRESET")
    }

    try:
        response = requests.post(cloudinary_upload_url, files=files_data, data=data, timeout=10)
        
        # Log the response for debugging
        print(f"Cloudinary response status: {response.status_code}")
        print(f"Cloudinary request data: {data}")
        
        if not response.ok:
            try:
                error_details = response.json()
                print(f"Cloudinary error response: {error_details}")
            except:
                print(f"Cloudinary error text: {response.text}")
        
        response.raise_for_status()
        result = response.json()
        image_url = result.get("secure_url")

        if not image_url:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Cloudinary upload succeeded but no URL returned"
            )

        # Save Cloudinary URL to database
        current_user.profile_image_url = image_url
        db.commit()
        db.refresh(current_user)

        return current_user

    except requests.exceptions.RequestException as e:
        print(f"Cloudinary upload failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Image hosting service temporarily unavailable. Please try again in a moment."
        )
    except Exception as e:
        print(f"Upload error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Upload failed: {str(e)}"
        )


@router.get("/colleges", response_model=list[str])
def list_colleges(
    q: Optional[str] = Query(None, description="Optional search text for college name"),
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
):
    """Return distinct college names for autocomplete dropdowns."""
    query = db.query(models.User.college_name).filter(
        models.User.college_name.isnot(None),
        models.User.college_name != "",
    )

    if q:
        query = query.filter(models.User.college_name.ilike(f"%{q.strip()}%"))

    rows = query.distinct().order_by(models.User.college_name.asc()).limit(limit).all()
    return [row[0] for row in rows if row and row[0]]


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

