from __future__ import annotations

from typing import Any, Optional
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.academic_cycles.schemas import (
    AcademicCycleCreate,
    AcademicCycleListResponse,
    AcademicCycleOut,
    AcademicCycleUpdate,
)
from app.db.models import AcademicCycle, User
from app.services.access import can_mutate_lifecycle, can_read_lifecycle
from app.services.audit_service import record_audit


def _cycle_dict(c: AcademicCycle) -> dict[str, Any]:
    return {
        "id": str(c.id),
        "name": c.name,
        "start_date": c.start_date.isoformat() if c.start_date else None,
        "end_date": c.end_date.isoformat() if c.end_date else None,
        "is_current": c.is_current,
        "is_active": c.is_active,
    }


async def list_cycles(
    session: AsyncSession,
    *,
    actor: User,
    limit: int = 50,
    offset: int = 0,
) -> AcademicCycleListResponse:
    if not can_read_lifecycle(actor):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
    q = select(AcademicCycle).where(AcademicCycle.is_active.is_(True))
    cq = select(func.count()).select_from(AcademicCycle).where(AcademicCycle.is_active.is_(True))
    total = (await session.execute(cq)).scalar_one()
    rows = (await session.execute(q.order_by(AcademicCycle.name).limit(limit).offset(offset))).scalars().all()
    items = [
        AcademicCycleOut(
            id=c.id,
            name=c.name,
            start_date=c.start_date,
            end_date=c.end_date,
            is_current=c.is_current,
            is_active=c.is_active,
        )
        for c in rows
    ]
    return AcademicCycleListResponse(items=items, total=total, limit=limit, offset=offset)


async def create_cycle(
    session: AsyncSession,
    *,
    actor: User,
    payload: AcademicCycleCreate,
) -> AcademicCycleOut:
    if not can_mutate_lifecycle(actor):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")

    dup = await session.execute(select(AcademicCycle).where(AcademicCycle.name == payload.name))
    if dup.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Cycle name already exists")

    c = AcademicCycle(
        name=payload.name,
        start_date=payload.start_date,
        end_date=payload.end_date,
        is_current=payload.is_current,
        created_by=actor.id,
    )
    session.add(c)
    await session.flush()

    if payload.is_current:
        await session.execute(update(AcademicCycle).where(AcademicCycle.id != c.id).values(is_current=False))

    await record_audit(
        session,
        actor_id=actor.id,
        action="CREATE",
        entity_type="academic_cycle",
        entity_id=c.id,
        before_state=None,
        after_state=_cycle_dict(c),
    )
    await session.commit()
    await session.refresh(c)
    return AcademicCycleOut(
        id=c.id,
        name=c.name,
        start_date=c.start_date,
        end_date=c.end_date,
        is_current=c.is_current,
        is_active=c.is_active,
    )


async def update_cycle(
    session: AsyncSession,
    *,
    actor: User,
    cycle_id: UUID,
    payload: AcademicCycleUpdate,
) -> AcademicCycleOut:
    if not can_mutate_lifecycle(actor):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
    res = await session.execute(select(AcademicCycle).where(AcademicCycle.id == cycle_id))
    c = res.scalar_one_or_none()
    if c is None:
        raise HTTPException(status_code=404, detail="Academic cycle not found")

    before = _cycle_dict(c)
    if payload.name is not None:
        c.name = payload.name
    if payload.start_date is not None:
        c.start_date = payload.start_date
    if payload.end_date is not None:
        c.end_date = payload.end_date
    if payload.is_current is not None:
        c.is_current = payload.is_current
        if payload.is_current:
            await session.execute(update(AcademicCycle).where(AcademicCycle.id != c.id).values(is_current=False))

    await session.flush()
    await record_audit(
        session,
        actor_id=actor.id,
        action="UPDATE",
        entity_type="academic_cycle",
        entity_id=c.id,
        before_state=before,
        after_state=_cycle_dict(c),
    )
    await session.commit()
    await session.refresh(c)
    return AcademicCycleOut(
        id=c.id,
        name=c.name,
        start_date=c.start_date,
        end_date=c.end_date,
        is_current=c.is_current,
        is_active=c.is_active,
    )
