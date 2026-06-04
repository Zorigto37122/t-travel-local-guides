import os

from fastapi import Depends
from fastapi_users_db_sqlalchemy import SQLAlchemyUserDatabase
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from src.config import settings
from src.models import User


async_engine = create_async_engine(
    url=settings.DATABASE_URL_asyncpg,
    echo=os.getenv("DB_ECHO", "false").lower() == "true",
)


async_session_factory = async_sessionmaker(async_engine)

async def get_session():
    async with async_session_factory() as session:
        yield session

async def get_user_db(session: AsyncSession = Depends(get_session)):
    yield SQLAlchemyUserDatabase(session, User)