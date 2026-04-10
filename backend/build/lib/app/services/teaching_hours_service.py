from __future__ import annotations

import io
import math
from datetime import date, datetime, timedelta
from decimal import Decimal
from typing import Any, Optional
from uuid import UUID

from fastapi import HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.teaching_hours.schemas import (
    AnomalyFlagOut,
    BulkSessionCreate,
    DashboardBar,
    DashboardOut,
    SessionCreate,
    SessionListResponse,
    SessionOut,
    SessionStudentOut,
    SessionUpdate,
    TutorBillableRateCreate,
    TutorBillableRateOut,
)
from app.db.models import (
    AuditLog,
    Department,
    Posting,
    SessionStudent,
    TeachingSession,
    Tutor,
    TutorBillableRate,
    User,
)
from app.db.models.enums import RoleEnum, SessionApprovalStatusEnum
from app.services.access import role_value
from app.services.audit_service import record_audit
from app.services.rbac import discipline_scope_for_user


# ── Helpers ───────────────────────────────────────────────────────────────────

def _fmt_dt(dt: Optional[datetime]) -> Optional[str]:
    return dt.isoformat() if dt else None


def _fmt_d(d: Optional[date]) -> Optional[str]:
    return d.isoformat() if d else None


async def _get_billable_rate(session: AsyncSession, tutor_id: UUID, session_date: date) -> Optional[Decimal]:
    """Find the applicable hourly rate for a tutor on a given date."""
    stmt = (
        select(TutorBillableRate)
        .where(
            TutorBillableRate.tutor_id == tutor_id,
            TutorBillableRate.is_active.is_(True),
            TutorBillableRate.effective_from <= session_date,
        )
        .where(
            (TutorBillableRate.effective_to.is_(None))
            | (TutorBillableRate.effective_to >= session_date)
        )
        .order_by(TutorBillableRate.effective_from.desc())
    )
    tbr = (await session.execute(stmt)).scalars().first()
    return tbr.rate_per_hour if tbr else None


async def _session_out(session: AsyncSession, ts: TeachingSession) -> SessionOut:
    """Convert a TeachingSession ORM object to SessionOut schema."""
    flags_raw: list[dict[str, Any]] = ts.anomaly_flags or []
    flags = [AnomalyFlagOut(type=f["type"], detail=f["detail"]) for f in flags_raw]

    students_out = [
        SessionStudentOut(
            id=ss.id,
            student_id=ss.student_id,
            attendance_confirmed_at=_fmt_dt(ss.attendance_confirmed_at),
        )
        for ss in (ts.session_students or [])
        if ss.is_active
    ]

    # Compute billable amount
    billable_amount: Optional[Decimal] = None
    if ts.billable_minutes is not None:
        session_date = ts.starts_at.date()
        rate = await _get_billable_rate(session, ts.tutor_id, session_date)
        if rate is not None:
            billable_amount = (Decimal(ts.billable_minutes) / Decimal(60)) * rate

    return SessionOut(
        id=ts.id,
        posting_id=ts.posting_id,
        tutor_id=ts.tutor_id,
        starts_at=_fmt_dt(ts.starts_at) or "",
        duration_minutes=ts.duration_minutes,
        session_type=ts.session_type,
        department_id=ts.department_id,
        discipline=ts.discipline,
        description=ts.description,
        approval_status=ts.approval_status,
        submitted_at=_fmt_dt(ts.submitted_at),
        approved_at=_fmt_dt(ts.approved_at),
        approved_by=ts.approved_by,
        rejected_at=_fmt_dt(ts.rejected_at),
        rejected_by=ts.rejected_by,
        rejection_reason=ts.rejection_reason,
        anomaly_flags=flags,
        is_flagged=ts.is_flagged,
        billable_minutes=ts.billable_minutes,
        billable_amount=billable_amount,
        session_students=students_out,
        created_at=_fmt_dt(ts.created_at) or "",
    )


# ── Anomaly detection ─────────────────────────────────────────────────────────

