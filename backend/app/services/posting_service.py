from __future__ import annotations

from datetime import date
from typing import Any, Optional
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.postings.schemas import PostingCreate, PostingListResponse, PostingOut, PostingUpdate
from app.db.models import Department, Posting, PostingTutor, Student, Tutor, User
from app.db.models.enums import RoleEnum, StatusEnum
from app.services.access import (
    can_mutate_lifecycle,
    can_read_lifecycle,
    ensure_discipline_scope,
    get_student_for_user,
    get_tutor_for_user,
    role_value,
)
from app.services.audit_service import record_audit
from app.services.rbac import discipline_scope_for_user


def _posting_dict(p: Posting, tutor_ids: list[UUID]) -> dict[str, Any]:
    return {
        "id": str(p.id),
        "title": p.title,
        "student_id": str(p.student_id),
        "academic_cycle_id": str(p.academic_cycle_id),
        "department_id": str(p.department_id),
        "discipline": p.discipline,
        "status": p.status,
        "start_date": p.start_date.isoformat() if p.start_date else None,
        "end_date": p.end_date.isoformat() if p.end_date else None,
        "tutor_ids": [str(t) for t in tutor_ids],
    }


async def _posting_tutor_ids(session: AsyncSession, posting_id: UUID) -> list[UUID]:
    r = await session.execute(
        select(PostingTutor.tutor_id).where(PostingTutor.posting_id == posting_id, PostingTutor.is_active.is_(True))
    )
    return [row[0] for row in r.all()]


async def list_postings(
    session: AsyncSession,
    *,
    actor: User,
    discipline: Optional[str] = None,
    department_id: Optional[UUID] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    status_filter: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
) -> PostingListResponse:
    scoped = discipline_scope_for_user(actor)
    tutor_row = await get_tutor_for_user(session, actor) if role_value(actor) == RoleEnum.tutor.value else None
    student_row = await get_student_for_user(session, actor) if role_value(actor) == RoleEnum.student.value else None

    def _apply_filters(stmt):
        stmt = stmt.where(Posting.is_active.is_(True))
        if student_row is not None:
            stmt = stmt.where(Posting.student_id == student_row.id)
        elif tutor_row is not None:
            stmt = stmt.join(PostingTutor, PostingTutor.posting_id == Posting.id).where(
                PostingTutor.tutor_id == tutor_row.id, PostingTutor.is_active.is_(True)
            )
        elif not can_read_lifecycle(actor):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
        else:
            if scoped is not None:
                stmt = stmt.where(Posting.discipline == scoped)
        if discipline:
            stmt = stmt.where(Posting.discipline == discipline)
        if department_id:
            stmt = stmt.where(Posting.department_id == department_id)
        if status_filter:
            stmt = stmt.where(Posting.status == status_filter)
        if date_from:
            stmt = stmt.where(Posting.start_date >= date_from)
        if date_to:
            stmt = stmt.where(Posting.end_date <= date_to)
        return stmt

    q = _apply_filters(select(Posting))
    cq = _apply_filters(select(func.count()).select_from(Posting))
    total = (await session.execute(cq)).scalar_one()
    rows = (await session.execute(q.order_by(Posting.start_date.desc().nullslast()).limit(limit).offset(offset))).scalars().all()

    items: list[PostingOut] = []
    for p in rows:
        tids = await _posting_tutor_ids(session, p.id)
        items.append(
            PostingOut(
                id=p.id,
                title=p.title,
                student_id=p.student_id,
                academic_cycle_id=p.academic_cycle_id,
                department_id=p.department_id,
                discipline=p.discipline,
                status=p.status,
                start_date=p.start_date,
                end_date=p.end_date,
                tutor_ids=tids,
                created_at=p.created_at,
            )
        )
    return PostingListResponse(items=items, total=total, limit=limit, offset=offset)


async def get_posting(
    session: AsyncSession,
    *,
    actor: User,
    posting_id: UUID,
) -> PostingOut:
    res = await session.execute(select(Posting).where(Posting.id == posting_id))
    p = res.scalar_one_or_none()
    if p is None:
        raise HTTPException(status_code=404, detail="Posting not found")

    student_row = await get_student_for_user(session, actor) if role_value(actor) == RoleEnum.student.value else None
    if student_row is not None:
        if p.student_id != student_row.id:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
    elif not can_read_lifecycle(actor):
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    else:
        scoped = discipline_scope_for_user(actor)
        if scoped is not None and p.discipline != scoped:
            raise HTTPException(status_code=403, detail="Discipline scope violation")

    tids = await _posting_tutor_ids(session, p.id)
    return PostingOut(
        id=p.id,
        title=p.title,
        student_id=p.student_id,
        academic_cycle_id=p.academic_cycle_id,
        department_id=p.department_id,
        discipline=p.discipline,
        status=p.status,
        start_date=p.start_date,
        end_date=p.end_date,
        tutor_ids=tids,
        created_at=p.created_at,
    )


