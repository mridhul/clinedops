from __future__ import annotations

from functools import lru_cache

from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

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

    # AWS
    aws_access_key_id: Optional[str] = None
    aws_secret_access_key: Optional[str] = None
    aws_region: str = "ap-southeast-1"
    s3_bucket: Optional[str] = None
    ses_sender_email: str = "notifications@clinedops.com"

Settings.model_rebuild()

@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()

