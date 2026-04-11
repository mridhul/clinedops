from __future__ import annotations

from pathlib import Path
from typing import Optional

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# backend/.env — stable path whether cwd is backend/ or /app (Docker).
_BACKEND_ROOT = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(_BACKEND_ROOT / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

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

    # AI Help (RAG + Groq)
    groq_api_key: Optional[str] = None
    groq_model: str = "llama-3.3-70b-versatile"
    # Source folder (.md/.pdf) for index builds; see app.scripts.build_rag_index.
    # In Docker this is /RAG; locally override via RAG_DOCS_PATH in backend/.env.
    rag_docs_path: str = "/RAG"
    rag_index_path: str = "/rag_data"
    rag_retrieval_k: int = 4

    @field_validator("groq_api_key", mode="before")
    @classmethod
    def empty_groq_key_to_none(cls, v: object) -> object:
        if isinstance(v, str):
            v = v.strip()
        if v == "":
            return None
        return v

Settings.model_rebuild()


def get_settings() -> Settings:
    # No LRU cache: env (e.g. GROQ_API_KEY) must re-read after .env / container updates without a stale snapshot.
    return Settings()

