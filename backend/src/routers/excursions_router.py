from datetime import datetime, timedelta, date, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from src.auth.auth import fastapi_users
from src.database import get_session
from src.models import (
    Booking,
    Client,
    Excursion,
    ExcursionAvailability,
    ExcursionSlot,
    Favorite,
    Guide,
    Payment,
    Review,
    User,
)
from src.schemas.excursion import (
    AvailableDatesResponse,
    AvailableTimeSlot,
    BookingCreate,
    BookingResponse,
    BookingWithExcursion,
    ExcursionCardRead,
    ExcursionCreate,
    ExcursionRead,
    ReviewCreate,
    ReviewRead,
)


router = APIRouter(prefix="/api", tags=["excursions"])

current_active_user = fastapi_users.current_user(active=True)
current_active_superuser = fastapi_users.current_user(active=True, superuser=True)


def _guide_avg_subquery():
    """Подзапрос: средний рейтинг гида по всем его экскурсиям."""
    guide_excursions = select(Excursion.excursion_id).where(
        Excursion.guide_id == Guide.guide_id
    ).correlate(Guide).scalar_subquery()
    return (
        select(func.avg(Review.rating))
        .where(Review.excursion_id.in_(guide_excursions))
        .correlate(Guide)
        .scalar_subquery()
    )


def _build_card(row, photos: str) -> ExcursionCardRead:
    exc = row.Excursion
    avg = round(float(row.avg_rating), 1) if row.avg_rating else None
    guide_avg = round(float(row.guide_avg_rating), 1) if row.guide_avg_rating else None
    return ExcursionCardRead(
        excursion_id=exc.excursion_id,
        title=exc.title,
        country=exc.country,
        city=exc.city,
        difficulty=exc.difficulty,
        short_description=exc.short_description,
        description=exc.description,
        photos=photos,
        price_per_person=float(exc.price_per_person),
        price_type=exc.price_type or "per_person",
        accepted_payment_methods=exc.accepted_payment_methods,
        status=exc.status,
        available_slots=exc.available_slots,
        transport=exc.transport,
        duration=exc.duration,
        guide_id=exc.guide_id,
        guide_name=row.guide_name,
        guide_avatar=row.guide_avatar,
        guide_bio=row.guide_bio,
        guide_experience=row.guide_experience,
        avg_rating=avg,
        reviews_count=int(row.reviews_count),
        guide_avg_rating=guide_avg,
    )


async def _load_schedule(session: AsyncSession, excursion_id: int):
    """Загрузить недельные правила и разовые слоты экскурсии."""
    rules = (await session.execute(
        select(ExcursionAvailability).where(ExcursionAvailability.excursion_id == excursion_id)
    )).scalars().all()
    extra = (await session.execute(
        select(ExcursionSlot).where(ExcursionSlot.excursion_id == excursion_id)
    )).scalars().all()
    return rules, extra


def _generate_offered_slots(rules, extra, days: int = 30) -> dict:
    """
    Развернуть расписание в конкретные слоты на ближайшие `days` дней.
    Возвращает dict[(date_iso, "HH:MM")] -> capacity (None = взять из excursion.available_slots).
    Прошедшее сегодня время пропускается.
    """
    today = datetime.now().date()
    now_time = datetime.now().strftime("%H:%M")
    end_date = today + timedelta(days=days)

    rules_by_weekday: dict[int, list] = {}
    for r in rules:
        rules_by_weekday.setdefault(r.weekday, []).append(r)

    offered: dict = {}
    for offset in range(days):
        d = today + timedelta(days=offset)
        for r in rules_by_weekday.get(d.weekday(), []):
            if offset == 0 and r.time <= now_time:
                continue
            offered[(d.isoformat(), r.time)] = r.capacity

    # Разовые слоты перекрывают capacity недельного правила в тот же день/время
    for s in extra:
        if not (today <= s.slot_date < end_date):
            continue
        if s.slot_date == today and s.time <= now_time:
            continue
        offered[(s.slot_date.isoformat(), s.time)] = s.capacity

    return offered


