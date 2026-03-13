import os
import sys

# Add backend directory to sys.path so we can import app module
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import engine
from sqlalchemy import text

def add_is_urgent_column():
    with engine.connect() as conn:
        print("Checking for missing column in tasks...")
        try:
            conn.execute(text("ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_urgent BOOLEAN DEFAULT FALSE;"))
            conn.commit()
            print("Added 'is_urgent' column to tasks successfully.")
        except Exception as e:
            print(f"Error adding column: {e}")

if __name__ == "__main__":
    add_is_urgent_column()
