"""add price_type to excursions

Revision ID: 202606030001
Revises: 202606020000
Create Date: 2026-06-03
"""
from alembic import op
import sqlalchemy as sa

revision = '202606030001'
down_revision = '202606020000'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('excursions', sa.Column('price_type', sa.String(20), nullable=True, server_default='per_person'))


def downgrade():
    op.drop_column('excursions', 'price_type')
