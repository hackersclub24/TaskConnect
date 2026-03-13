from app.database import SessionLocal
from app.models import User
from app.services.leaderboard import update_user_score

def verify():
    db = SessionLocal()
    users = db.query(User).all()

    if not users:
        print("No users in db to test.")
        return

    # Trigger score update on all users
    for u in users:
        # Give someone a fake score just to see if calculation works
        if u.id == users[0].id:
            u.tasks_completed = 5
            u.tasks_completed_on_time = 4
            u.rating_sum = 23
            u.total_ratings = 5
        update_user_score(db, u)

    leaderboard = db.query(User).order_by(User.leaderboard_score.desc()).limit(5).all()
    print("--- Leaderboard Output ---")
    for rank, u in enumerate(leaderboard, 1):
        print(f"{rank}. {u.email} - Score: {u.leaderboard_score} (Tasks: {u.tasks_completed}, Avg Rating: {u.average_rating}, On-Time: {u.on_time_completion_rate}%)")

if __name__ == "__main__":
    verify()
