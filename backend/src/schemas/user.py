from typing import Annotated
import re

from fastapi_users import schemas
from pydantic import Field, field_validator, EmailStr


class UserRead(schemas.BaseUser[int]):
    phone: str | None = None
    name: str


class UserCreate(schemas.BaseUserCreate):
    phone: Annotated[str | None, Field(min_length=10, max_length=20, pattern=r'^\+[1-9]\d{1,14}$',
                                       examples=["+79991234567"])] = None
    name:  Annotated[str, Field(min_length=2, max_length=50, examples=["Иван Иванов"])]
    
    
    
    @field_validator('password')
    @classmethod 
    def validate_password_create(cls, v: str) -> str:
        """Валидация пароля при регистрации."""
        if len(v) < 8:
            raise ValueError('Пароль должен содержать минимум 8 символов')
        
    
        if not re.search(r'[A-Z]', v):
            raise ValueError('Пароль должен содержать заглавную букву')
        if not re.search(r'[a-z]', v):
            raise ValueError('Пароль должен содержать строчную букву')
        if not re.search(r'\d', v):
            raise ValueError('Пароль должен содержать цифру')
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', v):
            raise ValueError('Пароль должен содержать специальный символ')
        
        return v


class UserUpdate(schemas.BaseUserUpdate):
    phone: Annotated[str | None, Field(min_length=10, max_length=20, pattern = r'^\+[1-9]\d{1,14}$',
                                       examples=["+79991234567"])] = None
    name:  Annotated[str , Field(min_length=2, max_length=50, examples=["Иван Иванов"])] = None
    
    
    
    
    
    
    @field_validator('password')
    @classmethod  
    def validate_password_update(cls, v: str | None) -> str | None:
        """
        Валидация пароля при обновлении.
        Пароль может быть None (не меняем) или строкой >= 8 символов.
        """
        if v is None:
            return None
        
        if len(v) < 8:
            raise ValueError('Пароль должен содержать минимум 8 символов')
        
        if not re.search(r'[A-Z]', v):
            raise ValueError('Пароль должен содержать заглавную букву')
        if not re.search(r'[a-z]', v):
            raise ValueError('Пароль должен содержать строчную букву')
        if not re.search(r'\d', v):
            raise ValueError('Пароль должен содержать цифру')
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', v):
            raise ValueError('Пароль должен содержать специальный символ')
        
        return v
    
    @field_validator('email')
    @classmethod
    def reject_null_email(cls, v: EmailStr | None) -> EmailStr:
        """Запрещаем null для email."""
        if v is None:
            raise ValueError('Email нельзя поменять на null')
        return v