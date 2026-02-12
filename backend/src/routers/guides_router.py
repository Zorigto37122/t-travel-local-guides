from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.auth.auth import fastapi_users
from src.database import get_session
from src.models import Booking, Client, Excursion, Guide, User
from src.schemas.excursion import ExcursionCreate, ExcursionRead
from src.schemas.guide import GuideRead, GuideUpdate

router = APIRouter(prefix="/api", tags=["guides"])

current_active_user = fastapi_users.current_user(active=True)


async def get_current_guide(
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_session),
) -> Guide:
    """Dependency to get current user's guide profile. Raises 403 if user is not a guide."""
    guide_result = await session.execute(
        select(Guide).where(Guide.user_id == user.id)
    )
    guide = guide_result.scalar_one_or_none()
    
    if guide is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Доступ запрещен. Вы не являетесь гидом."
        )
    
    return guide


@router.get("/guides/me", response_model=GuideRead)
async def get_my_guide_profile(
    guide: Guide = Depends(get_current_guide),
) -> GuideRead:
    """
    Получить профиль гида текущего пользователя.
    Доступно только для гидов.
    """
    return guide


@router.get("/guides/check", tags=["guides"])
async def check_if_guide(
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_session),
) -> dict:
    """
    Проверить, является ли текущий пользователь гидом.
    """
    guide_result = await session.execute(
        select(Guide).where(Guide.user_id == user.id)
    )
    guide = guide_result.scalar_one_or_none()
    
    return {"is_guide": guide is not None}


@router.patch("/guides/me", response_model=GuideRead)
async def update_my_guide_profile(
    data: GuideUpdate,
    guide: Guide = Depends(get_current_guide),
    session: AsyncSession = Depends(get_session),
) -> GuideRead:
    """
    Обновить профиль гида (включая фотографию).
    Доступно только для гидов.
    """
    try:
        if data.photo is not None:
            # Проверяем размер base64 строки (примерно 1.33x от размера файла)
            # Ограничиваем до ~10MB в base64 (примерно 7.5MB оригинального файла)
            if len(data.photo) > 10 * 1024 * 1024:
                raise HTTPException(
                    status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                    detail="Размер фотографии слишком большой. Максимальный размер: 7.5 МБ"
                )
            guide.photo = data.photo
        
        await session.commit()
        await session.refresh(guide)
        return guide
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка при обновлении профиля: {str(e)}"
        )


@router.get("/guides/me/excursions", response_model=List[ExcursionRead])
async def get_my_excursions(
    guide: Guide = Depends(get_current_guide),
    session: AsyncSession = Depends(get_session),
) -> List[ExcursionRead]:
    """
    Получить все экскурсии текущего гида.
    Доступно только для гидов.
    """
    excursions_result = await session.execute(
        select(Excursion).where(Excursion.guide_id == guide.guide_id)
        .order_by(Excursion.excursion_id.desc())
    )
    excursions = excursions_result.scalars().all()
    
    return excursions


@router.patch(
    "/guides/me/excursions/{excursion_id}",
    response_model=ExcursionRead,
)
async def update_my_excursion(
    excursion_id: int,
    data: ExcursionCreate,
    guide: Guide = Depends(get_current_guide),
    session: AsyncSession = Depends(get_session),
) -> ExcursionRead:
    """
    Редактировать экскурсию гида.
    Доступно только для гидов.
    """
    
    excursion = await session.get(Excursion, excursion_id)
    if excursion is None:
        raise HTTPException(
            status_code=404,
            detail="Экскурсия не найдена"
        )
    
    # Проверяем, что экскурсия принадлежит текущему гиду
    if excursion.guide_id != guide.guide_id:
        raise HTTPException(
            status_code=403,
            detail="Нет доступа к этой экскурсии"
        )
    
    # Обновляем поля экскурсии
    excursion.title = data.title
    excursion.country = data.country
    excursion.city = data.city
    excursion.difficulty = data.difficulty
    excursion.description = data.description
    excursion.photos = data.photos
    excursion.price_per_person = data.price_per_person
    excursion.accepted_payment_methods = data.accepted_payment_methods
    excursion.available_slots = data.available_slots
    
    # Если экскурсия была одобрена, при редактировании она снова требует модерации
    if excursion.status == "approved":
        excursion.status = "pending_review"
    
    await session.commit()
    await session.refresh(excursion)
    return excursion


@router.get("/guides/me/bookings")
async def get_my_bookings_calendar(
    guide: Guide = Depends(get_current_guide),
    session: AsyncSession = Depends(get_session),
) -> List[dict]:
    """
    Получить календарь бронирований гида с контактной информацией клиентов.
    Доступно только для гидов.
    """
    
    # Получаем все бронирования экскурсий гида
    bookings_query = (
        select(Booking, Excursion, Client, User)
        .join(Excursion, Booking.excursion_id == Excursion.excursion_id)
        .join(Client, Booking.client_id == Client.client_id)
        .join(User, Client.user_id == User.id)
        .where(Excursion.guide_id == guide.guide_id)
        .where(Booking.status.in_(["confirmed", "pending"]))
        .order_by(Booking.date.asc())
    )
    
    result = await session.execute(bookings_query)
    bookings_data = result.all()
    
    bookings_list = []
    for booking, excursion, client, client_user in bookings_data:
        bookings_list.append({
            "booking_id": booking.booking_id,
            "excursion_id": excursion.excursion_id,
            "excursion_title": excursion.title,
            "date": booking.date.isoformat(),
            "number_of_people": booking.number_of_people,
            "status": booking.status,
            "payment_status": booking.payment_status,
            "client_name": client_user.name,
            "client_email": client_user.email,
            "client_phone": client_user.phone,
        })
    
    return bookings_list
