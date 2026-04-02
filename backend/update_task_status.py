#!/usr/bin/env python3
"""
Direct database update to change task status from 'available' to 'open'
Handles PostgreSQL enum type changes
"""
import os
from pathlib import Path
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Load environment variables from .env
env_path = Path(__file__).parent / ".env"
load_dotenv(env_path)

# Get database URL from environment
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    print("✗ DATABASE_URL not found in environment or .env file")
    exit(1)

try:
    engine = create_engine(DATABASE_URL)
    
    # Step 1: Add 'open' to the enum type in a separate transaction if missing
    print("Updating task statuses from 'available' to 'open'...")
    print("1. Ensuring 'open' exists in taskstatus enum...")
    
    with engine.connect() as connection:
        try:
            connection.execute(text("ALTER TYPE taskstatus ADD VALUE 'open' BEFORE 'accepted'"))
            connection.commit()
            print("   ✓ Added 'open' value to enum")
        except Exception as e:
            if "already exists" in str(e).lower():
                print("   ✓ 'open' already exists in enum")
                connection.commit()
            else:
                raise
    
    # Step 2: Update all 'available' records to 'open' in a new connection/transaction
    print("2. Updating 'available' status records...")
    
    with engine.connect() as connection:
        result = connection.execute(text("UPDATE tasks SET status = 'open' WHERE status = 'available'"))
        connection.commit()
        print(f"   ✓ Updated {result.rowcount} task(s)")
        
    print("✓ Database migration completed successfully!")

except Exception as e:
    print(f"✗ Error updating database: {e}")
    exit(1)