@router.get("/excursions", response_model=List[ExcursionCardRead])
async def search_excursions(
    country: Optional[str] = Query(default=None),
    city: Optional[str] = Query(default=None),
    date: Optional[str] = Query(default=None),
    people: int = Query(default=1, ge=1),
    has_children: bool = Query(default=False),
    session: AsyncSession = Depends(get_session),
) -> List[ExcursionCardRead]:
    query = (
        select(
            Excursion,
            User.name.label("guide_name"),
            Guide.photo.label("guide_avatar"),
            Guide.bio.label("guide_bio"),
            Guide.experience.label("guide_experience"),
            func.avg(Review.rating).label("avg_rating"),
            func.count(Review.review_id).label("reviews_count"),
            _guide_avg_subquery().label("guide_avg_rating"),
        )
        .join(Guide, Excursion.guide_id == Guide.guide_id)
        .join(User, Guide.user_id == User.id)
        .outerjoin(Review, Review.excursion_id == Excursion.excursion_id)
        .where(Excursion.status == "approved")
        .group_by(Excursion.excursion_id, User.name, Guide.photo, Guide.bio, Guide.experience, Guide.guide_id)
    )

    if country:
        query = query.where(Excursion.country.ilike(f"%{country}%"))
    if city:
        query = query.where(Excursion.city.ilike(f"%{city}%"))
    query = query.where(
        (Excursion.available_slots.is_(None)) | (Excursion.available_slots >= people)
    )

    result = await session.execute(query)
    rows = result.all()

    from src.utils import enrich_excursion_photos
    return [_build_card(row, enrich_excursion_photos(row.Excursion.photos, row.Excursion.title, row.Excursion.city)) for row in rows]


@router.get("/excursions/{excursion_id}", response_model=ExcursionCardRead)
async def get_excursion_by_id(
    excursion_id: int,
    session: AsyncSession = Depends(get_session),
) -> ExcursionCardRead:
    query = (
        select(
            Excursion,
            User.name.label("guide_name"),
            Guide.photo.label("guide_avatar"),
            Guide.bio.label("guide_bio"),
            Guide.experience.label("guide_experience"),
            func.avg(Review.rating).label("avg_rating"),
            func.count(Review.review_id).label("reviews_count"),
            _guide_avg_subquery().label("guide_avg_rating"),
        )
        .join(Guide, Excursion.guide_id == Guide.guide_id)
        .join(User, Guide.user_id == User.id)
        .outerjoin(Review, Review.excursion_id == Excursion.excursion_id)
        .where(Excursion.excursion_id == excursion_id)
        .group_by(Excursion.excursion_id, User.name, Guide.photo, Guide.bio, Guide.experience, Guide.guide_id)
    )
    result = await session.execute(query)
    row = result.one_or_none()
    if row is None:
        raise HTTPException(status_code=404, detail="Экскурсия не найдена")
    from src.utils import enrich_excursion_photos
    photos = enrich_excursion_photos(row.Excursion.photos, row.Excursion.title, row.Excursion.city)
    return _build_card(row, photos)


