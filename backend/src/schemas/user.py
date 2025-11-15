from typing import Optional

from fastapi_users import schemas


class UserRead(schemas.BaseUser[int]):
    phone: Optional[str]
    name: str


class UserCreate(schemas.BaseUserCreate):
    phone: Optional[str]
    name: str


class UserUpdate(schemas.BaseUserUpdate):
    phone: Optional[str]
    name: str