async def _run_anomaly_checks(
    session: AsyncSession,
    *,
    tutor_id: UUID,
    starts_at: datetime,
    duration_minutes: int,
    posting_id: UUID,
    exclude_session_id: Optional[UUID] = None,
) -> list[dict[str, Any]]:
    flags: list[dict[str, Any]] = []
    session_date = starts_at.date()

    # 1. Duplicate slot — same tutor, same date, overlapping start time (within 15 min)
    dup_stmt = select(TeachingSession).where(
        TeachingSession.tutor_id == tutor_id,
        TeachingSession.is_active.is_(True),
        TeachingSession.approval_status != SessionApprovalStatusEnum.rejected.value,
        func.date(TeachingSession.starts_at) == session_date,
        TeachingSession.starts_at.between(
            starts_at - timedelta(minutes=15),
            starts_at + timedelta(minutes=15),
        ),
    )
    if exclude_session_id:
        dup_stmt = dup_stmt.where(TeachingSession.id != exclude_session_id)
    dup_rows = (await session.execute(dup_stmt)).scalars().all()
    if dup_rows:
        flags.append({"type": "duplicate_slot", "detail": f"Overlaps with session(s): {[str(r.id) for r in dup_rows]}"})

    # 2. Daily hours cap — total approved/submitted/draft minutes on same day ≥ 480
    daily_stmt = select(func.coalesce(func.sum(TeachingSession.duration_minutes), 0)).where(
        TeachingSession.tutor_id == tutor_id,
        TeachingSession.is_active.is_(True),
        TeachingSession.approval_status != SessionApprovalStatusEnum.rejected.value,
        func.date(TeachingSession.starts_at) == session_date,
    )
    if exclude_session_id:
        daily_stmt = daily_stmt.where(TeachingSession.id != exclude_session_id)
    existing_minutes = (await session.execute(daily_stmt)).scalar_one()
    if (existing_minutes + duration_minutes) > 480:
        total_hours = (existing_minutes + duration_minutes) / 60
        flags.append({"type": "daily_hours_exceeded", "detail": f"Total would be {total_hours:.1f}h (cap: 8h)"})

    # 3. Outside posting period
    posting = (await session.execute(select(Posting).where(Posting.id == posting_id))).scalar_one_or_none()
    if posting:
        if posting.start_date and session_date < posting.start_date:
            flags.append({"type": "outside_posting_period", "detail": f"Session date {session_date} before posting start {posting.start_date}"})
        elif posting.end_date and session_date > posting.end_date:
            flags.append({"type": "outside_posting_period", "detail": f"Session date {session_date} after posting end {posting.end_date}"})

    return flags


# ── Session permissions ───────────────────────────────────────────────────────

def _is_admin_or_pa(actor: User) -> bool:
    v = role_value(actor)
    return v in (RoleEnum.super_admin.value, RoleEnum.programme_admin.value)


def _is_supervisor_or_above(actor: User) -> bool:
    v = role_value(actor)
    return v in (RoleEnum.super_admin.value, RoleEnum.programme_admin.value, RoleEnum.supervisor.value)


async def _get_tutor_for_user(session: AsyncSession, actor: User) -> Optional[Tutor]:
    if role_value(actor) != RoleEnum.tutor.value:
        return None
    return (await session.execute(select(Tutor).where(Tutor.user_id == actor.id))).scalar_one_or_none()


async def _resolve_tutor_ids_for_supervisor(session: AsyncSession, actor: User) -> list[UUID]:
    """Return tutor IDs whose postings are supervised (linked via posting_tutors) by this supervisor."""
    from app.db.models import PostingTutor
    stmt = (
        select(PostingTutor.tutor_id)
        .join(Posting, Posting.id == PostingTutor.posting_id)
        .where(PostingTutor.is_active.is_(True), Posting.is_active.is_(True))
    )
    rows = (await session.execute(stmt)).scalars().all()
    return list(set(rows))


# ── CRUD ──────────────────────────────────────────────────────────────────────

