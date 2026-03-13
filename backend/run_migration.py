from app.database import engine
from sqlalchemy import text

def run_migration():
    with engine.connect() as conn:
        print("Checking for missing columns...")
        columns_to_add = [
            "tasks_completed INTEGER DEFAULT 0 NOT NULL",
            "tasks_completed_on_time INTEGER DEFAULT 0 NOT NULL",
            "rating_sum INTEGER DEFAULT 0 NOT NULL",
            "total_ratings INTEGER DEFAULT 0 NOT NULL",
            "average_rating NUMERIC(5,2) DEFAULT 0.0 NOT NULL",
            "on_time_completion_rate NUMERIC(5,2) DEFAULT 0.0 NOT NULL",
            "leaderboard_score NUMERIC(10,2) DEFAULT 0.0 NOT NULL"
        ]
        
        for col_def in columns_to_add:
            col_name = col_def.split()[0]
            try:
                conn.execute(text(f"ALTER TABLE users ADD COLUMN {col_def};"))
                print(f"Added '{col_name}' column successfully.")
            except Exception as e:
                pass
                
        try:
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_users_leaderboard_score ON users(leaderboard_score);"))
            print("Added index on leaderboard_score.")
        except Exception as e:
            pass
            
        conn.commit()

if __name__ == "__main__":
    run_migration()
