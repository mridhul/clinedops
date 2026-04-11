from __future__ import annotations

from typing import Callable, Optional, TypeVar

from sqlalchemy import ColumnElement
from sqlalchemy.sql import Select

from app.db.models import User
from app.db.models.enums import RoleEnum


T = TypeVar("T", bound=tuple[object, ...])


def discipline_scope_for_user(user: User) -> Optional[str]:
    """Return discipline scope for RBAC filtering (None means unrestricted)."""
    r = user.role.value if hasattr(user.role, "value") else str(user.role)
    if r == RoleEnum.super_admin.value:
        return None
    # Supervisors (HOD / department heads): cross-discipline visibility for approvals,
    # teaching sessions, tutor lists, and related reads — aligned with hospital-wide oversight.
    if r == RoleEnum.supervisor.value:
        return None
    if r in {
        RoleEnum.programme_admin.value,
        RoleEnum.tutor.value,
    }:
        return user.discipline
    if r == RoleEnum.student.value:
        return user.discipline
    return user.discipline


def apply_discipline_filter(
    query: Select[T],
    *,
    actor: User,
    discipline_column: Callable[[], ColumnElement[str]],
) -> Select[T]:
    """Apply discipline-based filtering for read queries (skeleton)."""
    scoped = discipline_scope_for_user(actor)
    if scoped is None:
        return query

    return query.where(discipline_column() == scoped)