async def create_session(
    session: AsyncSession,
    *,
    actor: User,
    payload: SessionCreate,
) -> SessionOut:
    actor_tutor = await _get_tutor_for_user(session, actor)
    if role_value(actor) == RoleEnum.tutor.value:
        if actor_tutor is None:
            raise HTTPException(status_code=400, detail="Tutor profile not found")
        tutor_id = actor_tutor.id
    elif _is_admin_or_pa(actor) or role_value(actor) == RoleEnum.supervisor.value:
        # Admin/supervisor must supply a posting that resolves to a tutor
        posting = (await session.execute(select(Posting).where(Posting.id == payload.posting_id))).scalar_one_or_none()
        if posting is None:
            raise HTTPException(status_code=400, detail="Posting not found")
        # For simplicity, admin creates on behalf of the first assigned tutor
        from app.db.models import PostingTutor
        pt = (await session.execute(
            select(PostingTutor).where(PostingTutor.posting_id == posting.id, PostingTutor.is_active.is_(True))
        )).scalars().first()
        if pt is None:
            raise HTTPException(status_code=400, detail="No tutor assigned to this posting")
        tutor_id = pt.tutor_id
    else:
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    # Validate posting
    posting = (await session.execute(select(Posting).where(Posting.id == payload.posting_id))).scalar_one_or_none()
    if posting is None:
        raise HTTPException(status_code=400, detail="Posting not found")

    # Parse start time
    try:
        starts_at = datetime.fromisoformat(payload.starts_at)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid starts_at format; use ISO 8601")

    # Check discipline scope
    scoped = discipline_scope_for_user(actor)
    if scoped and posting.discipline != scoped:
        raise HTTPException(status_code=403, detail="Discipline scope violation")

    # Anomaly detection
    flags = await _run_anomaly_checks(
        session,
        tutor_id=tutor_id,
        starts_at=starts_at,
        duration_minutes=payload.duration_minutes,
        posting_id=payload.posting_id,
    )

    ts = TeachingSession(
        posting_id=payload.posting_id,
        tutor_id=tutor_id,
        starts_at=starts_at,
        session_type=payload.session_type,
        duration_minutes=payload.duration_minutes,
        department_id=payload.department_id,
        discipline=posting.discipline,
        description=payload.description,
        approval_status=SessionApprovalStatusEnum.draft.value,
        anomaly_flags=flags,
        is_flagged=len(flags) > 0,
        created_by=actor.id,
    )
    session.add(ts)
    await session.flush()

    # Link students
    for sid in payload.student_ids:
        session.add(SessionStudent(teaching_session_id=ts.id, student_id=sid, created_by=actor.id))
    await session.flush()

    await record_audit(
        session,
        actor_id=actor.id,
        action="CREATE",
        entity_type="teaching_session",
        entity_id=ts.id,
        before_state=None,
        after_state={"approval_status": ts.approval_status, "duration_minutes": ts.duration_minutes},
    )
    await session.commit()
    await session.refresh(ts)
    return await _session_out(session, ts)


async def create_bulk_sessions(
    session: AsyncSession,
    *,
    actor: User,
    payload: BulkSessionCreate,
) -> list[SessionOut]:
    """Create a recurring series of sessions."""
    import calendar

    day_map = {
        "monday": 0, "tuesday": 1, "wednesday": 2, "thursday": 3,
        "friday": 4, "saturday": 5, "sunday": 6,
    }
    target_days = {day_map[d] for d in payload.days_of_week}

    # Parse time
    try:
        hh, mm = payload.start_time.split(":")
        start_hour, start_minute = int(hh), int(mm)
    except Exception:
        raise HTTPException(status_code=400, detail="start_time must be HH:MM")

    # Generate dates
    session_dates: list[date] = []
    current = payload.start_date
    while current <= payload.end_date:
        if current.weekday() in target_days:
            session_dates.append(current)
        current += timedelta(days=1)

    if not session_dates:
        raise HTTPException(status_code=400, detail="No matching dates found in the specified range")

    results: list[SessionOut] = []
    for d in session_dates:
        starts_at_str = datetime(d.year, d.month, d.day, start_hour, start_minute).isoformat()
        single = SessionCreate(
            posting_id=payload.posting_id,
            starts_at=starts_at_str,
            session_type=payload.session_type,
            duration_minutes=payload.duration_minutes,
            department_id=payload.department_id,
            student_ids=payload.student_ids,
            description=payload.description,
        )
        out = await create_session(session, actor=actor, payload=single)
        results.append(out)

    return results


