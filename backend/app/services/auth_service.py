from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_jwt, hash_password, decode_jwt, verify_password
from app.core.stores import clear_current_refresh_jti, create_reset_token, get_current_refresh_jti, pop_valid_reset_token, set_current_refresh_jti
from app.db.models import User
from app.db.models.enums import DisciplineEnum, RoleEnum


@dataclass(frozen=True)
class LoginResult:
    access_token: str
    refresh_token: str
    role: RoleEnum
    discipline: Optional[DisciplineEnum]


async def login(session: AsyncSession, *, email: str, password: str) -> LoginResult:
    result = await session.execute(select(User).where(User.email == email, User.is_active.is_(True)))
    user = result.scalar_one_or_none()
    if user is None or not verify_password(password, user.hashed_password):
        raise ValueError("Invalid credentials")

    access_token, _access_jti = create_jwt(
        "access",
        user_id=user.id,
        role=user.role,
        discipline=user.discipline,
    )
    refresh_token, refresh_jti = create_jwt(
        "refresh",
        user_id=user.id,
        role=user.role,
        discipline=user.discipline,
    )
    set_current_refresh_jti(user.id, refresh_jti)

    return LoginResult(
        access_token=access_token,
        refresh_token=refresh_token,
        role=RoleEnum(user.role),
        discipline=DisciplineEnum(user.discipline) if user.discipline else None,
    )


async def get_me(session: AsyncSession, *, user: User) -> User:
    return user


async def refresh_access_token(*, session: AsyncSession, refresh_token: str) -> LoginResult:
    decoded = decode_jwt(refresh_token, expected_type="refresh")
    expected_jti = get_current_refresh_jti(decoded.user_id)
    if expected_jti is None or expected_jti != decoded.jti:
        raise ValueError("Refresh token revoked")

    result = await session.execute(select(User).where(User.id == decoded.user_id, User.is_active.is_(True)))
    user = result.scalar_one_or_none()
    if user is None:
        raise ValueError("Invalid refresh token")

    access_token, _access_jti = create_jwt(
        "access",
        user_id=user.id,
        role=user.role,
        discipline=user.discipline,
    )
    refresh_token_new, refresh_jti_new = create_jwt(
        "refresh",
        user_id=user.id,
        role=user.role,
        discipline=user.discipline,
    )
    set_current_refresh_jti(user.id, refresh_jti_new)

    return LoginResult(
        access_token=access_token,
        refresh_token=refresh_token_new,
        role=RoleEnum(user.role),
        discipline=DisciplineEnum(user.discipline) if user.discipline else None,
    )


async def logout(*, session: AsyncSession, user: Optional[User]) -> None:
    if user is None:
        return
    clear_current_refresh_jti(user.id)


async def forgot_password(session: AsyncSession, *, email: str, expires_in_seconds: int) -> str:
    result = await session.execute(select(User).where(User.email == email, User.is_active.is_(True)))
    user = result.scalar_one_or_none()
    if user is None:
        # Do not leak existence; return a generic token string for dev/testing.
        return ""

    return create_reset_token(user.id, expires_in_seconds)


async def reset_password(session: AsyncSession, *, token: str, new_password: str) -> None:
    user_id = pop_valid_reset_token(token)
    if user_id is None:
        raise ValueError("Invalid reset token")

    result = await session.execute(select(User).where(User.id == user_id, User.is_active.is_(True)))
    user = result.scalar_one_or_none()
    if user is None:
        raise ValueError("Invalid reset token")

    user.hashed_password = hash_password(new_password)
    session.add(user)

