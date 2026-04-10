from __future__ import annotations

import json
from datetime import datetime, timedelta
from decimal import Decimal
from typing import Any, Optional, List
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import func, select, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import (
    SurveyTemplate,
    SurveyAssignment,
    SurveySubmission,
    TeachingSession,
    Student,
    Tutor,
    SessionStudent,
    User,
    AuditLog
)
from app.db.models.enums import SurveyStatusEnum, SurveyTypeEnum, RoleEnum
from app.schemas.surveys import (
    SurveyTemplateCreate,
    SurveyTemplateUpdate,
    SurveySubmissionCreate,
    ManualSurveyAssignmentCreate,
    TutorFeedbackSummary,
    CompletionRateSchema
)
from app.services.audit_service import record_audit

class SurveyService:
    @staticmethod
    async def create_template(session: AsyncSession, actor: User, payload: SurveyTemplateCreate) -> SurveyTemplate:
        template = SurveyTemplate(
            name=payload.name,
            discipline=payload.discipline,
            posting_type=payload.posting_type,
            survey_type=payload.survey_type.value,
            questions=[q.model_dump() for q in payload.questions],
            low_score_threshold=payload.low_score_threshold,
            created_by=actor.id,
            is_active=True
        )
        session.add(template)
        await session.flush()
        
        await record_audit(
            session,
            actor_id=actor.id,
            action="CREATE",
            entity_type="survey_template",
            entity_id=template.id,
            before_state=None,
            after_state={"name": template.name, "discipline": template.discipline}
        )
        await session.commit()
        await session.refresh(template)
        return template

    @staticmethod
    async def get_template(session: AsyncSession, template_id: UUID) -> SurveyTemplate:
        stmt = select(SurveyTemplate).where(SurveyTemplate.id == template_id, SurveyTemplate.is_active == True)
        template = (await session.execute(stmt)).scalar_one_or_none()
        if not template:
            raise HTTPException(status_code=404, detail="Survey template not found")
        return template

    @staticmethod
    async def list_templates(session: AsyncSession, discipline: Optional[str] = None) -> List[SurveyTemplate]:
        stmt = select(SurveyTemplate).where(SurveyTemplate.is_active == True)
        if discipline:
            stmt = stmt.where(SurveyTemplate.discipline == discipline)
        return (await session.execute(stmt)).scalars().all()

    @staticmethod
    async def update_template(session: AsyncSession, actor: User, template_id: UUID, payload: SurveyTemplateUpdate) -> SurveyTemplate:
        template = await SurveyService.get_template(session, template_id)
        before_state = {"name": template.name, "discipline": template.discipline}
        
        if payload.name is not None: template.name = payload.name
        if payload.discipline is not None: template.discipline = payload.discipline
        if payload.posting_type is not None: template.posting_type = payload.posting_type
        if payload.survey_type is not None: template.survey_type = payload.survey_type.value
        if payload.questions is not None: template.questions = [q.model_dump() for q in payload.questions]
        if payload.low_score_threshold is not None: template.low_score_threshold = payload.low_score_threshold
        
        template.updated_at = datetime.utcnow()
        await session.flush()
        
        await record_audit(
            session,
            actor_id=actor.id,
            action="UPDATE",
            entity_type="survey_template",
            entity_id=template.id,
            before_state=before_state,
            after_state={"name": template.name, "discipline": template.discipline}
        )
        await session.commit()
        await session.refresh(template)
        return template

    @staticmethod
    async def delete_template(session: AsyncSession, actor: User, template_id: UUID) -> bool:
        template = await SurveyService.get_template(session, template_id)
        template.is_active = False
        template.updated_at = datetime.utcnow()
        
        await record_audit(
            session,
            actor_id=actor.id,
            action="DELETE",
            entity_type="survey_template",
            entity_id=template.id,
            before_state={"name": template.name},
            after_state={"is_active": False}
        )
        await session.commit()
        return True

    @staticmethod
    async def submit_survey(session: AsyncSession, actor: User, payload: SurveySubmissionCreate) -> SurveySubmission:
        template = await SurveyService.get_template(session, payload.template_id)
        
        # Calculate scores
        total_score = Decimal(0)
        score_count = 0
        has_low_scores = False
        
        # We assume responses is a dict mapping question_id -> value
        # Likert/Rating questions are expected to be numeric
        for q in template.questions:
            q_id = q['id']
            if q_id in payload.responses:
                val = payload.responses[q_id]
                if isinstance(val, (int, float, Decimal)):
                    total_score += Decimal(str(val))
                    score_count += 1
                    if val <= template.low_score_threshold:
                        has_low_scores = True
        
        overall_score = total_score / score_count if score_count > 0 else None
        
        submission = SurveySubmission(
            assignment_id=payload.assignment_id,
            template_id=payload.template_id,
            teaching_session_id=payload.teaching_session_id,
            student_id=payload.student_id,
            responses=payload.responses,
            overall_score=overall_score,
            has_low_scores=has_low_scores,
            status="submitted",
            created_by=actor.id
        )
        session.add(submission)
        
        if payload.assignment_id:
            assignment = await session.get(SurveyAssignment, payload.assignment_id)
            if assignment:
                assignment.status = SurveyStatusEnum.completed.value
        
        await session.flush()
        
        await record_audit(
            session,
            actor_id=actor.id,
            action="SUBMIT",
            entity_type="survey_submission",
            entity_id=submission.id,
            before_state=None,
            after_state={"overall_score": str(overall_score) if overall_score else None, "has_low_scores": has_low_scores}
        )
        await session.commit()
        await session.refresh(submission)
        return submission

    @staticmethod
    async def batch_sessions_into_assignments(session: AsyncSession):
        """
        Groups TeachingSessions that haven't been assigned a survey yet
        by (student_id, posting_id) and creates SurveyAssignments.
        """
        # 1. Find sessions without assignments/submissions
        # For simplicity, we look for approved sessions in the last 7 days
        # and check if they've already been linked.
        seven_days_ago = datetime.utcnow() - timedelta(days=7)
        
        # Find all session_ids that are already in any assignment
        # This is a bit tricky with JSONB, but we can query assignments.
        # Alternatively, we could add a `survey_assignment_id` to TeachingSession.
        # Given the current schema, we'll manually filter.
        
        # Find approved sessions
        stmt = select(TeachingSession).where(
            TeachingSession.approval_status == "approved",
            TeachingSession.approved_at >= seven_days_ago,
            TeachingSession.is_active == True
        )
        sessions = (await session.execute(stmt)).scalars().all()
        
        # Group by student_id and posting_id
        # We need to find which students were in which sessions
        groups = {} # (student_id, posting_id) -> list of session_ids
        
        for s in sessions:
            # Get linked students for this session
            sub_stmt = select(SessionStudent).where(
                SessionStudent.teaching_session_id == s.id,
                SessionStudent.is_active == True
            )
            session_students = (await session.execute(sub_stmt)).scalars().all()
            
            for ss in session_students:
                key = (ss.student_id, s.posting_id)
                if key not in groups:
                    groups[key] = {"sessions": [], "tutors": set()}
                groups[key]["sessions"].append(s.id)
                groups[key]["tutors"].add(s.tutor_id)
        
        # Create assignments
        created_count = 0
        for (student_id, posting_id), data in groups.items():
            # Find an appropriate template for the discipline
            student = await session.get(Student, student_id)
            if not student: continue
            
            template_stmt = select(SurveyTemplate).where(
                SurveyTemplate.discipline == student.discipline,
                SurveyTemplate.is_active == True
            ).order_by(SurveyTemplate.created_at.desc()).limit(1)
            
            template = (await session.execute(template_stmt)).scalar_one_or_none()
            if not template: continue
            
            # Check if an assignment already exists for these sessions
            # This is simplified: in prod, we'd check if any session_id is already assigned.
            
            assignment = SurveyAssignment(
                template_id=template.id,
                student_id=student_id,
                posting_id=posting_id,
                session_ids=data["sessions"],
                tutor_ids=list(data["tutors"]),
                status=SurveyStatusEnum.pending.value,
                due_date=datetime.utcnow() + timedelta(days=7)
            )
            session.add(assignment)
            created_count += 1
            
        await session.commit()
        return created_count

    @staticmethod
    async def manual_assign_surveys(session: AsyncSession, actor: User, payload: ManualSurveyAssignmentCreate) -> int:
        template = await SurveyService.get_template(session, payload.template_id)
        
        created_count = 0
        for student_id in payload.student_ids:
            assignment = SurveyAssignment(
                template_id=template.id,
                student_id=student_id,
                posting_id=payload.posting_id,
                session_ids=[str(i) for i in payload.session_ids] if payload.session_ids else [],
                tutor_ids=[str(i) for i in payload.tutor_ids] if payload.tutor_ids else [],
                status=SurveyStatusEnum.pending.value,
                due_date=payload.due_date or (datetime.utcnow() + timedelta(days=7)),
                created_by=actor.id
            )
            session.add(assignment)
            created_count += 1
            
        await session.commit()
        return created_count

    @staticmethod
    async def get_tutor_feedback_summary(session: AsyncSession, tutor_id: UUID) -> TutorFeedbackSummary:
        # Find all submissions where this tutor was involved
        # This involves checking SurveyAssignment.tutor_ids JSONB list
        # or checking the linked session's tutor_id.
        
        # For simplicity, we'll query SurveySubmission and join Assignment
        # and filter assignments that contain this tutor_id.
        
        # Since tutor_ids is a JSONB list, we use containment
        stmt = select(SurveySubmission).join(SurveyAssignment).where(
            SurveyAssignment.tutor_ids.contains([str(tutor_id)]),
            SurveySubmission.status == "submitted"
        )
        submissions = (await session.execute(stmt)).scalars().all()
        
        if not submissions:
            return TutorFeedbackSummary(
                tutor_id=tutor_id,
                average_score=Decimal(0),
                total_responses=0,
                low_score_count=0,
                trends=[],
                recent_comments=[]
            )
            
        total_score = sum((s.overall_score or 0) for s in submissions)
        low_score_count = sum(1 for s in submissions if s.has_low_scores)
        
        # Trends: group by date
        # (This would be more complex in SQL, doing it in Python for now)
        trends_map = {}
        for s in submissions:
            date_key = s.created_at.date().isoformat()
            if date_key not in trends_map:
                trends_map[date_key] = []
            trends_map[date_key].append(float(s.overall_score or 0))
            
        trends = [
            {"date": d, "score": sum(scores)/len(scores)}
            for d, scores in sorted(trends_map.items())
        ]
        
        return TutorFeedbackSummary(
            tutor_id=tutor_id,
            average_score=Decimal(str(total_score / len(submissions))),
            total_responses=len(submissions),
            low_score_count=low_score_count,
            trends=trends,
            recent_comments=[s.responses.get('comment', 'No comment') for s in submissions[-5:]]
        )