async def get_session(
    session: AsyncSession,
    *,
    actor: User,
    session_id: UUID,
) -> SessionOut:
    ts = (await session.execute(
        select(TeachingSession).where(TeachingSession.id == session_id, TeachingSession.is_active.is_(True))
    )).scalar_one_or_none()
    if ts is None:
        raise HTTPException(status_code=404, detail="Session not found")

    await _assert_session_access(session, actor=actor, ts=ts)
    return await _session_out(session, ts)


async def _assert_session_access(session: AsyncSession, *, actor: User, ts: TeachingSession) -> None:
    v = role_value(actor)
    if v == RoleEnum.tutor.value:
        tutor = await _get_tutor_for_user(session, actor)
        if tutor is None or tutor.id != ts.tutor_id:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
    elif v == RoleEnum.student.value:
        # Student must be linked
        ss = (await session.execute(
            select(SessionStudent).where(
                SessionStudent.teaching_session_id == ts.id,
                SessionStudent.is_active.is_(True),
            )
        )).scalars().all()
        student_ids = {row.student_id for row in ss}
        from app.db.models import Student
        st = (await session.execute(select(Student).where(Student.user_id == actor.id))).scalar_one_or_none()
        if st is None or st.id not in student_ids:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
    elif v == RoleEnum.supervisor.value:
        scoped = discipline_scope_for_user(actor)
        if scoped and ts.discipline != scoped:
            raise HTTPException(status_code=403, detail="Discipline scope violation")
    elif _is_admin_or_pa(actor):
        scoped = discipline_scope_for_user(actor)
        if scoped and ts.discipline != scoped:
            raise HTTPException(status_code=403, detail="Discipline scope violation")
    else:
        raise HTTPException(status_code=403, detail="Insufficient permissions")


async def list_sessions(
    session: AsyncSession,
    *,
    actor: User,
    discipline: Optional[str] = None,
    department_id: Optional[UUID] = None,
    status_filter: Optional[str] = None,
    tutor_id: Optional[UUID] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    limit: int = 50,
    offset: int = 0,
) -> SessionListResponse:
    v = role_value(actor)
    scoped = discipline_scope_for_user(actor)

    def _base(stmt):
        stmt = stmt.where(TeachingSession.is_active.is_(True))
        if v == RoleEnum.tutor.value:
            # Will raise if no tutor – handled below
            pass
        elif v == RoleEnum.student.value:
            pass
        if discipline:
            stmt = stmt.where(TeachingSession.discipline == discipline)
        elif scoped:
            stmt = stmt.where(TeachingSession.discipline == scoped)
        if department_id:
            stmt = stmt.where(TeachingSession.department_id == department_id)
        if status_filter:
            stmt = stmt.where(TeachingSession.approval_status == status_filter)
        if tutor_id:
            stmt = stmt.where(TeachingSession.tutor_id == tutor_id)
        if date_from:
            stmt = stmt.where(func.date(TeachingSession.starts_at) >= date_from)
        if date_to:
            stmt = stmt.where(func.date(TeachingSession.starts_at) <= date_to)
        return stmt

    if v == RoleEnum.tutor.value:
        actor_tutor = await _get_tutor_for_user(session, actor)
        if actor_tutor is None:
            raise HTTPException(status_code=400, detail="Tutor profile not found")
        q = _base(select(TeachingSession)).where(TeachingSession.tutor_id == actor_tutor.id)
        cq = _base(select(func.count()).select_from(TeachingSession)).where(TeachingSession.tutor_id == actor_tutor.id)
    elif v == RoleEnum.student.value:
        from app.db.models import Student
        st = (await session.execute(select(Student).where(Student.user_id == actor.id))).scalar_one_or_none()
        if st is None:
            raise HTTPException(status_code=400, detail="Student profile not found")
        linked_session_ids_result = await session.execute(
            select(SessionStudent.teaching_session_id).where(
                SessionStudent.student_id == st.id,
                SessionStudent.is_active.is_(True),
            )
        )
        linked_ids = [r[0] for r in linked_session_ids_result.all()]
        q = _base(select(TeachingSession)).where(TeachingSession.id.in_(linked_ids))
        cq = _base(select(func.count()).select_from(TeachingSession)).where(TeachingSession.id.in_(linked_ids))
    elif _is_supervisor_or_above(actor):
        q = _base(select(TeachingSession))
        cq = _base(select(func.count()).select_from(TeachingSession))
    else:
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    total = (await session.execute(cq)).scalar_one()
    rows = (
        await session.execute(
            q.order_by(TeachingSession.starts_at.desc()).limit(limit).offset(offset)
        )
    ).scalars().all()

    items = [await _session_out(session, ts) for ts in rows]
    return SessionListResponse(items=items, total=total, limit=limit, offset=offset)


