"""Change task status from open to available

Revision ID: change_open_to_available
Revises: 
Create Date: 2026-04-03

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'change_open_to_available'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Update all existing 'open' status values to 'available'
    op.execute("UPDATE tasks SET status = 'available' WHERE status = 'open'")


def downgrade() -> None:
    # Revert back if needed
    op.execute("UPDATE tasks SET status = 'open' WHERE status = 'available'")
