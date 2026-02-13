"""update moscow excursion photos

Revision ID: 202602130000
Revises: 202602120001
Create Date: 2026-02-13 00:00:00.000000

"""

from typing import Sequence, Union
from pathlib import Path

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "202602130000"
down_revision: Union[str, Sequence[str], None] = "202602120001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    Обновляет поле photos для экскурсий с Москвой, если есть соответствующие файлы в assets/excursions.
    """
    conn = op.get_bind()
    
    # Путь к папке с фотографиями (относительно корня проекта)
    # В миграции путь будет относительно места выполнения миграции
    assets_dir = Path(__file__).parent.parent.parent / "assets" / "excursions"
    
    # Получаем все экскурсии с Москвой
    moscow_excursions = conn.execute(
        sa.text("SELECT excursion_id, title, photos FROM excursions WHERE city = 'Москва'")
    ).fetchall()
    
    # Обновляем фотки для каждой экскурсии, если файл существует
    for excursion_id, title, current_photos in moscow_excursions:
        # Формируем имя файла
        filename = f"{title}.jpg"
        file_path = assets_dir / filename
        
        # Проверяем существование файла
        if file_path.exists():
            # Формируем URL
            photo_url = f"/static/excursions/{filename}"
            
            # Обновляем только если текущее значение пустое или содержит dummy photo
            if not current_photos or "dummyimage.com" in current_photos.lower():
                conn.execute(
                    sa.text(
                        "UPDATE excursions SET photos = :photo_url WHERE excursion_id = :excursion_id"
                    ),
                    {"photo_url": photo_url, "excursion_id": excursion_id}
                )


def downgrade() -> None:
    """
    Откат миграции - очищаем фотки для экскурсий с Москвой, которые были добавлены автоматически.
    """
    conn = op.get_bind()
    
    # Очищаем фотки, которые начинаются с /static/excursions/ для Москвы
    conn.execute(
        sa.text(
            "UPDATE excursions SET photos = '' WHERE city = 'Москва' AND photos LIKE '/static/excursions/%'"
        )
    )
