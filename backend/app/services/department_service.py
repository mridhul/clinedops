from __future__ import annotations

from typing import Any, Optional
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.departments.schemas import DepartmentCreate, DepartmentListResponse, DepartmentOut, DepartmentUpdate
from app.db.models import Department, User
from app.db.models.enums import RoleEnum
from app.services.access import can_mutate_lifecycle, can_read_lifecycle, ensure_discipline_scope, role_value
from app.services.audit_service import record_audit
from app.services.rbac import discipline_scope_for_user


def _dept_dict(d: Department) -> dict[str, Any]:
    return {
        "id": str(d.id),
        "name": d.name,
        "discipline": d.discipline,
        "head_user_id": str(d.head_user_id) if d.head_user_id else None,
        "is_active": d.is_active,
    }


async def _validate_head(session: AsyncSession, discipline: str, head_user_id: Optional[UUID]) -> None:
    if head_user_id is None:
        return
    res = await session.execute(select(User).where(User.id == head_user_id))
    u = res.scalar_one_or_none()
    if u is None:
        raise HTTPException(status_code=400, detail="head_user_id not found")
    if role_value(u) == RoleEnum.super_admin.value:
        return
    if u.discipline and u.discipline != discipline:
        raise HTTPException(status_code=400, detail="Head user discipline must match department")


async def list_departments(
    session: AsyncSession,
    *,
    actor: User,
    discipline: Optional[str] = None,
    department_id: Optional[UUID] = None,
    limit: int = 50,
    offset: int = 0,
) -> DepartmentListResponse:
    if not can_read_lifecycle(actor):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
    scoped = discipline_scope_for_user(actor)

    def _apply(stmt):
        if scoped is not None:
            stmt = stmt.where(Department.discipline == scoped)
        if discipline:
            stmt = stmt.where(Department.discipline == discipline)
        if department_id:
            stmt = stmt.where(Department.id == department_id)
        stmt = stmt.where(Department.is_active.is_(True))
        return stmt

    q = _apply(select(Department))
    cq = _apply(select(func.count()).select_from(Department))
    total = (await session.execute(cq)).scalar_one()
    rows = (await session.execute(q.order_by(Department.name).limit(limit).offset(offset))).scalars().all()
    items = [
        DepartmentOut(
            id=d.id,
            name=d.name,
            discipline=d.discipline,
            head_user_id=d.head_user_id,
            is_active=d.is_active,
        )
        for d in rows
    ]
    return DepartmentListResponse(items=items, total=total, limit=limit, offset=offset)


async def create_department(
    session: AsyncSession,
    *,
    actor: User,
    payload: DepartmentCreate,
) -> DepartmentOut:
    if not can_mutate_lifecycle(actor):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
    ensure_discipline_scope(actor, payload.discipline)
    await _validate_head(session, payload.discipline, payload.head_user_id)

    dup = await session.execute(select(Department).where(Department.name == payload.name))
    if dup.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Department name already exists")

    d = Department(
        name=payload.name,
        discipline=payload.discipline,
        head_user_id=payload.head_user_id,
        created_by=actor.id,
    )
    session.add(d)
    await session.flush()
    await record_audit(
        session,
        actor_id=actor.id,
        action="CREATE",
        entity_type="department",
        entity_id=d.id,
        before_state=None,
        after_state=_dept_dict(d),
    )
    await session.commit()
    await session.refresh(d)
    return DepartmentOut(
        id=d.id,
        name=d.name,
        discipline=d.discipline,
        head_user_id=d.head_user_id,
        is_active=d.is_active,
    )


async def update_department(
    session: AsyncSession,
    *,
    actor: User,
    department_id: UUID,
    payload: DepartmentUpdate,
) -> DepartmentOut:
    if not can_mutate_lifecycle(actor):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
    res = await session.execute(select(Department).where(Department.id == department_id))
    d = res.scalar_one_or_none()
    if d is None:
        raise HTTPException(status_code=404, detail="Department not found")
    ensure_discipline_scope(actor, d.discipline)

    new_discipline = payload.discipline if payload.discipline is not None else d.discipline
    head = payload.head_user_id if payload.head_user_id is not None else d.head_user_id
    if payload.head_user_id is not None or payload.discipline is not None:
        await _validate_head(session, new_discipline, head if payload.head_user_id is not None else d.head_user_id)

    before = _dept_dict(d)
    if payload.name is not None:
        d.name = payload.name
    if payload.discipline is not None:
        ensure_discipline_scope(actor, payload.discipline)
        d.discipline = payload.discipline
    if payload.head_user_id is not None:
        d.head_user_id = payload.head_user_id

    await session.flush()
    await record_audit(
        session,
        actor_id=actor.id,
        action="UPDATE",
        entity_type="department",
        entity_id=d.id,
        before_state=before,
        after_state=_dept_dict(d),
    )
    await session.commit()
    await session.refresh(d)
    return DepartmentOut(
        id=d.id,
        name=d.name,
        discipline=d.discipline,
        head_user_id=d.head_user_id,
        is_active=d.is_active,
    )
