from __future__ import annotations

from collections.abc import AsyncGenerator
from typing import Any, cast
from uuid import UUID

from fastapi import Depends
from fastapi_users import BaseUserManager, FastAPIUsers, UUIDIDMixin
from fastapi_users.authentication import AuthenticationBackend, BearerTransport, JWTStrategy
from fastapi_users.db import SQLAlchemyUserDatabase
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.db.models import User
from app.db.session import get_db_session


class UserManager(UUIDIDMixin, BaseUserManager[Any, UUID]):
    # Required by BaseUserManager. The current scaffolding uses its own
    # password reset tokens, but FastAPI-Users still needs these secrets
    # for initialization.
    reset_password_token_secret = "clinedops-reset-dev"
    verification_token_secret = "clinedops-verify-dev"


async def get_user_db(session: AsyncSession = Depends(get_db_session)) -> AsyncGenerator[SQLAlchemyUserDatabase, None]:
    yield cast(SQLAlchemyUserDatabase, SQLAlchemyUserDatabase(session, User))


async def get_user_manager(
    user_db: SQLAlchemyUserDatabase = Depends(get_user_db),
) -> AsyncGenerator[UserManager, None]:
    yield UserManager(user_db)


def get_jwt_strategy() -> JWTStrategy:
    settings = get_settings()
    return JWTStrategy(
        secret=settings.jwt_private_key,
        public_key=settings.jwt_public_key,
        algorithm="RS256",
        lifetime_seconds=settings.access_token_ttl_minutes * 60,
        token_audience=[settings.jwt_audience],
    )


bearer_transport = BearerTransport(tokenUrl="/api/v1/auth/login")
auth_backend = AuthenticationBackend(
    name="jwt",
    transport=bearer_transport,
    get_strategy=get_jwt_strategy,
)


# Avoid over-constraining FastAPI-Users generics; we only need `current_user()`.
fastapi_users = FastAPIUsers(get_user_manager, [auth_backend])

# Dependency factory used throughout the app (returns 401 for missing/invalid token).
current_active_user = fastapi_users.current_user(active=True)

