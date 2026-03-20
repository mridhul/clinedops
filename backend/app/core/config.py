from __future__ import annotations

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=None, extra="ignore")

    database_url: str
    redis_url: str = "redis://redis:6379/0"

    frontend_origin: str = "http://localhost:3000"
    api_prefix: str = "/api/v1"

    jwt_issuer: str = "clinedops"
    jwt_audience: str = "clinedops"
    access_token_ttl_minutes: int = 15
    refresh_token_ttl_days: int = 7

    jwt_private_key: str = ""
    jwt_public_key: str = ""

    celery_broker_url: str = "redis://redis:6379/0"
    celery_result_backend: str = "redis://redis:6379/0"

@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()

