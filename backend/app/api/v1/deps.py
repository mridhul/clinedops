from __future__ import annotations

from typing import AsyncGenerator, Iterable

from fastapi import Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.fastapi_users_setup import current_active_user
from app.db.session import get_db_session
from app.db.models import User
from app.db.models.enums import RoleEnum


# Re-export for routers that import get_db
get_db = get_db_session


# Reuse FastAPI-Users dependency for extracting/validating JWTs.
get_current_user = current_active_user


def _user_role_string(user: User) -> str:
    """Normalize role from ORM (str column or enum) for RBAC checks."""
    r = user.role
    if isinstance(r, RoleEnum):
        return r.value
    if r is None:
        return ""
    return str(r).strip().lower()


def require_roles(allowed_roles: Iterable[RoleEnum]):
    allowed_values = {role.value for role in allowed_roles}

    async def _dependency(user: User = Depends(get_current_user)) -> User:
        user_role_value = _user_role_string(user)
        if user_role_value not in allowed_values:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
        return user

    return _dependency


def permission_dependency(required_roles: Iterable[RoleEnum]):
    """Alias to match the project’s 'permission checking decorator' intent."""
    return require_roles(required_roles)

