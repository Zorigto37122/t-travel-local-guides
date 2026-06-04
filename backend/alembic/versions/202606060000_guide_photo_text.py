"""change guide.photo from String(500) to Text

Revision ID: 202606060000
Revises: 202606050000
Create Date: 2026-06-06
"""
from alembic import op
import sqlalchemy as sa

revision = '202606060000'
down_revision = '202606050000'
branch_labels = None
depends_on = None


def upgrade():
    op.alter_column(
        'guides',
        'photo',
        type_=sa.Text(),
        existing_type=sa.String(500),
        existing_nullable=True,
    )


def downgrade():
    op.alter_column(
        'guides',
        'photo',
        type_=sa.String(500),
        existing_type=sa.Text(),
        existing_nullable=True,
    )
