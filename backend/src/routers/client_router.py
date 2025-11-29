from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from src.auth.dependencies import current_user
from src.database.dependencies import get_session
from src.models import Client, Booking
from src.schemas.client import BookingResponse

router = APIRouter()


@router.get("/bookings", response_model=List[BookingResponse])
async def get_bookings(
        user=Depends(current_user),
        session: AsyncSession = Depends(get_session)
):
    try:
        stmt_client = select(Client).where(Client.user_id == user.id)
        result_client = await session.execute(stmt_client)
        client = result_client.scalar_one_or_none()

        if not client:
            return []

        stmt_bookings = (
            select(Booking)
            .options(
                joinedload(Booking.excursion),
                joinedload(Booking.payment)
            )
            .where(Booking.client_id == client.client_id)
            .order_by(Booking.date.desc())
        )

        result_bookings = await session.execute(stmt_bookings)
        bookings = result_bookings.scalars().unique().all()
        return bookings

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка при получении броней: {str(e)}")


