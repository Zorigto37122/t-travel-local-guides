import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.routers.auth_router import router as auth_router
from src.routers.excursions_router import router as excursions_router
from src.routers.guides_router import router as guides_router
from src.routers.admin_router import router as admin_router

app = FastAPI()

# CORS для взаимодействия с фронтендом
# Разрешаем запросы с любого origin, так как авторизация идет через Bearer-токен
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(excursions_router)
app.include_router(guides_router)
app.include_router(admin_router)


if __name__ == "__main__":
    uvicorn.run(
        "src.main:app",
        reload=True,
        # Увеличиваем лимит размера тела запроса до 50MB для загрузки изображений
        limit_max_requests=1000,
        limit_concurrency=1000,
    )