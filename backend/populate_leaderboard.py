from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import SessionLocal
from app.models import User, Task, Review, TaskStatus
from app.services.leaderboard import update_user_score

def populate():
    db = SessionLocal()
    users = db.query(User).all()

    for user in users:
        # Reset counts
        user.tasks_completed = 0
        user.tasks_completed_on_time = 0
        user.rating_sum = 0
        user.total_ratings = 0
        
        # 1. Calculate tasks completed
        completed_tasks = db.query(Task).filter(
            Task.assigned_to == user.id,
            Task.status == "completed"
        ).all()
        
        user.tasks_completed = len(completed_tasks)
        # For legacy data without completion timestamps, we assume all completed ones were on time
        user.tasks_completed_on_time = len(completed_tasks)
        
        # 2. Calculate reviews
        reviews = db.query(Review).filter(
            Review.reviewee_id == user.id
        ).all()
        
        user.total_ratings = len(reviews)
        user.rating_sum = sum(r.rating for r in reviews)
        
        # 3. Update score
        update_user_score(db, user)
        
    print(f"Leaderboard populated for {len(users)} users.")

if __name__ == "__main__":
    populate()
