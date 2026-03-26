#!/usr/bin/env python3
"""
Simple SQL Migration Runner - Execute migrations without dependencies
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from pathlib import Path
from sqlalchemy import text
from app.database import engine

def run_migrations():
    """Run all SQL migrations."""
    try:
        migrations_dir = Path(__file__).parent / "migrations"
        migration_files = sorted(migrations_dir.glob("*.sql"))

        if not migration_files:
            print("✗ No migration files found in ./migrations/")
            return False

        print(f"Found {len(migration_files)} migration file(s)\n")

        with engine.connect() as connection:
            for migration_file in migration_files:
                print(f"▶ Running: {migration_file.name}")
                with open(migration_file, "r") as f:
                    migration_sql = f.read()

                try:
                    connection.execute(text(migration_sql))
                    connection.commit()
                    print(f"✓ Successfully executed {migration_file.name}\n")
                except Exception as e:
                    connection.rollback()
                    print(f"✗ Error in {migration_file.name}:\n  {e}\n")
                    return False

        print("✓ All migrations completed successfully!")
        return True

    except Exception as e:
        print(f"✗ Migration failed: {e}")
        return False


if __name__ == "__main__":
    success = run_migrations()
    sys.exit(0 if success else 1)
