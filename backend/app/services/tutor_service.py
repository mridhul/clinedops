from __future__ import annotations

from typing import Any, Optional
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.tutors.schemas import TutorCreate, TutorDetail, TutorListItem, TutorListResponse, TutorUpdate
from app.core.security import hash_password
from app.db.models import TeachingSession, Tutor, User
from app.db.models.enums import RoleEnum
from app.services.access import can_mutate_lifecycle, can_read_lifecycle, ensure_discipline_scope, ensure_tutor_access, role_value
from app.services.audit_service import record_audit
from app.services.rbac import discipline_scope_for_user


def _tutor_state_dict(t: Tutor, u: User) -> dict[str, Any]:
    return {
        "id": str(t.id),
        "user_id": str(t.user_id),
        "tutor_code": t.tutor_code,
        "email": u.email,
        "full_name": u.full_name,
        "discipline": t.discipline,
        "department_id": str(t.department_id) if t.department_id else None,
        "academic_cycle_id": str(t.academic_cycle_id) if t.academic_cycle_id else None,
        "is_active": t.is_active,
    }


async def list_tutors(
    session: AsyncSession,
    *,
    actor: User,
    discipline: Optional[str] = None,
    department_id: Optional[UUID] = None,
    active_only: Optional[bool] = True,
    limit: int = 50,
    offset: int = 0,
) -> TutorListResponse:
    if not can_read_lifecycle(actor) and role_value(actor) != RoleEnum.tutor.value:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
    scoped = discipline_scope_for_user(actor)
    if role_value(actor) == RoleEnum.tutor.value:
        # Tutors only see themselves in list
        q = select(Tutor, User).join(User, Tutor.user_id == User.id).where(Tutor.user_id == actor.id)
        cq = select(func.count()).select_from(Tutor).join(User, Tutor.user_id == User.id).where(Tutor.user_id == actor.id)
    else:
        def _apply_filters(stmt):
            if scoped is not None:
                if discipline and discipline != scoped:
                    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Discipline scope violation")
                stmt = stmt.where(Tutor.discipline == scoped)
            elif discipline:
                stmt = stmt.where(Tutor.discipline == discipline)
            if department_id:
                stmt = stmt.where(Tutor.department_id == department_id)
            if active_only:
                stmt = stmt.where(Tutor.is_active.is_(True))
            return stmt

        q = _apply_filters(select(Tutor, User).join(User, Tutor.user_id == User.id))
        cq = _apply_filters(select(func.count()).select_from(Tutor).join(User, Tutor.user_id == User.id))

    total = (await session.execute(cq)).scalar_one()
    q = q.order_by(Tutor.tutor_code).limit(limit).offset(offset)
    rows = (await session.execute(q)).all()
    items = [
        TutorListItem(
            id=t.id,
            user_id=t.user_id,
            tutor_code=t.tutor_code,
            email=u.email,
            full_name=u.full_name,
            discipline=t.discipline,
            department_id=t.department_id,
            academic_cycle_id=t.academic_cycle_id,
            is_active=t.is_active,
        )
        for t, u in rows
    ]
    return TutorListResponse(items=items, total=total, limit=limit, offset=offset)


