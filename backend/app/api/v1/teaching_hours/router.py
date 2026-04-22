from __future__ import annotations

from datetime import date
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.deps import get_current_user, has_permission, require_roles
from app.api.v1.teaching_hours.schemas import (
    BulkSessionCreate,
    DashboardOut,
    SessionCreate,
    SessionListResponse,
    SessionOut,
    SessionRejectPayload,
    SessionUpdate,
    TutorBillableRateCreate,
    TutorBillableRateOut,
)
from app.db.models import User
from app.db.models.enums import RoleEnum
from app.db.session import get_db_session
from app.schemas.envelope import Envelope
from app.services import teaching_hours_service

router = APIRouter(tags=["teaching_hours"])


# ── Sessions ──────────────────────────────────────────────────────────────────

@router.get("/teaching-sessions", response_model=Envelope[SessionListResponse])
async def list_sessions(
    discipline: Optional[str] = Query(None),
    department_id: Optional[UUID] = Query(None),
    status: Optional[str] = Query(None),
    tutor_id: Optional[UUID] = Query(None),
    student_search: Optional[str] = Query(None, max_length=200, description="Match student name, email, or code"),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db_session),
    actor: User = Depends(get_current_user),
) -> Envelope[SessionListResponse]:
    data = await teaching_hours_service.list_sessions(
        db,
        actor=actor,
        discipline=discipline,
        department_id=department_id,
        status_filter=status,
        tutor_id=tutor_id,
        student_search=student_search,
        date_from=date_from,
        date_to=date_to,
        limit=limit,
        offset=offset,
    )
    return Envelope(data=data, meta={"total": data.total}, errors=None)


@router.post("/teaching-sessions", response_model=Envelope[SessionOut])
async def create_session(
    payload: SessionCreate,
    db: AsyncSession = Depends(get_db_session),
    actor: User = Depends(get_current_user),
) -> Envelope[SessionOut]:
    out = await teaching_hours_service.create_session(db, actor=actor, payload=payload)
    return Envelope(data=out, meta=None, errors=None)


@router.post("/teaching-sessions/bulk", response_model=Envelope[list[SessionOut]])
async def create_bulk_sessions(
    payload: BulkSessionCreate,
    db: AsyncSession = Depends(get_db_session),
    actor: User = Depends(get_current_user),
) -> Envelope[list[SessionOut]]:
    out = await teaching_hours_service.create_bulk_sessions(db, actor=actor, payload=payload)
    return Envelope(data=out, meta={"created": len(out)}, errors=None)


@router.get("/teaching-sessions/{session_id}", response_model=Envelope[SessionOut])
async def get_session(
    session_id: UUID,
    db: AsyncSession = Depends(get_db_session),
    actor: User = Depends(get_current_user),
) -> Envelope[SessionOut]:
    out = await teaching_hours_service.get_session(db, actor=actor, session_id=session_id)
    return Envelope(data=out, meta=None, errors=None)


@router.patch("/teaching-sessions/{session_id}", response_model=Envelope[SessionOut])
async def update_session(
    session_id: UUID,
    payload: SessionUpdate,
    db: AsyncSession = Depends(get_db_session),
    actor: User = Depends(get_current_user),
) -> Envelope[SessionOut]:
    out = await teaching_hours_service.update_session(db, actor=actor, session_id=session_id, payload=payload)
    return Envelope(data=out, meta=None, errors=None)


@router.post("/teaching-sessions/{session_id}/submit", response_model=Envelope[SessionOut])
async def submit_session(
    session_id: UUID,
    db: AsyncSession = Depends(get_db_session),
    actor: User = Depends(get_current_user),
) -> Envelope[SessionOut]:
    out = await teaching_hours_service.submit_session(db, actor=actor, session_id=session_id)
    return Envelope(data=out, meta=None, errors=None)


