from typing import List, Optional
from pydantic import BaseModel


class GuideRead(BaseModel):
    guide_id: int
    user_id: int
    photo: Optional[str] = None
    bio: Optional[str] = None
    experience: Optional[str] = None

    class Config:
        from_attributes = True


class GuideUpdate(BaseModel):
    photo: Optional[str] = None
    bio: Optional[str] = None
    experience: Optional[str] = None


class GuidePublicRead(BaseModel):
    guide_id: int
    name: str
    photo: Optional[str] = None
    bio: Optional[str] = None
    experience: Optional[str] = None
    total_excursions: int = 0
    total_clients: int = 0
    average_rating: Optional[float] = None
    excursions: List = []
    reviews: List = []

    class Config:
        from_attributes = True
