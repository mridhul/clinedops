from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.deps import get_current_user
from app.api.v1.academic_cycles.schemas import (
    AcademicCycleCreate,
    AcademicCycleListResponse,
    AcademicCycleOut,
    AcademicCycleUpdate,
)
from app.db.models import User
from app.db.session import get_db_session
from app.schemas.envelope import Envelope
from app.services import academic_cycle_service

router = APIRouter(prefix="/academic-cycles", tags=["academic-cycles"])


@router.get("", response_model=Envelope[AcademicCycleListResponse])
async def list_cycles(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    session: AsyncSession = Depends(get_db_session),
    actor: User = Depends(get_current_user),
) -> Envelope[AcademicCycleListResponse]:
    data = await academic_cycle_service.list_cycles(session, actor=actor, limit=limit, offset=offset)
    return Envelope(
        data=data,
        meta={"total": data.total, "limit": data.limit, "offset": data.offset},
        errors=None,
    )


@router.post("", response_model=Envelope[AcademicCycleOut])
async def create_cycle(
    payload: AcademicCycleCreate,
    session: AsyncSession = Depends(get_db_session),
    actor: User = Depends(get_current_user),
) -> Envelope[AcademicCycleOut]:
    out = await academic_cycle_service.create_cycle(session, actor=actor, payload=payload)
    return Envelope(data=out, meta=None, errors=None)


@router.patch("/{cycle_id}", response_model=Envelope[AcademicCycleOut])
async def patch_cycle(
    cycle_id: UUID,
    payload: AcademicCycleUpdate,
    session: AsyncSession = Depends(get_db_session),
    actor: User = Depends(get_current_user),
) -> Envelope[AcademicCycleOut]:
    out = await academic_cycle_service.update_cycle(session, actor=actor, cycle_id=cycle_id, payload=payload)
    return Envelope(data=out, meta=None, errors=None)
