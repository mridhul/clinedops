from __future__ import annotations

from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.deps import get_current_user, require_roles
from app.db.models import User
from app.db.models.enums import RoleEnum
from app.db.session import get_db_session
from app.schemas.envelope import Envelope
from app.schemas.surveys import (
    SurveyTemplateCreate,
    SurveyTemplateRead,
    SurveyAssignmentRead,
    SurveySubmissionCreate,
    SurveySubmissionRead,
    TutorFeedbackSummary,
    CompletionRateSchema
)
from app.services.survey_service import SurveyService

router = APIRouter(tags=["surveys"])

# -- Templates --

@router.post("/templates", response_model=Envelope[SurveyTemplateRead])
async def create_template(
    payload: SurveyTemplateCreate,
    db: AsyncSession = Depends(get_db_session),
    actor: User = Depends(require_roles([RoleEnum.super_admin, RoleEnum.programme_admin]))
) -> Envelope[SurveyTemplateRead]:
    template = await SurveyService.create_template(db, actor=actor, payload=payload)
    return Envelope(data=SurveyTemplateRead.model_validate(template))

@router.get("/templates", response_model=Envelope[List[SurveyTemplateRead]])
async def list_templates(
    discipline: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db_session),
    actor: User = Depends(get_current_user)
) -> Envelope[List[SurveyTemplateRead]]:
    templates = await SurveyService.list_templates(db, discipline=discipline)
    return Envelope(data=[SurveyTemplateRead.model_validate(t) for t in templates])

@router.get("/templates/{template_id}", response_model=Envelope[SurveyTemplateRead])
async def get_template(
    template_id: UUID,
    db: AsyncSession = Depends(get_db_session),
    actor: User = Depends(get_current_user)
) -> Envelope[SurveyTemplateRead]:
    template = await SurveyService.get_template(db, template_id=template_id)
    return Envelope(data=SurveyTemplateRead.model_validate(template))

# -- Assignments --

@router.get("/assignments", response_model=Envelope[List[SurveyAssignmentRead]])
async def list_student_assignments(
    db: AsyncSession = Depends(get_db_session),
    actor: User = Depends(get_current_user)
) -> Envelope[List[SurveyAssignmentRead]]:
    # In a real impl, we'd add list_assignments to SurveyService
    from sqlalchemy import select
    from app.db.models import SurveyAssignment, Student
    
    # If student, filter by their student_id
    stmt = select(SurveyAssignment).where(SurveyAssignment.is_active == True)
    if actor.role == RoleEnum.student:
        student_stmt = select(Student).where(Student.user_id == actor.id)
        student = (await db.execute(student_stmt)).scalar_one_or_none()
        if not student:
            return Envelope(data=[])
        stmt = stmt.where(SurveyAssignment.student_id == student.id)
    
    assignments = (await db.execute(stmt)).scalars().all()
    return Envelope(data=[SurveyAssignmentRead.model_validate(a) for a in assignments])

# -- Submissions --

@router.post("/submissions", response_model=Envelope[SurveySubmissionRead])
async def submit_survey(
    payload: SurveySubmissionCreate,
    db: AsyncSession = Depends(get_db_session),
    actor: User = Depends(get_current_user)
) -> Envelope[SurveySubmissionRead]:
    submission = await SurveyService.submit_survey(db, actor=actor, payload=payload)
    return Envelope(data=SurveySubmissionRead.model_validate(submission))

# -- Analytics --

@router.get("/tutors/{tutor_id}/feedback", response_model=Envelope[TutorFeedbackSummary])
async def get_tutor_feedback(
    tutor_id: UUID,
    db: AsyncSession = Depends(get_db_session),
    actor: User = Depends(get_current_user)
) -> Envelope[TutorFeedbackSummary]:
    summary = await SurveyService.get_tutor_feedback_summary(db, tutor_id=tutor_id)
    return Envelope(data=summary)
