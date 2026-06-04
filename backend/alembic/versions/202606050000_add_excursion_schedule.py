"""add excursion schedule tables (weekly availability + one-off slots)

Revision ID: 202606050000
Revises: 202606040001
Create Date: 2026-06-05
"""
from alembic import op
import sqlalchemy as sa

revision = '202606050000'
down_revision = '202606040001'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'excursion_availability',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('excursion_id', sa.Integer(), nullable=False),
        sa.Column('weekday', sa.Integer(), nullable=False),
        sa.Column('time', sa.String(length=5), nullable=False),
        sa.Column('capacity', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['excursion_id'], ['excursions.excursion_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(
        'ix_excursion_availability_excursion_id',
        'excursion_availability',
        ['excursion_id'],
    )

    op.create_table(
        'excursion_slots',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('excursion_id', sa.Integer(), nullable=False),
        sa.Column('slot_date', sa.Date(), nullable=False),
        sa.Column('time', sa.String(length=5), nullable=False),
        sa.Column('capacity', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['excursion_id'], ['excursions.excursion_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(
        'ix_excursion_slots_excursion_id',
        'excursion_slots',
        ['excursion_id'],
    )


def downgrade():
    op.drop_index('ix_excursion_slots_excursion_id', table_name='excursion_slots')
    op.drop_table('excursion_slots')
    op.drop_index('ix_excursion_availability_excursion_id', table_name='excursion_availability')
    op.drop_table('excursion_availability')
