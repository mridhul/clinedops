from __future__ import annotations

from typing import Callable, Optional, TypeVar

from sqlalchemy import ColumnElement
from sqlalchemy.sql import Select

from app.db.models import User
from app.db.models.enums import RoleEnum


T = TypeVar("T")


def discipline_scope_for_user(user: User) -> Optional[str]:
    """Return discipline scope for RBAC filtering (None means unrestricted)."""
    if user.role == RoleEnum.super_admin.value:
        return None
    # Programme admins, supervisors and tutors are scoped to their discipline.
    if user.role in {
        RoleEnum.programme_admin.value,
        RoleEnum.supervisor.value,
        RoleEnum.tutor.value,
    }:
        return user.discipline
    # Students are effectively scoped to themselves; discipline scope can be used as a fallback.
    if user.role == RoleEnum.student.value:
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

