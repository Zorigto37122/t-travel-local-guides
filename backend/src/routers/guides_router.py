import base64
import re
import uuid
from datetime import datetime
from pathlib import Path
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.auth.auth import fastapi_users
from src.database import get_session
from src.models import (
    Booking,
    Client,
    Excursion,
    ExcursionAvailability,
    ExcursionSlot,
    Guide,
    GuideStatistics,
    Review,
    User,
)
from src.schemas.excursion import (
    AvailabilityRule,
    ExcursionCardRead,
    ExcursionCreate,
    ExcursionRead,
    ExcursionScheduleRead,
    ExcursionScheduleUpdate,
    ExtraSlot,
    ReviewRead,
)
from src.schemas.guide import GuidePublicRead, GuideRead, GuideUpdate
from src.utils import enrich_excursion_photos

router = APIRouter(prefix="/api", tags=["guides"])

current_active_user = fastapi_users.current_user(active=True)

# Папка для фото гидов
GUIDES_ASSETS_DIR = Path(__file__).parent.parent.parent / "assets" / "guides"
GUIDES_ASSETS_DIR.mkdir(parents=True, exist_ok=True)
GUIDES_STATIC_PREFIX = "/static/guides"


async def get_current_guide(
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_session),
) -> Guide:
    """Dependency: получить профиль гида текущего пользователя. 403 если не гид."""
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


def _save_base64_photo(data_url: str) -> str:
    """
    Декодирует base64 data URL, сохраняет файл на диск и возвращает URL.
    Поддерживает jpeg, png, webp, gif.
    """
    match = re.match(r"data:image/(\w+);base64,(.*)", data_url, re.DOTALL)
    if not match:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Неверный формат изображения. Ожидается base64 data URL.",
        )
    ext = match.group(1).lower()
    if ext == "jpeg":
        ext = "jpg"
    raw = match.group(2)
    try:
        img_bytes = base64.b64decode(raw)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Не удалось декодировать изображение.",
        )
    if len(img_bytes) > 7.5 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Размер фотографии слишком большой. Максимум: 7.5 МБ.",
        )
    filename = f"{uuid.uuid4()}.{ext}"
    file_path = GUIDES_ASSETS_DIR / filename
    file_path.write_bytes(img_bytes)
    return f"{GUIDES_STATIC_PREFIX}/{filename}"


@router.get("/guides/me", response_model=GuideRead)
async def get_my_guide_profile(
    guide: Guide = Depends(get_current_guide),
) -> GuideRead:
    return guide


@router.get("/guides/check", tags=["guides"])
async def check_if_guide(
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_session),
) -> dict:
    guide_result = await session.execute(
        select(Guide).where(Guide.user_id == user.id)
    )
    return {"is_guide": guide_result.scalar_one_or_none() is not None}


@router.patch("/guides/me", response_model=GuideRead)
async def update_my_guide_profile(
    data: GuideUpdate,
    guide: Guide = Depends(get_current_guide),
    session: AsyncSession = Depends(get_session),
) -> GuideRead:
    try:
        if data.photo is not None:
            if data.photo.startswith("data:image"):
                # Новое фото как base64 — сохраняем на диск
                guide.photo = _save_base64_photo(data.photo)
            elif data.photo.startswith("/static/"):
                # Уже URL — оставляем как есть
                guide.photo = data.photo
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Неверный формат фотографии.",
                )
        if data.bio is not None:
            guide.bio = data.bio
        if data.experience is not None:
            guide.experience = data.experience

        await session.commit()
        await session.refresh(guide)
        return guide
    except HTTPException:
        raise
    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"Ошибка при обновлении профиля гида: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Ошибка сервера при обновлении профиля. Попробуйте позже.",
        )


