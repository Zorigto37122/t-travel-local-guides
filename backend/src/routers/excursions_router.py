from datetime import datetime, timedelta, date, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from src.auth.auth import fastapi_users
from src.database import get_session
from src.models import Booking, Client, Excursion, Guide, Payment
from src.schemas.excursion import (
    AvailableDatesResponse,
    AvailableTimeSlot,
    BookingCreate,
    BookingResponse,
    ExcursionCreate,
    ExcursionRead,
)


router = APIRouter(prefix="/api", tags=["excursions"])

current_active_user = fastapi_users.current_user(active=True)
current_active_superuser = fastapi_users.current_user(active=True, superuser=True)


@router.get("/excursions", response_model=List[ExcursionRead])
async def search_excursions(
    country: Optional[str] = Query(default=None),
    city: Optional[str] = Query(default=None),
    date: Optional[str] = Query(default=None),
    people: int = Query(default=1, ge=1),
    has_children: bool = Query(default=False),
    session: AsyncSession = Depends(get_session),
) -> List[ExcursionRead]:
    """
    Поиск экскурсий по стране, городу и количеству людей.
    Возвращает только одобренные экскурсии.
    """
    query = select(Excursion).where(Excursion.status == "approved")

    if country:
        query = query.where(Excursion.country.ilike(f"%{country}%"))
    if city:
        query = query.where(Excursion.city.ilike(f"%{city}%"))

    # простая проверка доступных мест
    query = query.where(
        (Excursion.available_slots.is_(None))
        | (Excursion.available_slots >= people)
    )

    result = await session.execute(query)
    excursions = result.scalars().all()

    return excursions


@router.get("/excursions/{excursion_id}", response_model=ExcursionRead)
async def get_excursion_by_id(
    excursion_id: int,
    session: AsyncSession = Depends(get_session),
) -> ExcursionRead:
    """
    Получить экскурсию по ID.
    """
    excursion = await session.get(Excursion, excursion_id)
    if excursion is None:
        raise HTTPException(status_code=404, detail="Экскурсия не найдена")
    return excursion


@router.get("/excursions/{excursion_id}/available-dates", response_model=AvailableDatesResponse)
async def get_available_dates(
    excursion_id: int,
    people: int = Query(default=1, ge=1),
    session: AsyncSession = Depends(get_session),
) -> AvailableDatesResponse:
    """
    Получить доступные даты и время для экскурсии на ближайшие 30 дней.
    """
    excursion = await session.get(Excursion, excursion_id)
    if excursion is None or excursion.status != "approved":
        raise HTTPException(status_code=404, detail="Экскурсия не найдена или недоступна")

    # Стандартные временные слоты
    time_slots_list = ["09:00", "12:00", "15:00", "18:00"]
    
    # Получаем существующие бронирования на ближайшие 30 дней
    today = datetime.now().date()
    end_date = today + timedelta(days=30)
    
    bookings_query = select(Booking).where(
        Booking.excursion_id == excursion_id,
        func.date(Booking.date) >= today,
        func.date(Booking.date) <= end_date,
        Booking.status.in_(["confirmed", "pending"])
    )
    bookings_result = await session.execute(bookings_query)
    bookings = bookings_result.scalars().all()
    
    # Группируем бронирования по дате и времени
    booked_slots = {}
    for booking in bookings:
        booking_date = booking.date.date()
        booking_time = booking.date.strftime("%H:%M")
        key = f"{booking_date}_{booking_time}"
        if key not in booked_slots:
            booked_slots[key] = 0
        booked_slots[key] += booking.number_of_people
    
    # Генерируем список доступных дат и времени
    available_time_slots = []
    for day_offset in range(30):
        current_date = today + timedelta(days=day_offset)
        date_str = current_date.isoformat()
        
        for time_str in time_slots_list:
            key = f"{current_date}_{time_str}"
            booked_count = booked_slots.get(key, 0)
            
            # Проверяем доступность
            if excursion.available_slots is None:
                # Если нет ограничения на количество мест, всегда доступно
                available = True
                available_count = None
            else:
                # Проверяем, есть ли свободные места
                remaining = excursion.available_slots - booked_count
                available = remaining >= people
                available_count = max(0, remaining)
            
            available_time_slots.append(
                AvailableTimeSlot(
                    date=date_str,
                    time=time_str,
                    available=available,
                    available_slots=available_count,
                )
            )
    
    return AvailableDatesResponse(
        excursion_id=excursion_id,
        available_slots=excursion.available_slots,
        time_slots=available_time_slots,
    )


