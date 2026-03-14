from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from ..auth import get_current_user_optional
from sqlalchemy.orm import Session
from sqlalchemy import desc

from .. import models, schemas
from ..database import get_db

router = APIRouter()

@router.get("/", response_model=List[schemas.LeaderboardUserOut])
def get_leaderboard(
    db: Session = Depends(get_db),
    timeframe: Optional[str] = Query("global", description="Timeframe: global or weekly"),
    filter: Optional[str] = Query("all", description="Filter: all or college"),
    current_user: Optional[models.User] = Depends(get_current_user_optional)
):
    query = db.query(models.User)
    
    if filter == "college":
        if not current_user:
            raise HTTPException(status_code=401, detail="Must be logged in to view college leaderboard")
        if not current_user.college_name:
            raise HTTPException(status_code=400, detail="Your profile has no college specified")
        query = query.filter(models.User.college_name == current_user.college_name)
        
    # For now, implementing global leaderboard based on total score
    users = query.order_by(desc(models.User.leaderboard_score)).limit(50).all()
    
    result = []
    for rank, user in enumerate(users, start=1):
        result.append(
            schemas.LeaderboardUserOut(
                id=user.id,
                name=user.name or user.email.split('@')[0],
                email=user.email,
                rank=rank,
                tasks_completed=user.tasks_completed,
                average_rating=float(user.average_rating),
                leaderboard_score=float(user.leaderboard_score),
            )
        )
    return result
