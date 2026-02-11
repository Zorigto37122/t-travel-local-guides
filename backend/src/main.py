import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.routers.auth_router import router as auth_router
from src.routers.excursions_router import router as excursions_router

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


if __name__ == "__main__":
    uvicorn.run(
        "src.main:app",
        reload=True,
    )