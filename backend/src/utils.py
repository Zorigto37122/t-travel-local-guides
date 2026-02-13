"""
Утилиты для работы с фотографиями экскурсий
"""
from pathlib import Path

# Путь к папке с фотографиями экскурсий
ASSETS_DIR = Path(__file__).parent.parent / "assets" / "excursions"
STATIC_URL_PREFIX = "/static/excursions"


def get_excursion_photo_path(title: str, city: str) -> str | None:
    """
    Получить путь к фотографии экскурсии из папки assets/excursions.
    
    Для экскурсий с Москвой проверяет наличие файла с названием title + ".jpg"
    в папке assets/excursions.
    Также проверяет для любых других экскурсий, если есть файл с таким названием.
    
    Args:
        title: Название экскурсии
        city: Город экскурсии
        
    Returns:
        Путь к фотографии (например, "/static/excursions/Название.jpg") или None
    """
    # Формируем имя файла: title + ".jpg"
    filename = f"{title}.jpg"
    file_path = ASSETS_DIR / filename
    
    # Проверяем существование файла
    if file_path.exists():
        return f"{STATIC_URL_PREFIX}/{filename}"
    
    return None


def is_uploaded_by_guide(photo_url: str) -> bool:
    """
    Проверить, является ли фотка загруженной гидом.
    
    Фотки гидов имеют UUID имена (например, /static/excursions/uuid.jpg),
    а автоматические фотки имеют названия как title + ".jpg"
    
    Args:
        photo_url: URL фотографии
        
    Returns:
        True если фотка загружена гидом, False иначе
    """
    if not photo_url or not photo_url.strip():
        return False
    
    # Если фотка начинается с /static/excursions/, проверяем имя файла
    if photo_url.startswith("/static/excursions/"):
        # Извлекаем имя файла
        filename = photo_url.split("/")[-1]
        # Если имя файла содержит UUID (36 символов с дефисами) или длинное случайное имя,
        # это фотка гида. Если имя файла короткое и похоже на название экскурсии - это автоматическая
        # UUID формат: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx (36 символов)
        # Проверяем, что это не просто название экскурсии + ".jpg"
        # UUID обычно содержит дефисы и имеет длину больше 20 символов
        if len(filename) > 20 and ('-' in filename or filename.count('.') == 1):
            # Это похоже на UUID или случайное имя - фотка гида
            return True
    
    # Если это полный URL (http/https) или base64 - это тоже фотка гида
    if photo_url.startswith("http") or photo_url.startswith("data:image"):
        return True
    
    return False


def enrich_excursion_photos(photos: str | None, title: str, city: str) -> str | None:
    """
    Обогатить поле photos экскурсии автоматической подстановкой фотки из assets.
    
    Если photos пустое или содержит dummy photo, и есть фотка в assets/excursions,
    то подставляет её.
    
    НЕ заменяет фотки, которые были загружены гидами.
    
    Args:
        photos: Текущее значение поля photos из БД (может быть строка с URL через запятую)
        title: Название экскурсии
        city: Город экскурсии
        
    Returns:
        Обновленное значение photos или исходное значение
    """
    # Если уже есть фотки
    if photos and photos.strip():
        photos_lower = photos.lower()
        
        # Если это dummy photo, заменяем
        if "dummyimage.com" in photos_lower:
            pass  # Продолжаем дальше, чтобы найти замену
        else:
            # Разбиваем фотки по запятой для проверки
            photo_list = [p.strip() for p in photos.split(',') if p.strip()]
            
            # Проверяем, есть ли хотя бы одна реальная фотка, загруженная гидом
            has_guide_photos = False
            for photo in photo_list:
                if is_uploaded_by_guide(photo):
                    has_guide_photos = True
                    break
            
            # Если есть фотки гида, НЕ заменяем их автоматической подстановкой
            if has_guide_photos:
                return photos
    
    # Пытаемся найти фотку в assets только если фотки пустые или dummy photo
    photo_path = get_excursion_photo_path(title, city)
    if photo_path:
        return photo_path
    
    # Если ничего не нашли, возвращаем исходное значение (может быть None или пустая строка)
    return photos
