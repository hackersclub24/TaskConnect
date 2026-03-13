from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from .. import models, schemas
from ..database import get_db

router = APIRouter()

@router.get("/", response_model=List[schemas.LeaderboardUserOut])
def get_leaderboard(
    db: Session = Depends(get_db),
    timeframe: Optional[str] = Query("global", description="Timeframe: global or weekly")
):
    # For now, implementing global leaderboard based on total score
    users = db.query(models.User).order_by(desc(models.User.leaderboard_score)).limit(50).all()
    
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