async def update_session(
    session: AsyncSession,
    *,
    actor: User,
    session_id: UUID,
    payload: SessionUpdate,
) -> SessionOut:
    ts = (await session.execute(
        select(TeachingSession).where(TeachingSession.id == session_id, TeachingSession.is_active.is_(True))
    )).scalar_one_or_none()
    if ts is None:
        raise HTTPException(status_code=404, detail="Session not found")

    await _assert_session_access(session, actor=actor, ts=ts)
    if ts.approval_status not in (SessionApprovalStatusEnum.draft.value, SessionApprovalStatusEnum.rejected.value):
        raise HTTPException(status_code=400, detail="Only draft or rejected sessions can be edited")

    before = {"approval_status": ts.approval_status, "duration_minutes": ts.duration_minutes}

    if payload.session_type is not None:
        ts.session_type = payload.session_type
    if payload.duration_minutes is not None:
        ts.duration_minutes = payload.duration_minutes
    if payload.starts_at is not None:
        try:
            ts.starts_at = datetime.fromisoformat(payload.starts_at)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid starts_at format")
    if payload.department_id is not None:
        ts.department_id = payload.department_id
    if payload.description is not None:
        ts.description = payload.description

    if payload.student_ids is not None:
        # Soft-delete existing, add new
        from sqlalchemy import update
        await session.execute(
            (select(SessionStudent))  # will use loop below instead
        )
        existing = (await session.execute(
            select(SessionStudent).where(
                SessionStudent.teaching_session_id == ts.id,
                SessionStudent.is_active.is_(True),
            )
        )).scalars().all()
        for ex in existing:
            ex.is_active = False
        for sid in payload.student_ids:
            session.add(SessionStudent(teaching_session_id=ts.id, student_id=sid, created_by=actor.id))
        await session.flush()

    # Re-run anomaly checks
    if ts.duration_minutes is not None:
        flags = await _run_anomaly_checks(
            session,
            tutor_id=ts.tutor_id,
            starts_at=ts.starts_at,
            duration_minutes=ts.duration_minutes,
            posting_id=ts.posting_id,
            exclude_session_id=ts.id,
        )
        ts.anomaly_flags = flags
        ts.is_flagged = len(flags) > 0

    await record_audit(
        session,
        actor_id=actor.id,
        action="UPDATE",
        entity_type="teaching_session",
        entity_id=ts.id,
        before_state=before,
        after_state={"approval_status": ts.approval_status, "duration_minutes": ts.duration_minutes},
    )
    await session.commit()
    await session.refresh(ts)
    return await _session_out(session, ts)


# ── Approval workflow ─────────────────────────────────────────────────────────

async def submit_session(
    session: AsyncSession,
    *,
    actor: User,
    session_id: UUID,
) -> SessionOut:
    ts = (await session.execute(
        select(TeachingSession).where(TeachingSession.id == session_id, TeachingSession.is_active.is_(True))
    )).scalar_one_or_none()
    if ts is None:
        raise HTTPException(status_code=404, detail="Session not found")

    v = role_value(actor)
    if v == RoleEnum.tutor.value:
        tutor = await _get_tutor_for_user(session, actor)
        if tutor is None or tutor.id != ts.tutor_id:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
    elif not _is_admin_or_pa(actor):
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    if ts.approval_status not in (SessionApprovalStatusEnum.draft.value, SessionApprovalStatusEnum.rejected.value):
        raise HTTPException(status_code=400, detail=f"Cannot submit session with status '{ts.approval_status}'")

    before = {"approval_status": ts.approval_status}
    ts.approval_status = SessionApprovalStatusEnum.submitted.value
    ts.submitted_at = datetime.utcnow()
    ts.rejection_reason = None
    ts.rejected_at = None
    ts.rejected_by = None

    await record_audit(
        session,
        actor_id=actor.id,
        action="SUBMIT",
        entity_type="teaching_session",
        entity_id=ts.id,
        before_state=before,
        after_state={"approval_status": ts.approval_status},
    )
    await session.commit()
    await session.refresh(ts)
    return await _session_out(session, ts)


