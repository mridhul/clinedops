from __future__ import annotations

from typing import Any, Optional
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.students.schemas import (
    PostingHistoryItem,
    StudentCreate,
    StudentDetail,
    StudentListItem,
    StudentListResponse,
    StudentUpdate,
    FeedbackSummaryItem,
)
from app.core.security import hash_password
from app.db.models import Posting, Student, SurveySubmission, TeachingSession, User
from app.db.models.core import SessionStudent
from app.db.models.enums import RoleEnum, StudentLifecycleStatusEnum
from app.services.access import can_mutate_lifecycle, can_read_lifecycle, ensure_discipline_scope, ensure_student_access, role_value
from app.services.audit_service import record_audit
from app.services.rbac import discipline_scope_for_user


def _student_state_dict(s: Student, u: User) -> dict[str, Any]:
    return {
        "id": str(s.id),
        "user_id": str(s.user_id),
        "student_code": s.student_code,
        "email": u.email,
        "full_name": u.full_name,
        "discipline": s.discipline,
        "institution": s.institution,
        "lifecycle_status": s.lifecycle_status,
        "academic_cycle_id": str(s.academic_cycle_id) if s.academic_cycle_id else None,
        "department_id": str(s.department_id) if s.department_id else None,
        "is_active": s.is_active,
    }


async def list_students(
    session: AsyncSession,
    *,
    actor: User,
    discipline: Optional[str] = None,
    institution: Optional[str] = None,
    lifecycle_status: Optional[str] = None,
    academic_cycle_id: Optional[UUID] = None,
    department_id: Optional[UUID] = None,
    status_filter: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
) -> StudentListResponse:
    if not can_read_lifecycle(actor):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
    scoped = discipline_scope_for_user(actor)

    def _apply_filters(stmt):
        if scoped is not None:
            if discipline and discipline != scoped:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Discipline scope violation")
            stmt = stmt.where(Student.discipline == scoped)
        elif discipline:
            stmt = stmt.where(Student.discipline == discipline)
        if institution:
            stmt = stmt.where(Student.institution.ilike(f"%{institution}%"))
        if lifecycle_status:
            stmt = stmt.where(Student.lifecycle_status == lifecycle_status)
        if academic_cycle_id:
            stmt = stmt.where(Student.academic_cycle_id == academic_cycle_id)
        if department_id:
            stmt = stmt.where(Student.department_id == department_id)
        if status_filter == "inactive":
            stmt = stmt.where(Student.is_active.is_(False))
        elif status_filter == "all":
            pass
        else:
            stmt = stmt.where(Student.is_active.is_(True))
        return stmt

    q = _apply_filters(select(Student, User).join(User, Student.user_id == User.id))
    cq = _apply_filters(select(func.count()).select_from(Student).join(User, Student.user_id == User.id))
    total = (await session.execute(cq)).scalar_one()
    q = q.order_by(Student.student_code).limit(limit).offset(offset)
    rows = (await session.execute(q)).all()
    items = [
        StudentListItem(
            id=s.id,
            student_code=s.student_code,
            email=u.email,
            full_name=u.full_name,
            discipline=s.discipline,
            institution=s.institution,
            lifecycle_status=s.lifecycle_status,
            academic_cycle_id=s.academic_cycle_id,
            department_id=s.department_id,
            is_active=s.is_active,
        )
        for s, u in rows
    ]
    return StudentListResponse(items=items, total=total, limit=limit, offset=offset)


async def create_student(
    session: AsyncSession,
    *,
    actor: User,
    payload: StudentCreate,
) -> StudentDetail:
    if not can_mutate_lifecycle(actor):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
    ensure_discipline_scope(actor, payload.discipline)
    # Validation
    if payload.lifecycle_status not in {e.value for e in StudentLifecycleStatusEnum}:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid lifecycle_status: '{payload.lifecycle_status}'. Expected one of: {[e.value for e in StudentLifecycleStatusEnum]}"
        )

    # Check for existing records (including soft-deleted ones for unique constraint awareness)
    dup = await session.execute(select(Student).where(Student.student_code == payload.student_code))
    if dup.scalar_one_or_none():
        raise HTTPException(status_code=400, detail=f"Student record with code '{payload.student_code}' already exists (may be inactive)")

    dup_e = await session.execute(select(User).where(User.email == payload.email))
    if dup_e.scalar_one_or_none():
        raise HTTPException(status_code=400, detail=f"User with email '{payload.email}' already exists")

    user = User(
        email=payload.email,
        hashed_password=hash_password(payload.password),
        full_name=payload.full_name,
        role=RoleEnum.student.value,
        discipline=payload.discipline,
        is_active=True,
        is_verified=True,
        created_by=actor.id,
    )
    session.add(user)
    await session.flush()

    st = Student(
        user_id=user.id,
        student_code=payload.student_code,
        institution=payload.institution,
        lifecycle_status=payload.lifecycle_status,
        discipline=payload.discipline,
        academic_cycle_id=payload.academic_cycle_id,
        department_id=payload.department_id,
        created_by=actor.id,
    )
    session.add(st)
    await session.flush()

    await record_audit(
        session,
        actor_id=actor.id,
        action="CREATE",
        entity_type="student",
        entity_id=st.id,
        before_state=None,
        after_state=_student_state_dict(st, user),
    )
    await session.commit()
    await session.refresh(st)
    await session.refresh(user)
    return await get_student_detail(session, actor=actor, student_id=st.id)


