"""
Скрипт для установки прав администратора пользователю.
Использование:
    python -m scripts.make_admin <email>
"""
import asyncio
import sys
import os
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

# Добавляем путь к корню проекта
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.config import settings
from src.models import User, Base


async def make_user_admin(email: str):
    """Устанавливает is_superuser=True для пользователя с указанным email."""
    # Создаем движок и сессию для скрипта
    engine = create_async_engine(
        settings.DATABASE_URL_asyncpg,
        echo=False,
    )
    
    async_session = async_sessionmaker(engine, expire_on_commit=False)
    
    try:
        async with async_session() as session:
            # Находим пользователя по email
            result = await session.execute(
                select(User).where(User.email == email)
            )
            user = result.scalar_one_or_none()
            
            if not user:
                print(f"❌ Пользователь с email '{email}' не найден")
                return False
            
            # Устанавливаем is_superuser = True
            await session.execute(
                update(User).where(User.id == user.id).values(is_superuser=True)
            )
            await session.commit()
            
            print(f"✅ Пользователь {email} (ID: {user.id}) теперь администратор")
            return True
            
    except Exception as e:
        print(f"❌ Ошибка: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        await engine.dispose()


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Использование: python -m scripts.make_admin <email>")
        print("Пример: python -m scripts.make_admin admin@example.com")
        sys.exit(1)
    
    email = sys.argv[1]
    asyncio.run(make_user_admin(email))