async def approve_session(
    session: AsyncSession,
    *,
    actor: User,
    session_id: UUID,
) -> SessionOut:
    ts = (await session.execute(
        select(TeachingSession).where(TeachingSession.id == session_id, TeachingSession.is_active.is_(True))
    )).scalar_one_or_none()
    if ts is None:
        raise HTTPException(status_code=404, detail="Session not found")

    if not _is_supervisor_or_above(actor):
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    scoped = discipline_scope_for_user(actor)
    if scoped and ts.discipline != scoped:
        raise HTTPException(status_code=403, detail="Discipline scope violation")

    if ts.approval_status != SessionApprovalStatusEnum.submitted.value:
        raise HTTPException(status_code=400, detail=f"Cannot approve session with status '{ts.approval_status}'")

    before = {"approval_status": ts.approval_status}
    ts.approval_status = SessionApprovalStatusEnum.approved.value
    ts.approved_at = datetime.utcnow()
    ts.approved_by = actor.id
    ts.billable_minutes = ts.duration_minutes

    await record_audit(
        session,
        actor_id=actor.id,
        action="APPROVE",
        entity_type="teaching_session",
        entity_id=ts.id,
        before_state=before,
        after_state={"approval_status": ts.approval_status, "billable_minutes": ts.billable_minutes},
    )
    await session.commit()
    await session.refresh(ts)
    return await _session_out(session, ts)


async def reject_session(
    session: AsyncSession,
    *,
    actor: User,
    session_id: UUID,
    reason: str,
) -> SessionOut:
    ts = (await session.execute(
        select(TeachingSession).where(TeachingSession.id == session_id, TeachingSession.is_active.is_(True))
    )).scalar_one_or_none()
    if ts is None:
        raise HTTPException(status_code=404, detail="Session not found")

    if not _is_supervisor_or_above(actor):
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    scoped = discipline_scope_for_user(actor)
    if scoped and ts.discipline != scoped:
        raise HTTPException(status_code=403, detail="Discipline scope violation")

    if ts.approval_status != SessionApprovalStatusEnum.submitted.value:
        raise HTTPException(status_code=400, detail=f"Cannot reject session with status '{ts.approval_status}'")

    before = {"approval_status": ts.approval_status}
    ts.approval_status = SessionApprovalStatusEnum.rejected.value
    ts.rejected_at = datetime.utcnow()
    ts.rejected_by = actor.id
    ts.rejection_reason = reason

    await record_audit(
        session,
        actor_id=actor.id,
        action="REJECT",
        entity_type="teaching_session",
        entity_id=ts.id,
        before_state=before,
        after_state={"approval_status": ts.approval_status},
        metadata={"reason": reason},
    )
    await session.commit()
    await session.refresh(ts)
    return await _session_out(session, ts)


async def student_confirm_attendance(
    session: AsyncSession,
    *,
    actor: User,
    session_id: UUID,
) -> SessionOut:
    if role_value(actor) != RoleEnum.student.value:
        raise HTTPException(status_code=403, detail="Only students can confirm attendance")

    from app.db.models import Student
    student = (await session.execute(select(Student).where(Student.user_id == actor.id))).scalar_one_or_none()
    if student is None:
        raise HTTPException(status_code=400, detail="Student profile not found")

    ts = (await session.execute(
        select(TeachingSession).where(TeachingSession.id == session_id, TeachingSession.is_active.is_(True))
    )).scalar_one_or_none()
    if ts is None:
        raise HTTPException(status_code=404, detail="Session not found")

    ss = (await session.execute(
        select(SessionStudent).where(
            SessionStudent.teaching_session_id == ts.id,
            SessionStudent.student_id == student.id,
            SessionStudent.is_active.is_(True),
        )
    )).scalar_one_or_none()
    if ss is None:
        raise HTTPException(status_code=403, detail="You are not linked to this session")

    if ss.attendance_confirmed_at is not None:
        raise HTTPException(status_code=400, detail="Attendance already confirmed")

    ss.attendance_confirmed_at = datetime.utcnow()
    await session.commit()
    await session.refresh(ts)
    return await _session_out(session, ts)