async def get_student_detail(
    session: AsyncSession,
    *,
    actor: User,
    student_id: UUID,
) -> StudentDetail:
    st = await ensure_student_access(session, actor=actor, student_id=student_id)
    res = await session.execute(select(User).where(User.id == st.user_id))
    user = res.scalar_one()

    postings = (
        await session.execute(
            select(Posting)
            .where(Posting.student_id == st.id, Posting.is_active.is_(True))
            .order_by(Posting.start_date.desc().nullslast())
        )
    ).scalars().all()

    posting_history = [
        PostingHistoryItem(
            id=p.id,
            title=p.title,
            status=p.status,
            start_date=p.start_date,
            end_date=p.end_date,
            department_id=p.department_id,
            created_at=p.created_at,
        )
        for p in postings
    ]

    subs = (
        await session.execute(
            select(SurveySubmission)
            .where(SurveySubmission.student_id == st.id)
            .order_by(SurveySubmission.created_at.desc())
            .limit(20)
        )
    ).scalars().all()
    feedback_recent = [
        FeedbackSummaryItem(id=s.id, template_id=s.template_id, status=s.status, created_at=s.created_at)
        for s in subs
    ]

    hours_q = (
        select(
            func.coalesce(
                func.sum(
                    func.extract("epoch", TeachingSession.ends_at - TeachingSession.starts_at) / 3600.0
                ),
                0.0,
            )
        )
        .select_from(SessionStudent)
        .join(TeachingSession, SessionStudent.teaching_session_id == TeachingSession.id)
        .where(SessionStudent.student_id == st.id, SessionStudent.is_active.is_(True))
        .where(TeachingSession.ends_at.isnot(None))
    )
    teaching_hours_total = float((await session.execute(hours_q)).scalar_one() or 0.0)

    return StudentDetail(
        id=st.id,
        student_code=st.student_code,
        email=user.email,
        full_name=user.full_name,
        discipline=st.discipline,
        institution=st.institution,
        lifecycle_status=st.lifecycle_status,
        academic_cycle_id=st.academic_cycle_id,
        department_id=st.department_id,
        is_active=st.is_active,
        teaching_hours_total=teaching_hours_total,
        posting_history=posting_history,
        feedback_recent=feedback_recent,
    )


async def update_student(
    session: AsyncSession,
    *,
    actor: User,
    student_id: UUID,
    payload: StudentUpdate,
) -> StudentDetail:
    if not can_mutate_lifecycle(actor):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
    st = await ensure_student_access(session, actor=actor, student_id=student_id)
    res = await session.execute(select(User).where(User.id == st.user_id))
    user = res.scalar_one()

    before = _student_state_dict(st, user)
    if payload.full_name is not None:
        user.full_name = payload.full_name
    if payload.institution is not None:
        st.institution = payload.institution
    if payload.discipline is not None:
        ensure_discipline_scope(actor, payload.discipline)
        st.discipline = payload.discipline
        user.discipline = payload.discipline
    if payload.lifecycle_status is not None:
        if payload.lifecycle_status not in {e.value for e in StudentLifecycleStatusEnum}:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid lifecycle_status: '{payload.lifecycle_status}'. Expected one of: {[e.value for e in StudentLifecycleStatusEnum]}"
            )
        st.lifecycle_status = payload.lifecycle_status
    if payload.academic_cycle_id is not None:
        st.academic_cycle_id = payload.academic_cycle_id
    if payload.department_id is not None:
        st.department_id = payload.department_id
    if payload.is_active is not None:
        st.is_active = payload.is_active
        user.is_active = payload.is_active

    await session.flush()
    after = _student_state_dict(st, user)
    await record_audit(
        session,
        actor_id=actor.id,
        action="UPDATE",
        entity_type="student",
        entity_id=st.id,
        before_state=before,
        after_state=after,
    )
    await session.commit()
    return await get_student_detail(session, actor=actor, student_id=st.id)


async def soft_delete_student(
    session: AsyncSession,
    *,
    actor: User,
    student_id: UUID,
) -> None:
    if not can_mutate_lifecycle(actor):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
    st = await ensure_student_access(session, actor=actor, student_id=student_id)
    res = await session.execute(select(User).where(User.id == st.user_id))
    user = res.scalar_one()

    before = _student_state_dict(st, user)
    st.is_active = False
    user.is_active = False
    await session.flush()
    after = _student_state_dict(st, user)
    await record_audit(
        session,
        actor_id=actor.id,
        action="DELETE",
        entity_type="student",
        entity_id=st.id,
        before_state=before,
        after_state=after,
    )
    await session.commit()