@router.get("/excursions/{excursion_id}/reviews", response_model=List[ReviewRead])
async def get_excursion_reviews(
    excursion_id: int,
    session: AsyncSession = Depends(get_session),
) -> List[ReviewRead]:
    query = (
        select(Review, User.name.label("client_name"))
        .join(Client, Review.client_id == Client.client_id)
        .join(User, Client.user_id == User.id)
        .where(Review.excursion_id == excursion_id)
        .order_by(Review.date.desc())
    )
    result = await session.execute(query)
    rows = result.all()
    return [
        ReviewRead(
            review_id=row.Review.review_id,
            rating=row.Review.rating,
            comment=row.Review.comment,
            date=row.Review.date.strftime("%d %B %Y"),
            client_name=row.client_name,
        )
        for row in rows
    ]


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

    today = datetime.now().date()
    end_date = today + timedelta(days=30)

    # Существующие бронирования на ближайшие 30 дней → занятые места по (дата, "HH:MM")
    bookings_query = select(Booking).where(
        Booking.excursion_id == excursion_id,
        func.date(Booking.date) >= today,
        func.date(Booking.date) <= end_date,
        Booking.status.in_(["confirmed", "pending"])
    )
    bookings = (await session.execute(bookings_query)).scalars().all()

    booked_slots: dict[str, int] = {}
    for booking in bookings:
        key = f"{booking.date.date().isoformat()}_{booking.date.strftime('%H:%M')}"
        booked_slots[key] = booked_slots.get(key, 0) + booking.number_of_people

    def _make_slot(date_str: str, time_str: str, slot_capacity) -> AvailableTimeSlot:
        booked = booked_slots.get(f"{date_str}_{time_str}", 0)
        if slot_capacity is None:
            return AvailableTimeSlot(date=date_str, time=time_str, available=True, available_slots=None)
        remaining = slot_capacity - booked
        return AvailableTimeSlot(
            date=date_str,
            time=time_str,
            available=remaining >= people,
            available_slots=max(0, remaining),
        )

    rules, extra = await _load_schedule(session, excursion_id)

    if rules or extra:
        # Гид задал расписание — показываем только заданные слоты
        offered = _generate_offered_slots(rules, extra, days=30)
        available_time_slots = [
            _make_slot(date_str, time_str, cap if cap is not None else excursion.available_slots)
            for (date_str, time_str), cap in sorted(offered.items())
        ]
    else:
        # Расписание не задано — легаси-слоты на каждый день (совместимость с seed-данными)
        time_slots_list = ["09:00", "12:00", "15:00", "18:00"]
        available_time_slots = [
            _make_slot((today + timedelta(days=offset)).isoformat(), time_str, excursion.available_slots)
            for offset in range(30)
            for time_str in time_slots_list
        ]

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
    # требуем одобренный профиль гида (без авто-создания — проходит модерацию)
    guide_result = await session.execute(
        select(Guide).where(Guide.user_id == user.id)
    )
    guide = guide_result.scalar_one_or_none()
    if guide is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Ваша заявка на становление гидом ещё не одобрена администратором.",
        )

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

    booking_date = booking_datetime.date()
    booking_time = booking_datetime.strftime("%H:%M")

    # Если гид задал расписание — выбранные дата+время должны в него входить
    rules, extra = await _load_schedule(session, excursion.excursion_id)
    if rules or extra:
        offered = _generate_offered_slots(rules, extra, days=30)
        slot_key = (booking_date.isoformat(), booking_time)
        if slot_key not in offered:
            raise HTTPException(
                status_code=400,
                detail="Это время недоступно для бронирования",
            )
        slot_capacity = offered[slot_key]
        effective_capacity = slot_capacity if slot_capacity is not None else excursion.available_slots
    else:
        effective_capacity = excursion.available_slots

    # Проверяем доступность мест на выбранную дату+время
    if effective_capacity is not None:
        existing_bookings = (await session.execute(
            select(Booking).where(
                Booking.excursion_id == excursion.excursion_id,
                func.date(Booking.date) == booking_date,
                Booking.status.in_(["confirmed", "pending"]),
            )
        )).scalars().all()
        booked = sum(
            b.number_of_people for b in existing_bookings
            if b.date.strftime("%H:%M") == booking_time
        )
        if effective_capacity - booked < data.number_of_people:
            raise HTTPException(
                status_code=400,
                detail="На выбранную дату и время нет свободных мест",
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


@router.get(
    "/bookings/me",
    response_model=List[BookingWithExcursion],
)
async def get_my_bookings(
    user=Depends(current_active_user),
    session: AsyncSession = Depends(get_session),
) -> List[BookingWithExcursion]:
    """
    Получить все бронирования текущего пользователя.
    """
    # Получаем профиль клиента
    client_result = await session.execute(
        select(Client).where(Client.user_id == user.id)
    )
    client = client_result.scalar_one_or_none()
    
    if client is None:
        return []
    
    # Получаем все бронирования клиента с информацией об экскурсиях
    bookings_query = (
        select(Booking, Excursion)
        .join(Excursion, Booking.excursion_id == Excursion.excursion_id)
        .where(Booking.client_id == client.client_id)
        .order_by(Booking.date.desc())
    )
    
    result = await session.execute(bookings_query)
    bookings_data = result.all()

    now = datetime.now(timezone.utc).replace(tzinfo=None)
    needs_commit = False
    bookings_list = []
    for booking, excursion in bookings_data:
        # Auto-complete confirmed bookings whose date has passed
        if booking.status == "confirmed" and booking.date < now:
            booking.status = "completed"
            needs_commit = True

        total_amount = float(excursion.price_per_person) * booking.number_of_people
        bookings_list.append(
            BookingWithExcursion(
                booking_id=booking.booking_id,
                excursion_id=booking.excursion_id,
                date=booking.date,
                number_of_people=booking.number_of_people,
                status=booking.status,
                payment_status=booking.payment_status,
                excursion_title=excursion.title,
                excursion_city=excursion.city,
                excursion_country=excursion.country,
                excursion_photo=excursion.photos,
                price_per_person=float(excursion.price_per_person),
                total_amount=total_amount,
            )
        )

    if needs_commit:
        await session.commit()

    return bookings_list


@router.post(
    "/bookings/{booking_id}/cancel",
    response_model=BookingWithExcursion,
)
async def cancel_booking(
    booking_id: int,
    user=Depends(current_active_user),
    session: AsyncSession = Depends(get_session),
) -> BookingWithExcursion:
    """
    Отменить бронирование.
    """
    # Получаем профиль клиента
    client_result = await session.execute(
        select(Client).where(Client.user_id == user.id)
    )
    client = client_result.scalar_one_or_none()
    
    if client is None:
        raise HTTPException(
            status_code=404,
            detail="Профиль клиента не найден"
        )
    
    # Получаем бронирование
    booking = await session.get(Booking, booking_id)
    if booking is None:
        raise HTTPException(
            status_code=404,
            detail="Бронирование не найдено"
        )
    
    # Проверяем, что бронирование принадлежит текущему пользователю
    if booking.client_id != client.client_id:
        raise HTTPException(
            status_code=403,
            detail="Нет доступа к этому бронированию"
        )
    
    # Проверяем, что бронирование можно отменить
    if booking.status == "cancelled":
        raise HTTPException(
            status_code=400,
            detail="Бронирование уже отменено"
        )
    
    # Отменяем бронирование
    booking.status = "cancelled"
    await session.commit()
    await session.refresh(booking)
    
    # Получаем информацию об экскурсии
    excursion = await session.get(Excursion, booking.excursion_id)
    if excursion is None:
        raise HTTPException(
            status_code=404,
            detail="Экскурсия не найдена"
        )
    
    total_amount = float(excursion.price_per_person) * booking.number_of_people
    
    return BookingWithExcursion(
        booking_id=booking.booking_id,
        excursion_id=booking.excursion_id,
        date=booking.date,
        number_of_people=booking.number_of_people,
        status=booking.status,
        payment_status=booking.payment_status,
        excursion_title=excursion.title,
        excursion_city=excursion.city,
        excursion_country=excursion.country,
        excursion_photo=excursion.photos,
        price_per_person=float(excursion.price_per_person),
        total_amount=total_amount,
    )


# ── Reviews ──────────────────────────────────────────────────────────────────

@router.get("/excursions/{excursion_id}/can-review")
async def can_review_excursion(
    excursion_id: int,
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_session),
) -> dict:
    user_id = user.id
    client_result = await session.execute(select(Client).where(Client.user_id == user_id))
    client = client_result.scalar_one_or_none()
    if client is None:
        return {"can_review": False}

    now = datetime.now(timezone.utc).replace(tzinfo=None)
    past_booking = await session.execute(
        select(Booking).where(
            Booking.client_id == client.client_id,
            Booking.excursion_id == excursion_id,
            Booking.status.in_(["completed", "confirmed"]),
            Booking.date < now,
        )
    )
    if past_booking.scalar_one_or_none() is None:
        return {"can_review": False}

    existing = await session.execute(
        select(Review).where(
            Review.client_id == client.client_id,
            Review.excursion_id == excursion_id,
        )
    )
    return {
        "can_review": existing.scalar_one_or_none() is None,
    }


