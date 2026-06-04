"""add short_description to excursions

Revision ID: 202606080000
Revises: 202606070000
Create Date: 2026-06-08
"""
from alembic import op
import sqlalchemy as sa

revision = '202606080000'
down_revision = '202606070000'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('excursions', sa.Column('short_description', sa.String(300), nullable=True))


def downgrade():
    op.drop_column('excursions', 'short_description')
