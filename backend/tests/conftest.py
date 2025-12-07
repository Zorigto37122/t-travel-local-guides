# tests/conftest.py
import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.pool import StaticPool

from src.main import app
from src.database import get_session
from src.models import Base

# Настраиваем anyio бэкенд
@pytest.fixture
def anyio_backend():
    return 'asyncio'

# Тестовая база данных (SQLite в памяти)
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

@pytest.fixture(scope="function")
async def engine():
    """Создаем тестовый движок базы данных."""
    engine = create_async_engine(
        TEST_DATABASE_URL,
        poolclass=StaticPool,
        connect_args={"check_same_thread": False}
    )
    
    # Создаем все таблицы
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    yield engine
    
    # Удаляем все таблицы после тестов
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    
    await engine.dispose()

@pytest.fixture(scope="function")
async def session(engine):
    """Создаем тестовую сессию."""
    async_session = async_sessionmaker(
        engine,
        expire_on_commit=False,
        class_=AsyncSession
    )
    
    async with async_session() as session:
        yield session

@pytest.fixture(scope="function")
async def client(session):
    """Создаем асинхронный клиент для тестов по документации FastAPI."""

    async def override_get_session():
        yield session
    
    
    original_get_session = app.dependency_overrides.get(get_session)
    

    app.dependency_overrides[get_session] = override_get_session
    
    
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test"
    ) as ac:
        yield ac
    
    if original_get_session:
        app.dependency_overrides[get_session] = original_get_session
    else:
        app.dependency_overrides.pop(get_session, None)

@pytest.fixture(scope="function")
async def test_user(session):
    """Создаем тестового пользователя."""
    from src.models import User
    from passlib.context import CryptContext
    

    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    hashed_password = pwd_context.hash("testpassword123")
    
    user = User(
        email="test@example.com",
        name="Test User",
        phone="+1234567890",
        hashed_password=hashed_password,
        is_active=True,
        is_superuser=False,
        is_verified=True
    )
    
    session.add(user)
    await session.commit()
    await session.refresh(user)
    
    return user

@pytest.fixture(scope="function")
async def auth_headers(client, test_user):
    """Получаем токен авторизации и возвращаем headers."""

    login_data = {
        "username": test_user.email,
        "password": "testpassword123"
    }
    
    response = await client.post("/auth/jwt/login", data=login_data)
    

    if response.status_code != 200:
        print(f"DEBUG: Login failed with status {response.status_code}")
        print(f"DEBUG: Response: {response.text}")
    
    assert response.status_code == 200, f"Login failed: {response.text}"
    
    token = response.json()["access_token"]
    
    return {"Authorization": f"Bearer {token}"}