from typing import List, Optional
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.auth.auth import fastapi_users
from src.database import get_session
from src.models import User, Guide, Excursion, Booking, Client
from src.schemas.admin import (
    AdminUserRead,
    AdminUserUpdate,
    AdminGuideWithUser,
    AdminBookingRead,
    GuideApprovalRequest,
)
from src.schemas.excursion import ExcursionRead, ExcursionCreate
from src.schemas.guide import GuideRead

router = APIRouter(prefix="/api/admin", tags=["admin"])

current_active_superuser = fastapi_users.current_user(active=True, superuser=True)


# ========== USERS ==========

@router.get("/users", response_model=List[AdminUserRead])
async def list_all_users(
    user: User = Depends(current_active_superuser),
    session: AsyncSession = Depends(get_session),
    skip: int = 0,
    limit: int = 100,
) -> List[AdminUserRead]:
    """Получить список всех пользователей"""
    result = await session.execute(
        select(User).offset(skip).limit(limit).order_by(User.id.desc())
    )
    users = result.scalars().all()
    return users


@router.get("/users/{user_id}", response_model=AdminUserRead)
async def get_user(
    user_id: int,
    admin_user: User = Depends(current_active_superuser),
    session: AsyncSession = Depends(get_session),
) -> AdminUserRead:
    """Получить пользователя по ID"""
    user = await session.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    return user


@router.patch("/users/{user_id}", response_model=AdminUserRead)
async def update_user(
    user_id: int,
    data: AdminUserUpdate,
    admin_user: User = Depends(current_active_superuser),
    session: AsyncSession = Depends(get_session),
) -> AdminUserRead:
    """Обновить пользователя"""
    user = await session.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    
    # Обновляем поля
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if value is not None:
            setattr(user, field, value)
    
    await session.commit()
    await session.refresh(user)
    return user


# ========== GUIDES ==========

@router.get("/guides", response_model=List[AdminGuideWithUser])
async def list_all_guides(
    admin_user: User = Depends(current_active_superuser),
    session: AsyncSession = Depends(get_session),
) -> List[AdminGuideWithUser]:
    """Получить список всех гидов с информацией о пользователях"""
    result = await session.execute(
        select(Guide, User)
        .join(User, Guide.user_id == User.id)
        .order_by(Guide.guide_id.desc())
    )
    guides_data = result.all()
    
    guides_list = []
    for guide, user in guides_data:
        guides_list.append(AdminGuideWithUser(
            guide_id=guide.guide_id,
            user_id=guide.user_id,
            photo=guide.photo,
            user_name=user.name,
            user_email=user.email,
            user_phone=user.phone,
            is_guide_approved=True,
        ))
    
    return guides_list


@router.get("/guides/pending", response_model=List[AdminGuideWithUser])
async def list_pending_guides(
    admin_user: User = Depends(current_active_superuser),
    session: AsyncSession = Depends(get_session),
) -> List[AdminGuideWithUser]:
    """Получить список пользователей, ожидающих одобрения как гиды"""
    # Находим пользователей с is_guide=True, но без записи в таблице guides
    users_result = await session.execute(
        select(User).where(User.is_guide == True)
    )
    all_guide_users = users_result.scalars().all()
    
    # Получаем всех одобренных гидов
    guides_result = await session.execute(select(Guide))
    approved_guides = {g.user_id for g in guides_result.scalars().all()}
    
    # Фильтруем тех, кто еще не одобрен
    pending_users = [u for u in all_guide_users if u.id not in approved_guides]
    
    pending_list = []
    for user in pending_users:
        pending_list.append(AdminGuideWithUser(
            guide_id=0,  # Временный ID, так как записи еще нет
            user_id=user.id,
            photo=None,
            user_name=user.name,
            user_email=user.email,
            user_phone=user.phone,
            is_guide_approved=False,
        ))
    
    return pending_list


@router.post("/guides/{user_id}/approve")
async def approve_guide(
    user_id: int,
    request: GuideApprovalRequest,
    admin_user: User = Depends(current_active_superuser),
    session: AsyncSession = Depends(get_session),
):
    """Одобрить или отклонить заявку гида"""
    user = await session.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    
    if request.approved:
        # Проверяем, есть ли уже запись в guides
        guide_result = await session.execute(
            select(Guide).where(Guide.user_id == user_id)
        )
        guide = guide_result.scalar_one_or_none()
        
        if guide is None:
            # Создаем запись гида
            guide = Guide(user_id=user_id)
            session.add(guide)
            await session.flush()
        
        # Убеждаемся, что is_guide=True
        user.is_guide = True
        await session.commit()
        await session.refresh(guide)
        return {"success": True, "message": "Гид одобрен", "guide": guide}
    else:
        # Отклоняем заявку - убираем is_guide
        user.is_guide = False
        # Удаляем запись из guides, если она есть
        guide_result = await session.execute(
            select(Guide).where(Guide.user_id == user_id)
        )
        guide = guide_result.scalar_one_or_none()
        if guide:
            await session.delete(guide)
        
        await session.commit()
        return {
            "success": True,
            "message": f"Заявка гида отклонена. Причина: {request.reason or 'Не указана'}"
        }


