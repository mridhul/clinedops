from __future__ import annotations

from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.api.v1.deps import get_current_user, has_permission, require_roles
from app.db.models import User
from app.db.models.enums import RoleEnum
from app.db.session import get_db_session
from app.schemas.envelope import Envelope
from app.schemas.surveys import (
    SurveyTemplateCreate,
    SurveyTemplateUpdate,
    SurveyTemplateRead,
    SurveyAssignmentRead,
    SurveySubmissionCreate,
    SurveySubmissionRead,
    ManualSurveyAssignmentCreate,
    TutorFeedbackSummary,
    CompletionRateSchema
)
from app.services.access import role_value
from app.services.survey_service import SurveyService

router = APIRouter(tags=["surveys"])

# -- Templates --

@router.post("/templates", response_model=Envelope[SurveyTemplateRead])
async def create_template(
    payload: SurveyTemplateCreate,
    db: AsyncSession = Depends(get_db_session),
    actor: User = Depends(has_permission("manage_surveys"))
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

@router.patch("/templates/{template_id}", response_model=Envelope[SurveyTemplateRead])
async def update_template(
    template_id: UUID,
    payload: SurveyTemplateUpdate,
    db: AsyncSession = Depends(get_db_session),
    actor: User = Depends(has_permission("manage_surveys"))
) -> Envelope[SurveyTemplateRead]:
    template = await SurveyService.update_template(db, actor=actor, template_id=template_id, payload=payload)
    return Envelope(data=SurveyTemplateRead.model_validate(template))

@router.delete("/templates/{template_id}", response_model=Envelope[bool])
async def delete_template(
    template_id: UUID,
    db: AsyncSession = Depends(get_db_session),
    actor: User = Depends(has_permission("manage_surveys"))
) -> Envelope[bool]:
    success = await SurveyService.delete_template(db, actor=actor, template_id=template_id)
    return Envelope(data=success)

# -- Assignments --

@router.post("/assignments/batch", response_model=Envelope[int])
async def batch_assign_surveys(
    db: AsyncSession = Depends(get_db_session),
    actor: User = Depends(has_permission("manage_surveys"))
) -> Envelope[int]:
    count = await SurveyService.batch_sessions_into_assignments(db)
    return Envelope(data=count)

@router.post("/assignments/manual", response_model=Envelope[int])
async def manual_assign_surveys(
    payload: ManualSurveyAssignmentCreate,
    db: AsyncSession = Depends(get_db_session),
    actor: User = Depends(has_permission("manage_surveys"))
) -> Envelope[int]:
    count = await SurveyService.manual_assign_surveys(db, actor=actor, payload=payload)
    return Envelope(data=count)


@router.get("/assignments", response_model=Envelope[List[SurveyAssignmentRead]])
async def list_student_assignments(
    db: AsyncSession = Depends(get_db_session),
    actor: User = Depends(get_current_user)
) -> Envelope[List[SurveyAssignmentRead]]:
    # In a real impl, we'd add list_assignments to SurveyService
    from sqlalchemy import select
    from sqlalchemy.orm import selectinload
    from app.db.models import SurveyAssignment, Student
    
    # If student, filter by their student_id
    stmt = select(SurveyAssignment).options(selectinload(SurveyAssignment.template)).where(SurveyAssignment.is_active == True)
    if role_value(actor) == RoleEnum.student.value:
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


@router.get("/submissions/me", response_model=Envelope[List[SurveySubmissionRead]])
async def list_my_survey_submissions(
    db: AsyncSession = Depends(get_db_session),
    actor: User = Depends(require_roles([RoleEnum.student])),
) -> Envelope[List[SurveySubmissionRead]]:
    rows = await SurveyService.list_my_submissions(db, actor=actor)
    return Envelope(data=[SurveySubmissionRead.model_validate(r) for r in rows])


# -- Analytics --

@router.get("/tutors/{tutor_id}/feedback", response_model=Envelope[TutorFeedbackSummary])
async def get_tutor_feedback(
    tutor_id: UUID,
    db: AsyncSession = Depends(get_db_session),
    actor: User = Depends(get_current_user)
) -> Envelope[TutorFeedbackSummary]:
    summary = await SurveyService.get_tutor_feedback_summary(db, tutor_id=tutor_id)
    return Envelope(data=summary)


@router.get("/my/feedback", response_model=Envelope[TutorFeedbackSummary])
async def get_my_tutor_feedback(
    db: AsyncSession = Depends(get_db_session),
    actor: User = Depends(require_roles([RoleEnum.tutor])),
) -> Envelope[TutorFeedbackSummary]:
    from app.db.models import Tutor

    tutor = (await db.execute(select(Tutor).where(Tutor.user_id == actor.id, Tutor.is_active.is_(True)))).scalars().first()
    if tutor is None:
        raise HTTPException(status_code=400, detail="Tutor profile not found")

    summary = await SurveyService.get_tutor_feedback_summary(db, tutor_id=tutor.id)
    return Envelope(data=summary)