# ── Dashboard ─────────────────────────────────────────────────────────────────

async def get_dashboard_data(
    session: AsyncSession,
    *,
    actor: User,
    group_by: str = "tutor",
    discipline: Optional[str] = None,
    department_id: Optional[UUID] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
) -> DashboardOut:
    if not _is_supervisor_or_above(actor):
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    scoped = discipline_scope_for_user(actor)

    if group_by == "department":
        label_col = TeachingSession.department_id
    else:
        label_col = TeachingSession.tutor_id

    stmt = (
        select(
            label_col,
            func.sum(TeachingSession.duration_minutes).label("total_minutes"),
            func.count(TeachingSession.id).label("session_count"),
        )
        .where(
            TeachingSession.is_active.is_(True),
            TeachingSession.approval_status == SessionApprovalStatusEnum.approved.value,
        )
        .group_by(label_col)
    )

    if scoped:
        stmt = stmt.where(TeachingSession.discipline == scoped)
    if discipline:
        stmt = stmt.where(TeachingSession.discipline == discipline)
    if department_id:
        stmt = stmt.where(TeachingSession.department_id == department_id)
    if date_from:
        stmt = stmt.where(func.date(TeachingSession.starts_at) >= date_from)
    if date_to:
        stmt = stmt.where(func.date(TeachingSession.starts_at) <= date_to)

    rows = (await session.execute(stmt)).all()

    bars: list[DashboardBar] = []
    total_minutes = 0
    total_sessions = 0
    for label_id, mins, count in rows:
        mins = mins or 0
        total_minutes += mins
        total_sessions += count
        bars.append(DashboardBar(label=str(label_id), total_minutes=mins, session_count=count))

    # Count total approved
    approved_count_stmt = select(func.count(TeachingSession.id)).where(
        TeachingSession.is_active.is_(True),
        TeachingSession.approval_status == SessionApprovalStatusEnum.approved.value,
    )
    if scoped:
        approved_count_stmt = approved_count_stmt.where(TeachingSession.discipline == scoped)
    approved_sessions = (await session.execute(approved_count_stmt)).scalar_one()

    return DashboardOut(
        bars=bars,
        total_minutes=total_minutes,
        total_sessions=total_sessions,
        approved_sessions=approved_sessions,
    )


# ── XLSX Export ───────────────────────────────────────────────────────────────