async def create_posting(
    session: AsyncSession,
    *,
    actor: User,
    payload: PostingCreate,
) -> PostingOut:
    if not can_mutate_lifecycle(actor):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
    ensure_discipline_scope(actor, payload.discipline)

    st = (await session.execute(select(Student).where(Student.id == payload.student_id))).scalar_one_or_none()
    if st is None:
        raise HTTPException(status_code=400, detail="Student not found")
    if st.discipline != payload.discipline:
        raise HTTPException(status_code=400, detail="Student discipline mismatch")
    dept = (await session.execute(select(Department).where(Department.id == payload.department_id))).scalar_one_or_none()
    if dept is None:
        raise HTTPException(status_code=400, detail="Department not found")
    if dept.discipline != payload.discipline:
        raise HTTPException(status_code=400, detail="Department discipline mismatch")

    for tid in payload.tutor_ids:
        tu = (await session.execute(select(Tutor).where(Tutor.id == tid))).scalar_one_or_none()
        if tu is None:
            raise HTTPException(status_code=400, detail=f"Tutor {tid} not found")
        if tu.discipline != payload.discipline:
            raise HTTPException(status_code=400, detail="Tutor discipline mismatch")

    p = Posting(
        title=payload.title,
        student_id=payload.student_id,
        academic_cycle_id=payload.academic_cycle_id,
        department_id=payload.department_id,
        discipline=payload.discipline,
        status=StatusEnum.active.value,
        start_date=payload.start_date,
        end_date=payload.end_date,
        created_by=actor.id,
    )
    session.add(p)
    await session.flush()

    for tid in payload.tutor_ids:
        pt = PostingTutor(posting_id=p.id, tutor_id=tid, created_by=actor.id)
        session.add(pt)
    await session.flush()

    tids = await _posting_tutor_ids(session, p.id)
    await record_audit(
        session,
        actor_id=actor.id,
        action="CREATE",
        entity_type="posting",
        entity_id=p.id,
        before_state=None,
        after_state=_posting_dict(p, tids),
    )
    await session.commit()
    await session.refresh(p)
    return await get_posting(session, actor=actor, posting_id=p.id)


async def update_posting(
    session: AsyncSession,
    *,
    actor: User,
    posting_id: UUID,
    payload: PostingUpdate,
) -> PostingOut:
    if not can_mutate_lifecycle(actor):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
    res = await session.execute(select(Posting).where(Posting.id == posting_id))
    p = res.scalar_one_or_none()
    if p is None:
        raise HTTPException(status_code=404, detail="Posting not found")
    ensure_discipline_scope(actor, p.discipline)

    before_tids = await _posting_tutor_ids(session, p.id)
    before = _posting_dict(p, before_tids)

    if payload.title is not None:
        p.title = payload.title
    if payload.start_date is not None:
        p.start_date = payload.start_date
    if payload.end_date is not None:
        p.end_date = payload.end_date
    if payload.status is not None:
        p.status = payload.status

    if payload.tutor_ids is not None:
        for tid in payload.tutor_ids:
            tu = (await session.execute(select(Tutor).where(Tutor.id == tid))).scalar_one_or_none()
            if tu is None or tu.discipline != p.discipline:
                raise HTTPException(status_code=400, detail="Invalid tutor")
        await session.execute(update(PostingTutor).where(PostingTutor.posting_id == p.id).values(is_active=False))
        for tid in payload.tutor_ids:
            session.add(PostingTutor(posting_id=p.id, tutor_id=tid, created_by=actor.id))
        await session.flush()

    await session.flush()
    after_tids = await _posting_tutor_ids(session, p.id)
    await record_audit(
        session,
        actor_id=actor.id,
        action="UPDATE",
        entity_type="posting",
        entity_id=p.id,
        before_state=before,
        after_state=_posting_dict(p, after_tids),
    )
    await session.commit()
    return await get_posting(session, actor=actor, posting_id=p.id)
