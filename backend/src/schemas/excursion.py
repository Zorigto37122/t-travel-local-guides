from datetime import datetime, date
from typing import List, Optional

from pydantic import BaseModel, Field, model_validator


class ExcursionBase(BaseModel):
    title: str
    country: str
    city: str
    difficulty: str
    short_description: Optional[str] = None
    description: Optional[str] = None
    photos: Optional[str] = None
    price_per_person: float
    accepted_payment_methods: str = "online,cash"
    available_slots: Optional[int] = Field(default=None, ge=0)
    transport: Optional[str] = None
    duration: Optional[str] = None
    price_type: Optional[str] = "per_person"


class ExcursionCreate(ExcursionBase):
    pass


class ExcursionUpdate(BaseModel):
    """Схема для частичного обновления экскурсии (все поля опциональны)."""
    title: Optional[str] = None
    country: Optional[str] = None
    city: Optional[str] = None
    difficulty: Optional[str] = None
    short_description: Optional[str] = None
    description: Optional[str] = None
    photos: Optional[str] = None
    price_per_person: Optional[float] = None
    accepted_payment_methods: Optional[str] = None
    available_slots: Optional[int] = Field(default=None, ge=0)
    transport: Optional[str] = None
    duration: Optional[str] = None
    price_type: Optional[str] = None


class ExcursionRead(ExcursionBase):
    excursion_id: int
    status: str

    @model_validator(mode='after')
    def enrich_photos(self):
        from src.utils import enrich_excursion_photos
        self.photos = enrich_excursion_photos(self.photos, self.title, self.city)
        return self

    class Config:
        from_attributes = True


class ExcursionCardRead(ExcursionRead):
    guide_id: Optional[int] = None
    guide_name: Optional[str] = None
    guide_avatar: Optional[str] = None
    guide_bio: Optional[str] = None
    guide_experience: Optional[str] = None
    avg_rating: Optional[float] = None
    reviews_count: int = 0
    guide_avg_rating: Optional[float] = None

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

    @model_validator(mode='after')
    def enrich_excursion_photo(self):
        """Автоматически подставляет фотки для экскурсий с Москвой из assets/excursions"""
        from src.utils import enrich_excursion_photos
        
        # Всегда проверяем возможность обогащения фоток
        enriched_photo = enrich_excursion_photos(self.excursion_photo, self.excursion_title, self.excursion_city)
        self.excursion_photo = enriched_photo
        
        return self


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


class ReviewRead(BaseModel):
    review_id: int
    rating: int
    comment: Optional[str] = None
    date: str
    client_name: str
    excursion_title: Optional[str] = None

    class Config:
        from_attributes = True


class ReviewCreate(BaseModel):
    excursion_id: int
    rating: int = Field(ge=1, le=10)
    comment: Optional[str] = None


# ── Расписание экскурсии (когда гид может её проводить) ──────────────────────

class AvailabilityRule(BaseModel):
    """Повторяющееся недельное правило."""
    weekday: int = Field(ge=0, le=6)  # 0=Пн .. 6=Вс
    time: str = Field(pattern=r"^\d{2}:\d{2}$")
    capacity: Optional[int] = Field(default=None, ge=1)

    class Config:
        from_attributes = True


class ExtraSlot(BaseModel):
    """Разовая дата+время."""
    date: date
    time: str = Field(pattern=r"^\d{2}:\d{2}$")
    capacity: Optional[int] = Field(default=None, ge=1)

    class Config:
        from_attributes = True


class ExcursionScheduleRead(BaseModel):
    availability: List[AvailabilityRule] = []
    extra_slots: List[ExtraSlot] = []


class ExcursionScheduleUpdate(BaseModel):
    """Полная замена расписания экскурсии."""
    availability: List[AvailabilityRule] = []
    extra_slots: List[ExtraSlot] = []

