# 1. Клонировать репозиторий
git clone ... 
cd backend

# 2. Создать и активировать venv
python -m venv .venv
.venv\Scripts\activate  # Windows

# 3. Установить зависимости
pip install -r requirements.txt

# 4. Настроить .env и применить миграции
alembic upgrade head