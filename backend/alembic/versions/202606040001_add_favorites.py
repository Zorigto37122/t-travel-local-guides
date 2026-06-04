"""add favorites table

Revision ID: 202606040001
Revises: 202606030001
Create Date: 2026-06-04
"""
from alembic import op
import sqlalchemy as sa

revision = '202606040001'
down_revision = '202606030001'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'favorites',
        sa.Column('favorite_id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('client_id', sa.Integer(), nullable=False),
        sa.Column('excursion_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['client_id'], ['clients.client_id']),
        sa.ForeignKeyConstraint(['excursion_id'], ['excursions.excursion_id']),
        sa.PrimaryKeyConstraint('favorite_id'),
    )


def downgrade():
    op.drop_table('favorites')
