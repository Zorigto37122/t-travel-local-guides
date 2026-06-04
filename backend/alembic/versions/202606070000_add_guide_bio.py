"""add bio to guides

Revision ID: 202606070000
Revises: 202606060000
Create Date: 2026-06-07
"""
from alembic import op
import sqlalchemy as sa

revision = '202606070000'
down_revision = '202606060000'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('guides', sa.Column('bio', sa.Text(), nullable=True))


def downgrade():
    op.drop_column('guides', 'bio')
