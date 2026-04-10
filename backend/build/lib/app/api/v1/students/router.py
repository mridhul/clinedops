from __future__ import annotations

import json
from typing import Any, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, Query, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.deps import get_current_user
from app.api.v1.students.schemas import StudentCreate, StudentDetail, StudentListResponse, StudentUpdate
from app.db.models import User
from app.db.session import get_db_session
from app.schemas.envelope import Envelope
from app.services import import_batch_service, student_service

router = APIRouter(prefix="/students", tags=["students"])


@router.get("", response_model=Envelope[StudentListResponse])
async def list_students(
    discipline: Optional[str] = Query(None),
    institution: Optional[str] = Query(None),
    lifecycle_status: Optional[str] = Query(None),
    academic_cycle_id: Optional[UUID] = Query(None),
    department_id: Optional[UUID] = Query(None),
    status: Optional[str] = Query(None, description="active | inactive | all"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    session: AsyncSession = Depends(get_db_session),
    actor: User = Depends(get_current_user),
) -> Envelope[StudentListResponse]:
    data = await student_service.list_students(
        session,
        actor=actor,
        discipline=discipline,
        institution=institution,
        lifecycle_status=lifecycle_status,
        academic_cycle_id=academic_cycle_id,
        department_id=department_id,
        status_filter=status,
        limit=limit,
        offset=offset,
    )
    return Envelope(
        data=data,
        meta={"total": data.total, "limit": data.limit, "offset": data.offset},
        errors=None,
    )


@router.post("", response_model=Envelope[StudentDetail])
async def create_student(
    payload: StudentCreate,
    session: AsyncSession = Depends(get_db_session),
    actor: User = Depends(get_current_user),
) -> Envelope[StudentDetail]:
    detail = await student_service.create_student(session, actor=actor, payload=payload)
    return Envelope(data=detail, meta=None, errors=None)


@router.post("/batch", response_model=Envelope[dict[str, Any]])
async def batch_import_students(
    file: UploadFile = File(...),
    mapping: str = Form(...),
    dry_run: bool = Form(False),
    default_password: str = Form(...),
    session: AsyncSession = Depends(get_db_session),
    actor: User = Depends(get_current_user),
) -> Envelope[dict[str, Any]]:
    mapping_dict: dict[str, str] = json.loads(mapping)
    data = await import_batch_service.process_student_batch(
        session,
        actor=actor,
        file=file,
        mapping=mapping_dict,
        dry_run=dry_run,
        default_password=default_password,
    )
    return Envelope(data=data, meta=None, errors=None)


@router.get("/{student_id}", response_model=Envelope[StudentDetail])
async def get_student(
    student_id: UUID,
    session: AsyncSession = Depends(get_db_session),
    actor: User = Depends(get_current_user),
) -> Envelope[StudentDetail]:
    detail = await student_service.get_student_detail(session, actor=actor, student_id=student_id)
    return Envelope(data=detail, meta=None, errors=None)


@router.patch("/{student_id}", response_model=Envelope[StudentDetail])
async def patch_student(
    student_id: UUID,
    payload: StudentUpdate,
    session: AsyncSession = Depends(get_db_session),
    actor: User = Depends(get_current_user),
) -> Envelope[StudentDetail]:
    detail = await student_service.update_student(session, actor=actor, student_id=student_id, payload=payload)
    return Envelope(data=detail, meta=None, errors=None)


@router.delete("/{student_id}", response_model=Envelope[dict])
async def delete_student(
    student_id: UUID,
    session: AsyncSession = Depends(get_db_session),
    actor: User = Depends(get_current_user),
) -> Envelope[dict]:
    await student_service.soft_delete_student(session, actor=actor, student_id=student_id)
    return Envelope(data={"ok": True}, meta=None, errors=None)
