from __future__ import annotations

from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.deps import get_current_user, require_roles
from app.api.v1.shadowing.schemas import (
    MentorAssignmentCreate,
    ShadowingApplicationCreate,
    ShadowingApplicationOut,
    ShadowingApplicationUpdate,
)
from app.db.models import JobShadowingApplication, MentorAssignment, User, Student
from app.db.models.enums import RoleEnum
from app.db.session import get_db_session
from app.schemas.envelope import Envelope

router = APIRouter(tags=["shadowing"])


@router.post("/applications", response_model=Envelope[ShadowingApplicationOut])
async def apply_for_shadowing(
    payload: ShadowingApplicationCreate,
    db: AsyncSession = Depends(get_db_session),
    actor: User = Depends(get_current_user),
) -> Any:
    """Student applies for job shadowing."""
    # Ensure actor is a student
    stmt = select(Student).where(Student.user_id == actor.id)
    student = (await db.execute(stmt)).scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=403, detail="Only students can apply for shadowing")

    app = JobShadowingApplication(
        student_id=student.id,
        discipline=payload.discipline,
        reason=payload.reason,
        status="pending"
    )
    db.add(app)
    await db.commit()
    await db.refresh(app)
    
    # Load assignments for response_model
    stmt = select(JobShadowingApplication).where(JobShadowingApplication.id == app.id)
    app = (await db.execute(stmt)).scalar_one()
    
    return Envelope(data=ShadowingApplicationOut.from_orm(app))


@router.get("/applications", response_model=Envelope[list[ShadowingApplicationOut]])
async def list_applications(
    db: AsyncSession = Depends(get_db_session),
    actor: User = Depends(require_roles([RoleEnum.super_admin, RoleEnum.programme_admin, RoleEnum.supervisor])),
) -> Any:
    """List shadowing applications (Admin/Dept Head only)."""
    stmt = select(JobShadowingApplication).order_by(JobShadowingApplication.created_at.desc())
    result = await db.execute(stmt)
    apps = result.scalars().all()
    return Envelope(data=[ShadowingApplicationOut.from_orm(a) for a in apps])


@router.patch("/applications/{application_id}", response_model=Envelope[ShadowingApplicationOut])
async def update_application_status(
    application_id: UUID,
    payload: ShadowingApplicationUpdate,
    db: AsyncSession = Depends(get_db_session),
    actor: User = Depends(require_roles([RoleEnum.super_admin, RoleEnum.programme_admin, RoleEnum.supervisor])),
) -> Any:
    """Shortlist or reject an application."""
    stmt = select(JobShadowingApplication).where(JobShadowingApplication.id == application_id)
    app = (await db.execute(stmt)).scalar_one_or_none()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    if payload.status:
        app.status = payload.status
    if payload.admin_notes:
        app.admin_notes = payload.admin_notes
    
    await db.commit()
    await db.refresh(app)
    return Envelope(data=ShadowingApplicationOut.from_orm(app))


@router.post("/applications/{application_id}/assign-mentor", response_model=Envelope[ShadowingApplicationOut])
async def assign_mentor(
    application_id: UUID,
    payload: MentorAssignmentCreate,
    db: AsyncSession = Depends(get_db_session),
    actor: User = Depends(require_roles([RoleEnum.super_admin, RoleEnum.programme_admin, RoleEnum.supervisor])),
) -> Any:
    """Assign a mentor (Tutor) to an application."""
    stmt = select(JobShadowingApplication).where(JobShadowingApplication.id == application_id)
    app = (await db.execute(stmt)).scalar_one_or_none()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    # Verify mentor exists and is a tutor (optional but good practice)
    # For now we just verify user exists
    mentor = await db.get(User, payload.mentor_user_id)
    if not mentor:
        raise HTTPException(status_code=404, detail="Mentor user not found")

    assignment = MentorAssignment(
        application_id=app.id,
        mentor_user_id=mentor.id,
        status="assigned",
        notes=payload.notes
    )
    db.add(assignment)
    
    # Auto-status update to shortlisted if it was pending
    if app.status == "pending":
        app.status = "shortlisted"

    await db.commit()
    await db.refresh(app)
    return Envelope(data=ShadowingApplicationOut.from_orm(app))