@router.post("/reviews", response_model=ReviewRead, status_code=status.HTTP_201_CREATED)
async def submit_review(
    data: ReviewCreate,
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_session),
) -> ReviewRead:
    user_id = user.id
    user_name = user.name  # cache before session commits (avoids DetachedInstanceError)
    client_result = await session.execute(select(Client).where(Client.user_id == user_id))
    client = client_result.scalar_one_or_none()
    if client is None:
        raise HTTPException(status_code=400, detail="У вас нет завершённых бронирований")

    past_booking_result = await session.execute(
        select(Booking).where(
            Booking.client_id == client.client_id,
            Booking.excursion_id == data.excursion_id,
            Booking.status.in_(["completed", "confirmed"]),
            Booking.date < datetime.now(timezone.utc).replace(tzinfo=None),
        )
    )
    if past_booking_result.scalar_one_or_none() is None:
        raise HTTPException(status_code=400, detail="Оставить отзыв можно только после завершения экскурсии")

    existing_result = await session.execute(
        select(Review).where(
            Review.client_id == client.client_id,
            Review.excursion_id == data.excursion_id,
        )
    )
    if existing_result.scalar_one_or_none() is not None:
        raise HTTPException(status_code=400, detail="Вы уже оставили отзыв на эту экскурсию")

    review = Review(
        client_id=client.client_id,
        excursion_id=data.excursion_id,
        rating=data.rating,
        comment=data.comment,
    )
    session.add(review)
    await session.commit()
    await session.refresh(review)
    return ReviewRead(
        review_id=review.review_id,
        rating=review.rating,
        comment=review.comment,
        date=review.date.strftime("%d %B %Y"),
        client_name=user_name,
    )


