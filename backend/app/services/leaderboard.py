from sqlalchemy.orm import Session
from .. import models

def update_user_score(db: Session, user: models.User):
    """
    Recalculates and updates the user's leaderboard score based on raw metrics.
    Formula: score = (tasks_completed * 10) + (average_rating * 20) + (on_time_completion_rate * 30)
    """
    if user.total_ratings > 0:
        user.average_rating = round(user.rating_sum / user.total_ratings, 2)
    else:
        user.average_rating = 0.0

    if user.tasks_completed > 0:
        user.on_time_completion_rate = round((user.tasks_completed_on_time / user.tasks_completed) * 100, 2)
    else:
        user.on_time_completion_rate = 0.0

    # Calculate score
    score = (user.tasks_completed * 10) + (float(user.average_rating) * 20) + (float(user.on_time_completion_rate) * 30)
    user.leaderboard_score = round(score, 2)
    
    db.commit()
    db.refresh(user)
    return user
