from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from src.config import settings
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from fastapi import Depends
from fastapi_users_db_sqlalchemy import SQLAlchemyUserDatabase
from src.models import User


async_engine = create_async_engine(
    url=settings.DATABASE_URL_asyncpg,
    echo=True,
    
)


async_session_factory = async_sessionmaker(async_engine)

async def get_session():
    async with async_session_factory() as session:
        yield session

async def get_user_db(session: AsyncSession = Depends(get_session)):
    yield SQLAlchemyUserDatabase(session, User)