from fastapi import APIRouter
from app.api.v1.endpoints import auth, users, signals, statistics

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(signals.router, prefix="/signals", tags=["Signals"])
api_router.include_router(statistics.router, prefix="/statistics", tags=["Statistics"])