@router.get("/guides/{guide_id}", response_model=AdminGuideWithUser)
async def get_guide(
    guide_id: int,
    admin_user: User = Depends(current_active_superuser),
    session: AsyncSession = Depends(get_session),
) -> AdminGuideWithUser:
    """Получить гида по ID"""
    guide_result = await session.execute(
        select(Guide, User)
        .join(User, Guide.user_id == User.id)
        .where(Guide.guide_id == guide_id)
    )
    result = guide_result.first()
    
    if result is None:
        raise HTTPException(status_code=404, detail="Гид не найден")
    
    guide, user = result
    return AdminGuideWithUser(
        guide_id=guide.guide_id,
        user_id=guide.user_id,
        photo=guide.photo,
        user_name=user.name,
        user_email=user.email,
        user_phone=user.phone,
        is_guide_approved=True,
    )


# ========== EXCURSIONS ==========

@router.get("/excursions", response_model=List[ExcursionRead])
async def list_all_excursions(
    admin_user: User = Depends(current_active_superuser),
    session: AsyncSession = Depends(get_session),
    status_filter: Optional[str] = None,
) -> List[ExcursionRead]:
    """Получить список всех экскурсий (включая pending_review)"""
    query = select(Excursion).order_by(Excursion.excursion_id.desc())
    
    if status_filter:
        query = query.where(Excursion.status == status_filter)
    
    result = await session.execute(query)
    excursions = result.scalars().all()
    return excursions


@router.get("/excursions/{excursion_id}", response_model=ExcursionRead)
async def get_excursion(
    excursion_id: int,
    admin_user: User = Depends(current_active_superuser),
    session: AsyncSession = Depends(get_session),
) -> ExcursionRead:
    """Получить экскурсию по ID"""
    excursion = await session.get(Excursion, excursion_id)
    if excursion is None:
        raise HTTPException(status_code=404, detail="Экскурсия не найдена")
    return excursion


@router.patch("/excursions/{excursion_id}", response_model=ExcursionRead)
async def update_excursion(
    excursion_id: int,
    data: ExcursionCreate,
    admin_user: User = Depends(current_active_superuser),
    session: AsyncSession = Depends(get_session),
) -> ExcursionRead:
    """Обновить экскурсию"""
    excursion = await session.get(Excursion, excursion_id)
    if excursion is None:
        raise HTTPException(status_code=404, detail="Экскурсия не найдена")
    
    # Обновляем поля
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(excursion, field, value)
    
    await session.commit()
    await session.refresh(excursion)
    return excursion


@router.delete("/excursions/{excursion_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_excursion(
    excursion_id: int,
    admin_user: User = Depends(current_active_superuser),
    session: AsyncSession = Depends(get_session),
):
    """Удалить экскурсию"""
    excursion = await session.get(Excursion, excursion_id)
    if excursion is None:
        raise HTTPException(status_code=404, detail="Экскурсия не найдена")
    
    await session.delete(excursion)
    await session.commit()
    return None


# ========== BOOKINGS ==========

@router.get("/bookings", response_model=List[AdminBookingRead])
async def list_all_bookings(
    admin_user: User = Depends(current_active_superuser),
    session: AsyncSession = Depends(get_session),
) -> List[AdminBookingRead]:
    """Получить список всех бронирований"""
    result = await session.execute(
        select(Booking, Excursion, Client, User)
        .join(Excursion, Booking.excursion_id == Excursion.excursion_id)
        .join(Client, Booking.client_id == Client.client_id)
        .join(User, Client.user_id == User.id)
        .order_by(Booking.date.desc())
    )
    bookings_data = result.all()
    
    bookings_list = []
    for booking, excursion, client, client_user in bookings_data:
        total_amount = float(excursion.price_per_person) * booking.number_of_people
        bookings_list.append(AdminBookingRead(
            booking_id=booking.booking_id,
            date=booking.date,
            number_of_people=booking.number_of_people,
            status=booking.status,
            payment_status=booking.payment_status,
            excursion_id=booking.excursion_id,
            excursion_title=excursion.title,
            client_id=client.client_id,
            client_name=client_user.name,
            client_email=client_user.email,
            total_amount=total_amount,
        ))
    
    return bookings_list


@router.get("/bookings/{booking_id}", response_model=AdminBookingRead)
async def get_booking(
    booking_id: int,
    admin_user: User = Depends(current_active_superuser),
    session: AsyncSession = Depends(get_session),
) -> AdminBookingRead:
    """Получить бронирование по ID"""
    result = await session.execute(
        select(Booking, Excursion, Client, User)
        .join(Excursion, Booking.excursion_id == Excursion.excursion_id)
        .join(Client, Booking.client_id == Client.client_id)
        .join(User, Client.user_id == User.id)
        .where(Booking.booking_id == booking_id)
    )
    booking_data = result.first()
    
    if booking_data is None:
        raise HTTPException(status_code=404, detail="Бронирование не найдено")
    
    booking, excursion, client, client_user = booking_data
    total_amount = float(excursion.price_per_person) * booking.number_of_people
    
    return AdminBookingRead(
        booking_id=booking.booking_id,
        date=booking.date,
        number_of_people=booking.number_of_people,
        status=booking.status,
        payment_status=booking.payment_status,
        excursion_id=booking.excursion_id,
        excursion_title=excursion.title,
        client_id=client.client_id,
        client_name=client_user.name,
        client_email=client_user.email,
        total_amount=total_amount,
    )
