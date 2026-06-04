"""add experience to guides

Revision ID: 202606090000
Revises: 202606080000
Create Date: 2026-06-09
"""
from alembic import op
import sqlalchemy as sa

revision = '202606090000'
down_revision = '202606080000'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('guides', sa.Column('experience', sa.String(100), nullable=True))


def downgrade():
    op.drop_column('guides', 'experience')
