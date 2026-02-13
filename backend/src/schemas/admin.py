from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel

from src.schemas.user import UserRead, UserUpdate
from src.schemas.excursion import ExcursionRead, ExcursionCreate
from src.schemas.guide import GuideRead


class AdminUserRead(UserRead):
    """Расширенная схема пользователя для админ-панели"""
    is_superuser: bool
    is_active: bool
    is_verified: bool


class AdminUserUpdate(UserUpdate):
    """Схема обновления пользователя для админ-панели"""
    is_superuser: Optional[bool] = None
    is_active: Optional[bool] = None
    is_verified: Optional[bool] = None
    is_guide: Optional[bool] = None


class AdminGuideRead(GuideRead):
    """Расширенная схема гида для админ-панели"""
    user: AdminUserRead


class AdminGuideWithUser(BaseModel):
    """Схема гида с информацией о пользователе"""
    guide_id: int
    user_id: int
    photo: Optional[str] = None
    user_name: str
    user_email: str
    user_phone: Optional[str] = None
    is_guide_approved: bool  # True если есть запись в таблице guides
    
    class Config:
        from_attributes = True


class AdminBookingRead(BaseModel):
    """Схема бронирования для админ-панели"""
    booking_id: int
    date: datetime
    number_of_people: int
    status: str
    payment_status: str
    excursion_id: int
    excursion_title: str
    client_id: int
    client_name: str
    client_email: str
    total_amount: float
    
    class Config:
        from_attributes = True


class GuideApprovalRequest(BaseModel):
    """Схема для одобрения/отклонения гида"""
    approved: bool
    reason: Optional[str] = None
