"""add city to excursions

Revision ID: 202602111200
Revises: c0327954f524
Create Date: 2026-02-11 12:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "202602111200"
down_revision: Union[str, Sequence[str], None] = "c0327954f524"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "excursions",
        sa.Column("city", sa.String(length=100), nullable=False, server_default=""),
    )
    # убираем server_default после применения миграции
    op.alter_column("excursions", "city", server_default=None)


def downgrade() -> None:
    op.drop_column("excursions", "city")

