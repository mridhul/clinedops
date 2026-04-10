from __future__ import annotations

import json
from typing import Any, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, Query, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.deps import get_current_user
from app.api.v1.tutors.schemas import TutorCreate, TutorDetail, TutorListResponse, TutorUpdate
from app.db.models import User
from app.db.session import get_db_session
from app.schemas.envelope import Envelope
from app.services import import_batch_service, tutor_service

router = APIRouter(prefix="/tutors", tags=["tutors"])


@router.get("", response_model=Envelope[TutorListResponse])
async def list_tutors(
    discipline: Optional[str] = Query(None),
    department_id: Optional[UUID] = Query(None),
    active_only: Optional[bool] = Query(True),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    session: AsyncSession = Depends(get_db_session),
    actor: User = Depends(get_current_user),
) -> Envelope[TutorListResponse]:
    data = await tutor_service.list_tutors(
        session,
        actor=actor,
        discipline=discipline,
        department_id=department_id,
        active_only=active_only,
        limit=limit,
        offset=offset,
    )
    return Envelope(
        data=data,
        meta={"total": data.total, "limit": data.limit, "offset": data.offset},
        errors=None,
    )


@router.post("", response_model=Envelope[TutorDetail])
async def create_tutor(
    payload: TutorCreate,
    session: AsyncSession = Depends(get_db_session),
    actor: User = Depends(get_current_user),
) -> Envelope[TutorDetail]:
    detail = await tutor_service.create_tutor(session, actor=actor, payload=payload)
    return Envelope(data=detail, meta=None, errors=None)


@router.post("/batch", response_model=Envelope[dict[str, Any]])
async def batch_import_tutors(
    file: UploadFile = File(...),
    mapping: str = Form(...),
    dry_run: bool = Form(False),
    default_password: str = Form(...),
    session: AsyncSession = Depends(get_db_session),
    actor: User = Depends(get_current_user),
) -> Envelope[dict[str, Any]]:
    mapping_dict: dict[str, str] = json.loads(mapping)
    data = await import_batch_service.process_tutor_batch(
        session,
        actor=actor,
        file=file,
        mapping=mapping_dict,
        dry_run=dry_run,
        default_password=default_password,
    )
    return Envelope(data=data, meta=None, errors=None)


@router.get("/{tutor_id}", response_model=Envelope[TutorDetail])
async def get_tutor(
    tutor_id: UUID,
    session: AsyncSession = Depends(get_db_session),
    actor: User = Depends(get_current_user),
) -> Envelope[TutorDetail]:
    detail = await tutor_service.get_tutor_detail(session, actor=actor, tutor_id=tutor_id)
    return Envelope(data=detail, meta=None, errors=None)


@router.patch("/{tutor_id}", response_model=Envelope[TutorDetail])
async def patch_tutor(
    tutor_id: UUID,
    payload: TutorUpdate,
    session: AsyncSession = Depends(get_db_session),
    actor: User = Depends(get_current_user),
) -> Envelope[TutorDetail]:
    detail = await tutor_service.update_tutor(session, actor=actor, tutor_id=tutor_id, payload=payload)
    return Envelope(data=detail, meta=None, errors=None)


@router.delete("/{tutor_id}", response_model=Envelope[dict])
async def delete_tutor(
    tutor_id: UUID,
    session: AsyncSession = Depends(get_db_session),
    actor: User = Depends(get_current_user),
) -> Envelope[dict]:
    await tutor_service.soft_delete_tutor(session, actor=actor, tutor_id=tutor_id)
    return Envelope(data={"ok": True}, meta=None, errors=None)
