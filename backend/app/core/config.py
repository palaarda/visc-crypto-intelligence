from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    APP_NAME: str = "VISC"
    APP_ENV: str = "development"
    DEBUG: bool = True

    # Sensitive values must come from environment / .env (placeholders only here)
    SECRET_KEY: str = "CHANGE_ME"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    DATABASE_URL: str = "postgresql://USER:PASSWORD@localhost:5432/DATABASE"
    REDIS_URL: str = "redis://localhost:6379/0"

    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:3001"]

    FIRST_ADMIN_EMAIL: str = "admin@example.com"
    FIRST_ADMIN_PASSWORD: str = "CHANGE_ME"

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