@router.get("/excursions/{excursion_id}/my-review", response_model=Optional[ReviewRead])
async def get_my_review(
    excursion_id: int,
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_session),
) -> Optional[ReviewRead]:
    user_id = user.id
    user_name = user.name
    client_result = await session.execute(select(Client).where(Client.user_id == user_id))
    client = client_result.scalar_one_or_none()
    if client is None:
        return None
    result = await session.execute(
        select(Review).where(
            Review.client_id == client.client_id,
            Review.excursion_id == excursion_id,
        )
    )
    review = result.scalar_one_or_none()
    if review is None:
        return None
    return ReviewRead(
        review_id=review.review_id,
        rating=review.rating,
        comment=review.comment,
        date=review.date.strftime("%d %B %Y"),
        client_name=user_name,
    )


# ── Favorites ─────────────────────────────────────────────────────────────────

@router.get("/favorites/me", response_model=List[ExcursionCardRead])
async def get_my_favorites(
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_session),
) -> List[ExcursionCardRead]:
    client_result = await session.execute(select(Client).where(Client.user_id == user.id))
    client = client_result.scalar_one_or_none()
    if client is None:
        return []

    fav_result = await session.execute(
        select(Favorite.excursion_id).where(Favorite.client_id == client.client_id)
    )
    excursion_ids = [r for r in fav_result.scalars().all()]
    if not excursion_ids:
        return []

    from src.utils import enrich_excursion_photos
    query = (
        select(
            Excursion,
            User.name.label("guide_name"),
            Guide.photo.label("guide_avatar"),
            Guide.bio.label("guide_bio"),
            func.avg(Review.rating).label("avg_rating"),
            func.count(Review.review_id).label("reviews_count"),
            _guide_avg_subquery().label("guide_avg_rating"),
        )
        .join(Guide, Excursion.guide_id == Guide.guide_id)
        .join(User, Guide.user_id == User.id)
        .outerjoin(Review, Review.excursion_id == Excursion.excursion_id)
        .where(Excursion.excursion_id.in_(excursion_ids))
        .group_by(Excursion.excursion_id, User.name, Guide.photo, Guide.bio, Guide.guide_id)
    )
    result = await session.execute(query)
    rows = result.all()
    return [_build_card(row, enrich_excursion_photos(row.Excursion.photos, row.Excursion.title, row.Excursion.city)) for row in rows]


@router.post("/favorites", status_code=status.HTTP_201_CREATED)
async def add_favorite(
    excursion_id: int,
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_session),
) -> dict:
    client_result = await session.execute(select(Client).where(Client.user_id == user.id))
    client = client_result.scalar_one_or_none()
    if client is None:
        client = Client(user_id=user.id)
        session.add(client)
        await session.flush()

    existing = await session.execute(
        select(Favorite).where(
            Favorite.client_id == client.client_id,
            Favorite.excursion_id == excursion_id,
        )
    )
    if existing.scalar_one_or_none() is not None:
        return {"status": "already_exists"}

    fav = Favorite(client_id=client.client_id, excursion_id=excursion_id)
    session.add(fav)
    await session.commit()
    return {"status": "added"}


@router.delete("/favorites/{excursion_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_favorite(
    excursion_id: int,
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_session),
) -> None:
    client_result = await session.execute(select(Client).where(Client.user_id == user.id))
    client = client_result.scalar_one_or_none()
    if client is None:
        return

    fav_result = await session.execute(
        select(Favorite).where(
            Favorite.client_id == client.client_id,
            Favorite.excursion_id == excursion_id,
        )
    )
    fav = fav_result.scalar_one_or_none()
    if fav:
        await session.delete(fav)
        await session.commit()


@router.get("/favorites/check/{excursion_id}")
async def check_favorite(
    excursion_id: int,
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_session),
) -> dict:
    client_result = await session.execute(select(Client).where(Client.user_id == user.id))
    client = client_result.scalar_one_or_none()
    if client is None:
        return {"is_favorite": False}

    result = await session.execute(
        select(Favorite).where(
            Favorite.client_id == client.client_id,
            Favorite.excursion_id == excursion_id,
        )
    )
    return {"is_favorite": result.scalar_one_or_none() is not None}
