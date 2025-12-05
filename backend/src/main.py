import uvicorn
from fastapi import FastAPI

from src.routers.auth_router import router as auth_router

app = FastAPI()

app.include_router(auth_router)


if __name__ == "__main__":
    uvicorn.run(
        "src.main:app",
        reload=True,
    )