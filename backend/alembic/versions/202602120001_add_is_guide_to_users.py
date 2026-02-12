"""add is_guide to users

Revision ID: 202602120001
Revises: 202602120000
Create Date: 2026-02-12 00:01:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "202602120001"
down_revision: Union[str, Sequence[str], None] = "202602120000"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('is_guide', sa.Boolean(), nullable=False, server_default='false'))


def downgrade() -> None:
    op.drop_column('users', 'is_guide')
