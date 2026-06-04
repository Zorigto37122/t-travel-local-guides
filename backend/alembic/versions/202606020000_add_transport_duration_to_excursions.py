"""add transport and duration to excursions

Revision ID: 202606020000
Revises: 202602130000_update_moscow_excursion_photos
Create Date: 2026-06-02
"""
from alembic import op
import sqlalchemy as sa

revision = '202606020000'
down_revision = '202602130000'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('excursions', sa.Column('transport', sa.String(100), nullable=True))
    op.add_column('excursions', sa.Column('duration', sa.String(50), nullable=True))


def downgrade() -> None:
    op.drop_column('excursions', 'duration')
    op.drop_column('excursions', 'transport')
