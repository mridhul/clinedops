from __future__ import annotations

from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Student, Tutor, User
from app.db.models.enums import RoleEnum
from app.services.rbac import discipline_scope_for_user


def role_value(user: User) -> str:
    return user.role.value if hasattr(user.role, "value") else str(user.role)


def can_mutate_lifecycle(user: User) -> bool:
    v = role_value(user)
    return v in (RoleEnum.super_admin.value, RoleEnum.programme_admin.value)


def can_read_lifecycle(user: User) -> bool:
    v = role_value(user)
    return v in (
        RoleEnum.super_admin.value,
        RoleEnum.programme_admin.value,
        RoleEnum.supervisor.value,
    )


def ensure_discipline_scope(user: User, discipline: str) -> None:
    """Raise 403 if programme-scoped user accesses another discipline."""
    scoped = discipline_scope_for_user(user)
    if scoped is not None and discipline != scoped:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Discipline scope violation")


async def get_student_for_user(session: AsyncSession, user: User) -> Student | None:
    if role_value(user) != RoleEnum.student.value:
        return None
    res = await session.execute(select(Student).where(Student.user_id == user.id))
    return res.scalar_one_or_none()


async def ensure_student_access(
    session: AsyncSession,
    *,
    actor: User,
    student_id: UUID,
) -> Student:
    res = await session.execute(select(Student).where(Student.id == student_id))
    row = res.scalar_one_or_none()
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")
    if role_value(actor) == RoleEnum.student.value:
        if row.user_id != actor.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
        return row
    if not can_read_lifecycle(actor):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
    ensure_discipline_scope(actor, row.discipline)
    return row


async def ensure_tutor_access(
    session: AsyncSession,
    *,
    actor: User,
    tutor_id: UUID,
) -> Tutor:
    res = await session.execute(select(Tutor).where(Tutor.id == tutor_id))
    row = res.scalar_one_or_none()
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tutor not found")
    if role_value(actor) == RoleEnum.tutor.value:
        if row.user_id != actor.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
        return row
    if not can_read_lifecycle(actor):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
    ensure_discipline_scope(actor, row.discipline)
    return row