@router.get("/guides/me/excursions", response_model=List[ExcursionRead])
async def get_my_excursions(
    guide: Guide = Depends(get_current_guide),
    session: AsyncSession = Depends(get_session),
) -> List[ExcursionRead]:
    excursions_result = await session.execute(
        select(Excursion).where(Excursion.guide_id == guide.guide_id)
        .order_by(Excursion.excursion_id.desc())
    )
    return excursions_result.scalars().all()


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
    excursion = await session.get(Excursion, excursion_id)
    if excursion is None:
        raise HTTPException(status_code=404, detail="Экскурсия не найдена")
    if excursion.guide_id != guide.guide_id:
        raise HTTPException(status_code=403, detail="Нет доступа к этой экскурсии")

    excursion.title = data.title
    excursion.country = data.country
    excursion.city = data.city
    excursion.difficulty = data.difficulty
    excursion.short_description = data.short_description
    excursion.description = data.description
    excursion.photos = data.photos
    excursion.price_per_person = data.price_per_person
    excursion.accepted_payment_methods = data.accepted_payment_methods
    excursion.available_slots = data.available_slots
    excursion.transport = data.transport
    excursion.duration = data.duration
    excursion.price_type = data.price_type

    if excursion.status == "approved":
        excursion.status = "pending_review"

    await session.commit()
    await session.refresh(excursion)
    return excursion


async def _get_owned_excursion(
    excursion_id: int,
    guide: Guide,
    session: AsyncSession,
) -> Excursion:
    excursion = await session.get(Excursion, excursion_id)
    if excursion is None:
        raise HTTPException(status_code=404, detail="Экскурсия не найдена")
    if excursion.guide_id != guide.guide_id:
        raise HTTPException(status_code=403, detail="Нет доступа к этой экскурсии")
    return excursion


@router.get(
    "/guides/me/excursions/{excursion_id}/schedule",
    response_model=ExcursionScheduleRead,
)
async def get_my_excursion_schedule(
    excursion_id: int,
    guide: Guide = Depends(get_current_guide),
    session: AsyncSession = Depends(get_session),
) -> ExcursionScheduleRead:
    await _get_owned_excursion(excursion_id, guide, session)

    rules_result = await session.execute(
        select(ExcursionAvailability)
        .where(ExcursionAvailability.excursion_id == excursion_id)
        .order_by(ExcursionAvailability.weekday, ExcursionAvailability.time)
    )
    rules = rules_result.scalars().all()

    slots_result = await session.execute(
        select(ExcursionSlot)
        .where(ExcursionSlot.excursion_id == excursion_id)
        .order_by(ExcursionSlot.slot_date, ExcursionSlot.time)
    )
    slots = slots_result.scalars().all()

    return ExcursionScheduleRead(
        availability=[
            AvailabilityRule(weekday=r.weekday, time=r.time, capacity=r.capacity)
            for r in rules
        ],
        extra_slots=[
            ExtraSlot(date=s.slot_date, time=s.time, capacity=s.capacity)
            for s in slots
        ],
    )


@router.put(
    "/guides/me/excursions/{excursion_id}/schedule",
    response_model=ExcursionScheduleRead,
)
async def update_my_excursion_schedule(
    excursion_id: int,
    data: ExcursionScheduleUpdate,
    guide: Guide = Depends(get_current_guide),
    session: AsyncSession = Depends(get_session),
) -> ExcursionScheduleRead:
    """Полностью заменить расписание. Не требует повторной модерации."""
    await _get_owned_excursion(excursion_id, guide, session)

    rules_by_key = {(r.weekday, r.time): r for r in data.availability}
    slots_by_key = {(s.date, s.time): s for s in data.extra_slots}

    await session.execute(
        delete(ExcursionAvailability).where(ExcursionAvailability.excursion_id == excursion_id)
    )
    await session.execute(
        delete(ExcursionSlot).where(ExcursionSlot.excursion_id == excursion_id)
    )

    for rule in rules_by_key.values():
        session.add(ExcursionAvailability(
            excursion_id=excursion_id,
            weekday=rule.weekday,
            time=rule.time,
            capacity=rule.capacity,
        ))
    for slot in slots_by_key.values():
        session.add(ExcursionSlot(
            excursion_id=excursion_id,
            slot_date=slot.date,
            time=slot.time,
            capacity=slot.capacity,
        ))

    await session.commit()

    return ExcursionScheduleRead(
        availability=sorted(rules_by_key.values(), key=lambda r: (r.weekday, r.time)),
        extra_slots=sorted(slots_by_key.values(), key=lambda s: (s.date, s.time)),
    )


