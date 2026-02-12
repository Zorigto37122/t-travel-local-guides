from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class ExcursionBase(BaseModel):
    title: str
    country: str
    city: str
    difficulty: str
    description: Optional[str] = None
    photos: Optional[str] = None
    price_per_person: float
    accepted_payment_methods: str = "online,cash"
    available_slots: Optional[int] = Field(default=None, ge=0)


class ExcursionCreate(ExcursionBase):
    pass


class ExcursionRead(ExcursionBase):
    excursion_id: int
    status: str

    class Config:
        from_attributes = True


class ExcursionSearchFilters(BaseModel):
    country: Optional[str] = None
    city: Optional[str] = None
    date: Optional[datetime] = None
    people: int = Field(default=1, ge=1)
    has_children: bool = False


class BookingBase(BaseModel):
    excursion_id: int
    date: datetime
    number_of_people: int = Field(ge=1)


class BookingCreate(BookingBase):
    has_children: bool = False


class BookingRead(BookingBase):
    booking_id: int
    status: str
    payment_status: str

    class Config:
        from_attributes = True


class BookingWithExcursion(BookingRead):
    excursion_title: str
    excursion_city: str
    excursion_country: str
    excursion_photo: Optional[str] = None
    price_per_person: float
    total_amount: float


class BookingResponse(BaseModel):
    booking: BookingRead
    message: str


class AvailableTimeSlot(BaseModel):
    date: str
    time: str
    available: bool
    available_slots: Optional[int] = None


class AvailableDatesResponse(BaseModel):
    excursion_id: int
    available_slots: Optional[int]
    time_slots: List[AvailableTimeSlot]