async def export_approved_hours_xlsx(
    session: AsyncSession,
    *,
    actor: User,
    discipline: Optional[str] = None,
    department_id: Optional[UUID] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
) -> bytes:
    if not _is_admin_or_pa(actor):
        raise HTTPException(status_code=403, detail="Only admins can export")

    try:
        import openpyxl
        from openpyxl.styles import Font
    except ImportError:
        raise HTTPException(status_code=500, detail="openpyxl not installed")

    scoped = discipline_scope_for_user(actor)

    stmt = (
        select(TeachingSession)
        .where(
            TeachingSession.is_active.is_(True),
            TeachingSession.approval_status == SessionApprovalStatusEnum.approved.value,
        )
        .order_by(TeachingSession.tutor_id, TeachingSession.starts_at)
    )
    if scoped:
        stmt = stmt.where(TeachingSession.discipline == scoped)
    if discipline:
        stmt = stmt.where(TeachingSession.discipline == discipline)
    if department_id:
        stmt = stmt.where(TeachingSession.department_id == department_id)
    if date_from:
        stmt = stmt.where(func.date(TeachingSession.starts_at) >= date_from)
    if date_to:
        stmt = stmt.where(func.date(TeachingSession.starts_at) <= date_to)

    sessions = (await session.execute(stmt)).scalars().all()

    # Prefetch tutors to get tutor_code/name
    from app.db.models import User as UserModel
    tutor_ids = list({ts.tutor_id for ts in sessions})
    tutors: dict[UUID, dict[str, str]] = {}
    for tid in tutor_ids:
        tutor = (await session.execute(select(Tutor).where(Tutor.id == tid))).scalar_one_or_none()
        if tutor:
            u = (await session.execute(select(UserModel).where(UserModel.id == tutor.user_id))).scalar_one_or_none()
            tutors[tid] = {
                "code": tutor.tutor_code,
                "name": u.full_name if u else str(tid),
            }

    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Approved Hours"

    headers = [
        "Tutor Code", "Tutor Name", "Date", "Start Time",
        "Duration (min)", "Session Type", "Discipline",
        "Billable Minutes", "Billable Amount (SGD)", "Description",
    ]
    ws.append(headers)
    for cell in ws[1]:
        cell.font = Font(bold=True)

    for ts in sessions:
        t = tutors.get(ts.tutor_id, {"code": str(ts.tutor_id), "name": ""})
        session_date = ts.starts_at.date()
        rate = await _get_billable_rate(session, ts.tutor_id, session_date)
        billable_minutes = ts.billable_minutes or 0
        billable_amount = ""
        if rate is not None and billable_minutes:
            billable_amount = f"{(Decimal(billable_minutes) / Decimal(60)) * rate:.2f}"

        ws.append([
            t["code"],
            t["name"],
            session_date.isoformat(),
            ts.starts_at.strftime("%H:%M"),
            ts.duration_minutes,
            ts.session_type,
            ts.discipline,
            billable_minutes,
            billable_amount,
            ts.description or "",
        ])

    buf = io.BytesIO()
    wb.save(buf)
    return buf.getvalue()


# ── Billable Rates ────────────────────────────────────────────────────────────

async def list_billable_rates(
    session: AsyncSession,
    *,
    actor: User,
    tutor_id: UUID,
) -> list[TutorBillableRateOut]:
    if not _is_admin_or_pa(actor):
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    rows = (await session.execute(
        select(TutorBillableRate).where(
            TutorBillableRate.tutor_id == tutor_id,
            TutorBillableRate.is_active.is_(True),
        ).order_by(TutorBillableRate.effective_from.desc())
    )).scalars().all()
    return [
        TutorBillableRateOut(
            id=r.id,
            tutor_id=r.tutor_id,
            rate_per_hour=r.rate_per_hour,
            currency=r.currency,
            effective_from=r.effective_from,
            effective_to=r.effective_to,
            is_active=r.is_active,
            created_at=_fmt_dt(r.created_at) or "",
        )
        for r in rows
    ]


async def create_billable_rate(
    session: AsyncSession,
    *,
    actor: User,
    tutor_id: UUID,
    payload: TutorBillableRateCreate,
) -> TutorBillableRateOut:
    if not _is_admin_or_pa(actor):
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    tutor = (await session.execute(select(Tutor).where(Tutor.id == tutor_id))).scalar_one_or_none()
    if tutor is None:
        raise HTTPException(status_code=404, detail="Tutor not found")

    tbr = TutorBillableRate(
        tutor_id=tutor_id,
        rate_per_hour=payload.rate_per_hour,
        currency=payload.currency,
        effective_from=payload.effective_from,
        effective_to=payload.effective_to,
        created_by=actor.id,
    )
    session.add(tbr)
    await record_audit(
        session,
        actor_id=actor.id,
        action="CREATE",
        entity_type="tutor_billable_rate",
        entity_id=tbr.id,
        before_state=None,
        after_state={"tutor_id": str(tutor_id), "rate_per_hour": str(payload.rate_per_hour)},
    )
    await session.commit()
    await session.refresh(tbr)
    return TutorBillableRateOut(
        id=tbr.id,
        tutor_id=tbr.tutor_id,
        rate_per_hour=tbr.rate_per_hour,
        currency=tbr.currency,
        effective_from=tbr.effective_from,
        effective_to=tbr.effective_to,
        is_active=tbr.is_active,
        created_at=_fmt_dt(tbr.created_at) or "",
    )
