from typing import Optional
from pydantic import BaseModel


class GuideRead(BaseModel):
    guide_id: int
    user_id: int
    photo: Optional[str] = None

    class Config:
        from_attributes = True


class GuideUpdate(BaseModel):
    photo: Optional[str] = None
