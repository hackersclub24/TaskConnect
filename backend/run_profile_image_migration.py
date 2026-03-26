import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Load .env
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

DATABASE_URL = os.getenv('DATABASE_URL')

engine = create_engine(DATABASE_URL)

migration_sql = """
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image_url VARCHAR(500) DEFAULT NULL;

SELECT column_name, data_type FROM information_schema.columns
WHERE table_name='users' AND column_name='profile_image_url';
"""

try:
    with engine.connect() as conn:
        conn.execute(text(migration_sql))
        conn.commit()
    print("✓ Migration successful!")
    print("✓ profile_image_url column added to users table")
except Exception as e:
    print(f"✗ Migration failed: {e}")
