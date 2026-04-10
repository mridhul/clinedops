from __future__ import annotations

from collections.abc import AsyncGenerator
from functools import lru_cache

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import get_settings


import os

@lru_cache(maxsize=1)
def _engine():
    settings = get_settings()
    return create_async_engine(settings.database_url, pool_pre_ping=True)


@lru_cache(maxsize=1)
def _sessionmaker():
    return async_sessionmaker(_engine(), expire_on_commit=False, autoflush=False)


def get_engine():
    if os.getenv("TESTING"):
        settings = get_settings()
        return create_async_engine(settings.database_url, pool_pre_ping=True)
    return _engine()


def get_sessionmaker():
    if os.getenv("TESTING"):
        return async_sessionmaker(get_engine(), expire_on_commit=False, autoflush=False)
    return _sessionmaker()


def async_session_factory():
    return get_sessionmaker()()


async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    async_session = get_sessionmaker()
    async with async_session() as session:
        yield session

