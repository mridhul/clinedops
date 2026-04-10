from __future__ import annotations

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.deps import get_current_user
from app.api.v1.departments.schemas import DepartmentCreate, DepartmentListResponse, DepartmentOut, DepartmentUpdate
from app.db.models import User
from app.db.session import get_db_session
from app.schemas.envelope import Envelope
from app.services import department_service

router = APIRouter(prefix="/departments", tags=["departments"])


@router.get("", response_model=Envelope[DepartmentListResponse])
async def list_departments(
    discipline: Optional[str] = Query(None),
    department_id: Optional[UUID] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    session: AsyncSession = Depends(get_db_session),
    actor: User = Depends(get_current_user),
) -> Envelope[DepartmentListResponse]:
    data = await department_service.list_departments(
        session,
        actor=actor,
        discipline=discipline,
        department_id=department_id,
        limit=limit,
        offset=offset,
    )
    return Envelope(
        data=data,
        meta={"total": data.total, "limit": data.limit, "offset": data.offset},
        errors=None,
    )


@router.post("", response_model=Envelope[DepartmentOut])
async def create_department(
    payload: DepartmentCreate,
    session: AsyncSession = Depends(get_db_session),
    actor: User = Depends(get_current_user),
) -> Envelope[DepartmentOut]:
    out = await department_service.create_department(session, actor=actor, payload=payload)
    return Envelope(data=out, meta=None, errors=None)


@router.patch("/{department_id}", response_model=Envelope[DepartmentOut])
async def patch_department(
    department_id: UUID,
    payload: DepartmentUpdate,
    session: AsyncSession = Depends(get_db_session),
    actor: User = Depends(get_current_user),
) -> Envelope[DepartmentOut]:
    out = await department_service.update_department(session, actor=actor, department_id=department_id, payload=payload)
    return Envelope(data=out, meta=None, errors=None)