@router.post(
    "/guides/me/excursions",
    response_model=ExcursionRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_excursion_for_guide(
    data: ExcursionCreate,
    user=Depends(current_active_user),
    session: AsyncSession = Depends(get_session),
) -> ExcursionRead:
    """
    Создание экскурсии гидом.
    Экскурсия попадает в статус `pending_review` и требует одобрения модератором.
    """
    # гарантируем наличие профиля гида
    guide_result = await session.execute(
        select(Guide).where(Guide.user_id == user.id)
    )
    guide = guide_result.scalar_one_or_none()
    if guide is None:
        guide = Guide(user_id=user.id)
        session.add(guide)
        await session.flush()

    excursion = Excursion(
        title=data.title,
        country=data.country,
        city=data.city,
        difficulty=data.difficulty,
        description=data.description,
        photos=data.photos,
        price_per_person=data.price_per_person,
        accepted_payment_methods=data.accepted_payment_methods,
        status="pending_review",
        available_slots=data.available_slots,
        guide_id=guide.guide_id,
    )
    session.add(excursion)
    await session.commit()
    await session.refresh(excursion)
    return excursion


@router.get(
    "/moderation/excursions",
    response_model=List[ExcursionRead],
)
async def list_excursions_for_moderation(
    user=Depends(current_active_superuser),
    session: AsyncSession = Depends(get_session),
) -> List[ExcursionRead]:
    """
    Список экскурсий, ожидающих модерации.
    """
    result = await session.execute(
        select(Excursion).where(Excursion.status == "pending_review")
    )
    return result.scalars().all()


@router.post(
    "/moderation/excursions/{excursion_id}/approve",
    response_model=ExcursionRead,
)
async def approve_excursion(
    excursion_id: int,
    user=Depends(current_active_superuser),
    session: AsyncSession = Depends(get_session),
) -> ExcursionRead:
    """
    Одобрить экскурсию модератором.
    """
    from src.models import Moderator  # локальный импорт, чтобы избежать циклов

    excursion = await session.get(Excursion, excursion_id)
    if excursion is None:
        raise HTTPException(status_code=404, detail="Экскурсия не найдена")

    # гарантия профиля модератора
    moderator_result = await session.execute(
        select(Moderator).where(Moderator.user_id == user.id)
    )
    moderator = moderator_result.scalar_one_or_none()
    if moderator is None:
        moderator = Moderator(user_id=user.id)
        session.add(moderator)
        await session.flush()

    excursion.status = "approved"
    excursion.moderator_id = moderator.moderator_id
    await session.commit()
    await session.refresh(excursion)
    return excursion


@router.post(
    "/bookings",
    response_model=BookingResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_booking(
    data: BookingCreate,
    user=Depends(current_active_user),
    session: AsyncSession = Depends(get_session),
) -> BookingResponse:
    """
    Бронирование экскурсии.
    При нехватке мест возвращает 400.
    """
    excursion = await session.get(Excursion, data.excursion_id)
    if excursion is None or excursion.status != "approved":
        raise HTTPException(
            status_code=404, 
            detail="Экскурсия недоступна для бронирования"
        )

    # Нормализуем datetime к UTC и убираем timezone для совместимости с БД
    booking_datetime = data.date
    if booking_datetime.tzinfo is not None:
        # Если datetime имеет timezone, конвертируем в UTC и убираем timezone
        booking_datetime = booking_datetime.astimezone(timezone.utc).replace(tzinfo=None)
    # Если datetime без timezone, предполагаем что это уже UTC и используем как есть

    # Проверяем доступность мест с учетом существующих бронирований на эту дату и время
    if excursion.available_slots is not None:
        # Получаем все бронирования на эту дату и время (в пределах того же часа для упрощения)
        booking_date = booking_datetime.date()
        booking_hour = booking_datetime.hour
        
        # Находим все бронирования на эту дату и час
        bookings_query = select(Booking).where(
            Booking.excursion_id == excursion.excursion_id,
            func.date(Booking.date) == booking_date,
            func.extract('hour', Booking.date) == booking_hour,
            Booking.status.in_(["confirmed", "pending"])
        )
        bookings_result = await session.execute(bookings_query)
        existing_bookings = bookings_result.scalars().all()
        
        # Подсчитываем уже забронированные места
        booked_slots = sum(b.number_of_people for b in existing_bookings)
        
        # Проверяем, есть ли достаточно свободных мест
        available_slots = excursion.available_slots - booked_slots
        if available_slots < data.number_of_people:
            raise HTTPException(
                status_code=400, 
                detail="На выбранную дату и время нет свободных мест"
            )

    # гарантируем профиль клиента
    client_result = await session.execute(
        select(Client).where(Client.user_id == user.id)
    )
    client = client_result.scalar_one_or_none()
    if client is None:
        client = Client(user_id=user.id)
        session.add(client)
        await session.flush()

    # создаём оплату и бронирование
    total_amount = float(excursion.price_per_person) * data.number_of_people
    payment = Payment(
        amount=total_amount,
        payment_method="online",
    )
    session.add(payment)
    await session.flush()

    booking = Booking(
        date=booking_datetime,
        number_of_people=data.number_of_people,
        status="confirmed",
        payment_status="pending",
        excursion_id=excursion.excursion_id,
        client_id=client.client_id,
        payment_id=payment.id,
    )
    session.add(booking)

    # Не уменьшаем available_slots глобально, так как проверяем по дате/времени
    # Это позволяет иметь разные доступные слоты для разных дат/времени

    await session.commit()
    await session.refresh(booking)

    return BookingResponse(
        booking=booking,
        message="Экскурсия успешно забронирована",
    )

