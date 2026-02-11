# backend/app/core/config.py

from functools import lru_cache
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "Smart Job Application Tracker"

    # Environment
    DEBUG: bool = False

    # Database
    DATABASE_URL = "postgresql+psycopg2://<user>:<password>@localhost:5432/smart_job_tracker"

    # JWT
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    class Config:
        env_file = ".env"
        extra = "ignore"



@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
