from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class ExcursionInBooking(BaseModel):
    excursion_id: int
    title: str
    country: str
    price_per_person: float

    model_config = ConfigDict(from_attributes=True)


class PaymentInBooking(BaseModel):
    id: int
    amount: float
    payment_method: str
    transaction_id: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class BookingResponse(BaseModel):
    booking_id: int
    date: datetime
    number_of_people: int
    status: str
    payment_status: str

    excursion: ExcursionInBooking
    payment: PaymentInBooking

    model_config = ConfigDict(from_attributes=True)


class BookingInNot(BaseModel):
    booking_id: int
    date: datetime
    number_of_people: int
    status: str
    payment_status: str

    model_config = ConfigDict(from_attributes=True)


class NotResponse(BaseModel):
    notification_id: int
    receiver: str
    message: str
    date: datetime
    type: str

    booking: BookingInNot

    model_config = ConfigDict(from_attributes=True)