@router.post("/teaching-sessions/{session_id}/approve", response_model=Envelope[SessionOut])
async def approve_session(
    session_id: UUID,
    db: AsyncSession = Depends(get_db_session),
    actor: User = Depends(has_permission("approve_hours")),
) -> Envelope[SessionOut]:
    out = await teaching_hours_service.approve_session(db, actor=actor, session_id=session_id)
    return Envelope(data=out, meta=None, errors=None)


@router.post("/teaching-sessions/{session_id}/reject", response_model=Envelope[SessionOut])
async def reject_session(
    session_id: UUID,
    payload: SessionRejectPayload,
    db: AsyncSession = Depends(get_db_session),
    actor: User = Depends(has_permission("approve_hours")),
) -> Envelope[SessionOut]:
    out = await teaching_hours_service.reject_session(db, actor=actor, session_id=session_id, reason=payload.reason)
    return Envelope(data=out, meta=None, errors=None)


@router.post("/teaching-sessions/{session_id}/confirm-attendance", response_model=Envelope[SessionOut])
async def confirm_attendance(
    session_id: UUID,
    db: AsyncSession = Depends(get_db_session),
    actor: User = Depends(require_roles([RoleEnum.student])),
) -> Envelope[SessionOut]:
    out = await teaching_hours_service.student_confirm_attendance(db, actor=actor, session_id=session_id)
    return Envelope(data=out, meta=None, errors=None)


# ── Dashboard & Export ────────────────────────────────────────────────────────

@router.get("/teaching-hours/dashboard", response_model=Envelope[DashboardOut])
async def dashboard(
    group_by: str = Query("tutor", pattern="^(tutor|department)$"),
    discipline: Optional[str] = Query(None),
    department_id: Optional[UUID] = Query(None),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    db: AsyncSession = Depends(get_db_session),
    actor: User = Depends(has_permission("view_reports")),
) -> Envelope[DashboardOut]:
    out = await teaching_hours_service.get_dashboard_data(
        db,
        actor=actor,
        group_by=group_by,
        discipline=discipline,
        department_id=department_id,
        date_from=date_from,
        date_to=date_to,
    )
    return Envelope(data=out, meta=None, errors=None)


@router.get("/teaching-hours/export")
async def export_hours(
    discipline: Optional[str] = Query(None),
    department_id: Optional[UUID] = Query(None),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    db: AsyncSession = Depends(get_db_session),
    actor: User = Depends(has_permission("view_reports")),
) -> StreamingResponse:
    import io
    xlsx_bytes = await teaching_hours_service.export_approved_hours_xlsx(
        db,
        actor=actor,
        discipline=discipline,
        department_id=department_id,
        date_from=date_from,
        date_to=date_to,
    )
    return StreamingResponse(
        io.BytesIO(xlsx_bytes),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=teaching_hours_export.xlsx"},
    )


# ── Billable Rates ────────────────────────────────────────────────────────────

@router.get("/tutors/{tutor_id}/billable-rates", response_model=Envelope[list[TutorBillableRateOut]])
async def list_billable_rates(
    tutor_id: UUID,
    db: AsyncSession = Depends(get_db_session),
    actor: User = Depends(has_permission("view_tutors")),
) -> Envelope[list[TutorBillableRateOut]]:
    out = await teaching_hours_service.list_billable_rates(db, actor=actor, tutor_id=tutor_id)
    return Envelope(data=out, meta={"total": len(out)}, errors=None)


@router.post("/tutors/{tutor_id}/billable-rates", response_model=Envelope[TutorBillableRateOut])
async def create_billable_rate(
    tutor_id: UUID,
    payload: TutorBillableRateCreate,
    db: AsyncSession = Depends(get_db_session),
    actor: User = Depends(has_permission("edit_tutors")),
) -> Envelope[TutorBillableRateOut]:
    out = await teaching_hours_service.create_billable_rate(db, actor=actor, tutor_id=tutor_id, payload=payload)
    return Envelope(data=out, meta=None, errors=None)

