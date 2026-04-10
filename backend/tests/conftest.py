from __future__ import annotations

import os
from typing import AsyncIterator, Generator

import pytest
from httpx import ASGITransport, AsyncClient


def _ensure_jwt_keys() -> None:
    jwt_private = os.getenv("JWT_PRIVATE_KEY", "")
    jwt_public = os.getenv("JWT_PUBLIC_KEY", "")

    if jwt_private and jwt_public:
        return

    try:
        from cryptography.hazmat.primitives import serialization
        from cryptography.hazmat.primitives.asymmetric import rsa
    except Exception as e:  # pragma: no cover
        raise RuntimeError("cryptography is required to generate ephemeral JWT keys") from e

    private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    private_pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption(),
    ).decode("utf-8")
    public_pem = private_key.public_key().public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo,
    ).decode("utf-8")

    os.environ["JWT_PRIVATE_KEY"] = private_pem
    os.environ["JWT_PUBLIC_KEY"] = public_pem


_ensure_jwt_keys()


@pytest.fixture(scope="session")
def app_settings() -> Generator[None, None, None]:
    # Settings are read from environment when app is created.
    yield None


@pytest.fixture(scope="session", autouse=True)
async def prepare_db(app_settings):
    # Ensure engine and sessionmaker are fresh for the test session
    from app.db import session as db_session
    db_session._engine.cache_clear()
    db_session._sessionmaker.cache_clear()
    
    # Import after env is ready and after alembic upgrade has already run in CI.
    # from app.scripts.seed_demo_data import seed as seed_fn
    # await seed_fn()
    pass


@pytest.fixture(scope="session")
def app():
    # Import after env is prepared so cached Settings includes JWT keys.
    from app.main import create_app
    return create_app()


@pytest.fixture
async def client(app) -> AsyncIterator[AsyncClient]:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
