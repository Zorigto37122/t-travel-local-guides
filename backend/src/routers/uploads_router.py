import uuid
from pathlib import Path
from typing import List

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status

from src.auth.auth import fastapi_users

router = APIRouter(prefix="/api", tags=["uploads"])

current_active_user = fastapi_users.current_user(active=True)

# Путь к папке с файлами
ASSETS_DIR = Path(__file__).parent.parent.parent / "assets" / "excursions"
ASSETS_DIR.mkdir(parents=True, exist_ok=True)

# URL префикс для статических файлов
STATIC_URL_PREFIX = "/static/excursions"


@router.post("/uploads/excursion-photos", response_model=List[str])
async def upload_excursion_photos(
    files: List[UploadFile] = File(...),
    user=Depends(current_active_user),
) -> List[str]:
    """
    Загрузить фотографии для экскурсии.
    Возвращает список URL загруженных файлов.
    Фотки сохраняются с UUID именами для уникальности.
    """
    if len(files) > 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Можно загрузить максимум 10 фотографий"
        )
    
    if len(files) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Необходимо загрузить хотя бы одну фотографию"
        )
    
    uploaded_urls = []
    
    for file in files:
        # Проверяем тип файла
        if not file.content_type or not file.content_type.startswith('image/'):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Файл {file.filename} не является изображением"
            )
        
        # Проверяем размер файла (максимум 5MB)
        contents = await file.read()
        if len(contents) > 5 * 1024 * 1024:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"Файл {file.filename} слишком большой. Максимальный размер: 5 МБ"
            )
        
        # Генерируем уникальное имя файла с UUID
        file_ext = Path(file.filename).suffix if file.filename else '.jpg'
        # Используем UUID4 для гарантированной уникальности
        unique_filename = f"{uuid.uuid4()}{file_ext}"
        file_path = ASSETS_DIR / unique_filename
        
        # Убеждаемся, что директория существует
        ASSETS_DIR.mkdir(parents=True, exist_ok=True)
        
        # Сохраняем файл
        try:
            with open(file_path, "wb") as f:
                f.write(contents)
        except Exception as e:
            error_msg = f"Ошибка при сохранении файла {file.filename}: {str(e)}"
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=error_msg
            )
        
        # Формируем URL (относительный путь, начинающийся с /static/excursions/)
        file_url = f"{STATIC_URL_PREFIX}/{unique_filename}"
        uploaded_urls.append(file_url)
    
    return uploaded_urls


@router.delete("/uploads/excursion-photos/{filename}")
async def delete_excursion_photo(
    filename: str,
    user=Depends(current_active_user),
):
    """
    Удалить фотографию экскурсии.
    """
    file_path = ASSETS_DIR / filename
    
    # Проверяем безопасность пути (предотвращаем path traversal)
    try:
        file_path.resolve().relative_to(ASSETS_DIR.resolve())
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Недопустимое имя файла"
        )
    
    if not file_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Файл не найден"
        )
    
    file_path.unlink()
    return {"message": "Файл успешно удален"}
