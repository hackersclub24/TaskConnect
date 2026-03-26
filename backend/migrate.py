#!/usr/bin/env python3
"""
Direct SQL Migration using SQLAlchemy URL parsing
"""
import sys
from pathlib import Path
from urllib.parse import urlparse
from sqlalchemy import text, create_engine

# Manual DATABASE_URL (update if needed)
DATABASE_URL = "postgresql+psycopg2://postgres:postgres@localhost:5432/taskconnect"

def run_migrations():
    """Run all SQL migrations."""
    try:
        print(f"Connecting to database...")

        # Try to connect
        engine = create_engine(DATABASE_URL)
        with engine.connect() as conn:
            conn.exec_driver_sql("SELECT 1")

        migrations_dir = Path(__file__).parent / "migrations"
        migration_files = sorted(migrations_dir.glob("*.sql"))

        if not migration_files:
            print("[ERROR] No migration files found")
            return False

        print(f"Found {len(migration_files)} migration file(s)\n")

        with engine.connect() as connection:
            for migration_file in migration_files:
                print(f"[RUN] {migration_file.name}")
                with open(migration_file, "r") as f:
                    migration_sql = f.read()

                try:
                    connection.execute(text(migration_sql))
                    connection.commit()
                    print(f"[OK] Success\n")
                except Exception as e:
                    print(f"[FAILED] Error: {e}\n")
                    return False

        print("[OK] All migrations completed!")
        return True

    except Exception as e:
        print(f"[FAILED] Connection failed: {e}")
        print("\nMake sure:")
        print("  1. PostgreSQL is running")
        print("  2. Database 'taskconnect' exists")
        print("  3. USERNAME/PASSWORD are correct")
        print(f"\nDatabase URL: {DATABASE_URL}")
        return False


if __name__ == "__main__":
    success = run_migrations()
    sys.exit(0 if success else 1)
