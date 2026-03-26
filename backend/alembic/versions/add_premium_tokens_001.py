"""Add premium tokens and is_premium fields to User model.

Revision ID: add_premium_tokens
Revises:
Create Date: 2026-03-26 12:22:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_premium_tokens_001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add premium_tokens column
    op.add_column('users', sa.Column('premium_tokens', sa.Integer(), nullable=False, server_default='0'))
    # Add is_premium column
    op.add_column('users', sa.Column('is_premium', sa.Boolean(), nullable=False, server_default='0'))


def downgrade() -> None:
    op.drop_column('users', 'is_premium')
    op.drop_column('users', 'premium_tokens')
