from app.database import engine
from sqlalchemy import text

def run_migration():
    with engine.connect() as conn:
        print("Checking for missing columns...")
        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN name VARCHAR;"))
            print("Added 'name' column successfully.")
        except Exception as e:
            print(f"Name column might already exist: {e}")
            
        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN bio TEXT;"))
            print("Added 'bio' column successfully.")
        except Exception as e:
            print(f"Bio column might already exist: {e}")
            
        conn.commit()

if __name__ == "__main__":
    run_migration()
