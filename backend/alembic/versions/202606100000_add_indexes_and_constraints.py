"""add indexes and unique constraint on favorites

Revision ID: 202606100000
Revises: 202606090000
Create Date: 2026-06-10
"""
from alembic import op
import sqlalchemy as sa

revision = '202606100000'
down_revision = '202606090000'
branch_labels = None
depends_on = None


def upgrade():
    # Удаляем дубликаты в favorites перед добавлением UniqueConstraint
    op.execute("""
        DELETE FROM favorites f1
        USING favorites f2
        WHERE f1.favorite_id > f2.favorite_id
          AND f1.client_id = f2.client_id
          AND f1.excursion_id = f2.excursion_id
    """)

    # UniqueConstraint (если ещё не существует)
    op.execute("""
        DO $$ BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_constraint
                WHERE conname = 'uq_favorites_client_excursion'
            ) THEN
                ALTER TABLE favorites
                ADD CONSTRAINT uq_favorites_client_excursion
                UNIQUE (client_id, excursion_id);
            END IF;
        END $$;
    """)

    # Все индексы — безопасно через IF NOT EXISTS
    op.execute("CREATE INDEX IF NOT EXISTS ix_bookings_excursion_id ON bookings (excursion_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_bookings_client_id ON bookings (client_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_bookings_date ON bookings (date)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_bookings_status ON bookings (status)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_favorites_client_id ON favorites (client_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_favorites_excursion_id ON favorites (excursion_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_reviews_excursion_id ON reviews (excursion_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_reviews_client_id ON reviews (client_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_excursions_status ON excursions (status)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_excursions_city ON excursions (city)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_excursion_availability_excursion_id ON excursion_availability (excursion_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_excursion_slots_excursion_id ON excursion_slots (excursion_id)")


def downgrade():
    op.execute("DROP INDEX IF EXISTS ix_excursion_slots_excursion_id")
    op.execute("DROP INDEX IF EXISTS ix_excursion_availability_excursion_id")
    op.execute("DROP INDEX IF EXISTS ix_excursions_city")
    op.execute("DROP INDEX IF EXISTS ix_excursions_status")
    op.execute("DROP INDEX IF EXISTS ix_reviews_client_id")
    op.execute("DROP INDEX IF EXISTS ix_reviews_excursion_id")
    op.execute("DROP INDEX IF EXISTS ix_favorites_excursion_id")
    op.execute("DROP INDEX IF EXISTS ix_favorites_client_id")
    op.execute("DROP INDEX IF EXISTS ix_bookings_status")
    op.execute("DROP INDEX IF EXISTS ix_bookings_date")
    op.execute("DROP INDEX IF EXISTS ix_bookings_client_id")
    op.execute("DROP INDEX IF EXISTS ix_bookings_excursion_id")
    op.execute("ALTER TABLE favorites DROP CONSTRAINT IF EXISTS uq_favorites_client_excursion")