async def create_tutor(
    session: AsyncSession,
    *,
    actor: User,
    payload: TutorCreate,
) -> TutorDetail:
    if not can_mutate_lifecycle(actor):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
    ensure_discipline_scope(actor, payload.discipline)

    dup = await session.execute(select(Tutor).where(Tutor.tutor_code == payload.tutor_code))
    if dup.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="tutor_code already exists")

    existing_user = (await session.execute(select(User).where(User.email == payload.email))).scalar_one_or_none()

    if existing_user:
        if role_value(existing_user) != RoleEnum.tutor.value:
            raise HTTPException(
                status_code=400,
                detail=(
                    "A user with this email already exists with a different role. "
                    "Change the role in Admin Console or use another email."
                ),
            )
        if (
            await session.execute(select(Tutor).where(Tutor.user_id == existing_user.id))
        ).scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Tutor profile already exists for this email")

        if payload.password:
            existing_user.hashed_password = hash_password(payload.password)
        if payload.full_name is not None:
            existing_user.full_name = payload.full_name
        existing_user.discipline = payload.discipline

        tu = Tutor(
            user_id=existing_user.id,
            tutor_code=payload.tutor_code,
            discipline=payload.discipline,
            department_id=payload.department_id,
            academic_cycle_id=payload.academic_cycle_id,
            created_by=actor.id,
        )
        session.add(tu)
        await session.flush()

        await record_audit(
            session,
            actor_id=actor.id,
            action="CREATE",
            entity_type="tutor",
            entity_id=tu.id,
            before_state=None,
            after_state=_tutor_state_dict(tu, existing_user),
        )
        await session.commit()
        return await get_tutor_detail(session, actor=actor, tutor_id=tu.id)

    if not payload.password:
        raise HTTPException(
            status_code=400,
            detail="Password is required when creating a new user account",
        )

    user = User(
        email=payload.email,
        hashed_password=hash_password(payload.password),
        full_name=payload.full_name,
        role=RoleEnum.tutor.value,
        discipline=payload.discipline,
        is_active=True,
        is_verified=True,
        created_by=actor.id,
    )
    session.add(user)
    await session.flush()

    tu = Tutor(
        user_id=user.id,
        tutor_code=payload.tutor_code,
        discipline=payload.discipline,
        department_id=payload.department_id,
        academic_cycle_id=payload.academic_cycle_id,
        created_by=actor.id,
    )
    session.add(tu)
    await session.flush()

    await record_audit(
        session,
        actor_id=actor.id,
        action="CREATE",
        entity_type="tutor",
        entity_id=tu.id,
        before_state=None,
        after_state=_tutor_state_dict(tu, user),
    )
    await session.commit()
    return await get_tutor_detail(session, actor=actor, tutor_id=tu.id)


async def get_tutor_detail(
    session: AsyncSession,
    *,
    actor: User,
    tutor_id: UUID,
) -> TutorDetail:
    t = await ensure_tutor_access(session, actor=actor, tutor_id=tutor_id)
    res = await session.execute(select(User).where(User.id == t.user_id))
    user = res.scalar_one()

    cnt = await session.execute(
        select(func.count()).select_from(TeachingSession).where(
            TeachingSession.tutor_id == t.id, TeachingSession.is_active.is_(True)
        )
    )
    teaching_sessions_count = int(cnt.scalar_one() or 0)

    return TutorDetail(
        id=t.id,
        user_id=t.user_id,
        tutor_code=t.tutor_code,
        email=user.email,
        full_name=user.full_name,
        discipline=t.discipline,
        department_id=t.department_id,
        academic_cycle_id=t.academic_cycle_id,
        is_active=t.is_active,
        teaching_sessions_count=teaching_sessions_count,
    )


async def update_tutor(
    session: AsyncSession,
    *,
    actor: User,
    tutor_id: UUID,
    payload: TutorUpdate,
) -> TutorDetail:
    if not can_mutate_lifecycle(actor):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
    t = await ensure_tutor_access(session, actor=actor, tutor_id=tutor_id)
    res = await session.execute(select(User).where(User.id == t.user_id))
    user = res.scalar_one()

    before = _tutor_state_dict(t, user)
    if payload.full_name is not None:
        user.full_name = payload.full_name
    if payload.discipline is not None:
        ensure_discipline_scope(actor, payload.discipline)
        t.discipline = payload.discipline
        user.discipline = payload.discipline
    if payload.department_id is not None:
        t.department_id = payload.department_id
    if payload.academic_cycle_id is not None:
        t.academic_cycle_id = payload.academic_cycle_id
    if payload.is_active is not None:
        t.is_active = payload.is_active
        user.is_active = payload.is_active

    await session.flush()
    after = _tutor_state_dict(t, user)
    await record_audit(
        session,
        actor_id=actor.id,
        action="UPDATE",
        entity_type="tutor",
        entity_id=t.id,
        before_state=before,
        after_state=after,
    )
    await session.commit()
    return await get_tutor_detail(session, actor=actor, tutor_id=t.id)


async def soft_delete_tutor(
    session: AsyncSession,
    *,
    actor: User,
    tutor_id: UUID,
) -> None:
    if not can_mutate_lifecycle(actor):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
    t = await ensure_tutor_access(session, actor=actor, tutor_id=tutor_id)
    res = await session.execute(select(User).where(User.id == t.user_id))
    user = res.scalar_one()

    before = _tutor_state_dict(t, user)
    t.is_active = False
    user.is_active = False
    await session.flush()
    after = _tutor_state_dict(t, user)
    await record_audit(
        session,
        actor_id=actor.id,
        action="DELETE",
        entity_type="tutor",
        entity_id=t.id,
        before_state=before,
        after_state=after,
    )
    await session.commit()