@router.get("/guides/me/bookings")
async def get_my_bookings_calendar(
    guide: Guide = Depends(get_current_guide),
    session: AsyncSession = Depends(get_session),
) -> List[dict]:
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
    return [
        {
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
        }
        for booking, excursion, client, client_user in result.all()
    ]


@router.get("/guides/{guide_id}", response_model=GuidePublicRead)
async def get_guide_public_profile(
    guide_id: int,
    session: AsyncSession = Depends(get_session),
) -> GuidePublicRead:
    guide_row = await session.execute(
        select(Guide, User.name.label("guide_name"))
        .join(User, Guide.user_id == User.id)
        .where(Guide.guide_id == guide_id)
    )
    row = guide_row.one_or_none()
    if row is None:
        raise HTTPException(status_code=404, detail="Гид не найден")
    guide, guide_name = row.Guide, row.guide_name

    exc_query = (
        select(
            Excursion,
            func.avg(Review.rating).label("avg_rating"),
            func.count(Review.review_id).label("reviews_count"),
        )
        .outerjoin(Review, Review.excursion_id == Excursion.excursion_id)
        .where(Excursion.guide_id == guide_id, Excursion.status == "approved")
        .group_by(Excursion.excursion_id)
    )
    exc_result = await session.execute(exc_query)
    exc_rows = exc_result.all()

    excursions = []
    exc_ids = []
    for r in exc_rows:
        exc = r.Excursion
        exc_ids.append(exc.excursion_id)
        avg = round(float(r.avg_rating), 1) if r.avg_rating else None
        excursions.append(ExcursionCardRead(
            excursion_id=exc.excursion_id,
            title=exc.title,
            country=exc.country,
            city=exc.city,
            difficulty=exc.difficulty,
            description=exc.description,
            photos=enrich_excursion_photos(exc.photos, exc.title, exc.city),
            price_per_person=float(exc.price_per_person),
            price_type=exc.price_type or "per_person",
            accepted_payment_methods=exc.accepted_payment_methods,
            status=exc.status,
            available_slots=exc.available_slots,
            transport=exc.transport,
            duration=exc.duration,
            guide_id=guide_id,
            guide_name=guide_name,
            guide_avatar=guide.photo,
            avg_rating=avg,
            reviews_count=int(r.reviews_count),
            guide_avg_rating=None,
        ))

    reviews = []
    if exc_ids:
        reviews_query = (
            select(Review, User.name.label("client_name"), Excursion.title.label("excursion_title"))
            .join(Client, Review.client_id == Client.client_id)
            .join(User, Client.user_id == User.id)
            .join(Excursion, Review.excursion_id == Excursion.excursion_id)
            .where(Review.excursion_id.in_(exc_ids))
            .order_by(Review.date.desc())
            .limit(50)
        )
        reviews_result = await session.execute(reviews_query)
        reviews = [
            ReviewRead(
                review_id=r.Review.review_id,
                rating=r.Review.rating,
                comment=r.Review.comment,
                date=r.Review.date.strftime("%d %B %Y"),
                client_name=r.client_name,
                excursion_title=r.excursion_title,
            )
            for r in reviews_result.all()
        ]

    total_excursions = len(exc_ids)
    guide_avg = round(sum(r.rating for r in reviews) / len(reviews), 1) if reviews else None

    total_clients = 0
    if exc_ids:
        clients_result = await session.execute(
            select(func.coalesce(func.sum(Booking.number_of_people), 0))
            .where(
                Booking.excursion_id.in_(exc_ids),
                Booking.status == "completed",
            )
        )
        total_clients = int(clients_result.scalar() or 0)

    for ex in excursions:
        ex.guide_avg_rating = guide_avg

    return GuidePublicRead(
        guide_id=guide.guide_id,
        name=guide_name,
        photo=guide.photo,
        bio=guide.bio,
        experience=guide.experience,
        total_excursions=total_excursions,
        total_clients=total_clients,
        average_rating=guide_avg,
        excursions=excursions,
        reviews=reviews,
    )
