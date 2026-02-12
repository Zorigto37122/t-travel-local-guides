"""add photo to guides

Revision ID: 202602120000
Revises: 202602111215
Create Date: 2026-02-12 00:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "202602120000"
down_revision: Union[str, Sequence[str], None] = "202602111215"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('guides', sa.Column('photo', sa.String(length=500), nullable=True))


def downgrade() -> None:
    op.drop_column('guides', 'photo')
