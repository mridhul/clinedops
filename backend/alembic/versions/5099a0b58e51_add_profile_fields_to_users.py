"""add profile fields to users

Revision ID: 5099a0b58e51
Revises: 2b3eaa4f0e1c
Create Date: 2026-04-10 16:27:28.173166
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '5099a0b58e51'
down_revision = '2b3eaa4f0e1c'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('users', sa.Column('profile_photo_url', sa.String(length=1024), nullable=True))
    op.add_column('users', sa.Column('title', sa.String(length=100), nullable=True))


def downgrade() -> None:
    op.drop_column('users', 'title')
    op.drop_column('users', 'profile_photo_url')

