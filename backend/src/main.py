import uvicorn
from fastapi import FastAPI

from src.routers.client_router import router as client_router
from src.routers.auth_router import router as auth_router


app = FastAPI()

app.include_router(auth_router)
app.include_router(client_router, prefix="/client", tags=["client"])


if __name__ == "__main__":
    uvicorn.run(
        "src.main:app",
        reload=True,
    )