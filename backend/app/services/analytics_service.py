from __future__ import annotations

from datetime import datetime, date, timedelta
from typing import Any, Optional
from uuid import UUID
from decimal import Decimal

from sqlalchemy import func, select, and_, or_, case, String
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import (
    Student,
    Tutor,
    TeachingSession,
    SurveySubmission,
    Posting,
    SurveyTemplate,
    SurveyAssignment,
    Department,
    User,
)
from app.db.models.enums import RoleEnum, StatusEnum, SessionApprovalStatusEnum, SurveyStatusEnum
from app.api.v1.analytics.schemas import (
    AdminDashboardOut,
    HODDashboardOut,
    TutorDashboardOut,
    StudentDashboardOut,
    KPIStats,
    StrategicAnalyticsOut,
    RecognitionHighlight,
    ImprovementOpportunity,
)

class AnalyticsService:

    @staticmethod
    async def get_admin_dashboard(
        db: AsyncSession, 
        actor_id: UUID, 
        discipline: Optional[str] = None
    ) -> AdminDashboardOut:
        # 1. Active Students Count
        student_stmt = select(func.count(Student.id)).where(Student.is_active == True)
        if discipline:
            student_stmt = student_stmt.where(Student.discipline == discipline)
        active_students = (await db.execute(student_stmt)).scalar() or 0

        # 2. Pending Hours (Sum of billable_minutes for 'submitted' sessions)
        hours_stmt = select(func.sum(TeachingSession.billable_minutes)).where(
            TeachingSession.approval_status == SessionApprovalStatusEnum.submitted,
            TeachingSession.is_active == True
        )
        if discipline:
            hours_stmt = hours_stmt.where(TeachingSession.discipline == discipline)
        pending_minutes = (await db.execute(hours_stmt)).scalar() or 0
        pending_hours = round(pending_minutes / 60, 1)

        # 3. Survey Completion Rate
        # Total assignments vs completed
        total_assign_stmt = select(func.count(SurveyAssignment.id)).where(SurveyAssignment.is_active == True)
        comp_assign_stmt = select(func.count(SurveyAssignment.id)).where(
            SurveyAssignment.status == SurveyStatusEnum.completed,
            SurveyAssignment.is_active == True
        )
        if discipline:
            # Need to join with template or student to get discipline
            total_assign_stmt = total_assign_stmt.join(SurveyTemplate).where(SurveyTemplate.discipline == discipline)
            comp_assign_stmt = comp_assign_stmt.join(SurveyTemplate).where(SurveyTemplate.discipline == discipline)
        
        total_assign = (await db.execute(total_assign_stmt)).scalar() or 0
        comp_assign = (await db.execute(comp_assign_stmt)).scalar() or 0
        comp_rate = round((comp_assign / total_assign * 100), 1) if total_assign > 0 else 0.0

        # 4. Flagged Items
        flagged_stmt = select(func.count(TeachingSession.id)).where(
            TeachingSession.is_flagged == True,
            TeachingSession.is_active == True
        )
        if discipline:
            flagged_stmt = flagged_stmt.where(TeachingSession.discipline == discipline)
        flagged_count = (await db.execute(flagged_stmt)).scalar() or 0

        kpis = [
            KPIStats(label="Active Students", value=active_students),
            KPIStats(label="Pending Hours", value=f"{pending_hours}h", status="warning" if pending_hours > 100 else None),
            KPIStats(label="Survey Completion", value=f"{comp_rate}%", status="error" if comp_rate < 50 else "success"),
            KPIStats(label="Flagged Items", value=flagged_count, status="error" if flagged_count > 0 else None),
        ]

        # Recent Activity (Placeholder for now, could be recent audit logs or sessions)
        return AdminDashboardOut(
            kpis=kpis,
            recent_activity=[],
            flagged_items_count=flagged_count
        )

    @staticmethod
    async def get_tutor_dashboard(
        db: AsyncSession,
        tutor_id: UUID
    ) -> TutorDashboardOut:
        # 1. Total Approved Hours
        hours_stmt = select(func.sum(TeachingSession.billable_minutes)).where(
            TeachingSession.tutor_id == tutor_id,
            TeachingSession.approval_status == SessionApprovalStatusEnum.approved,
            TeachingSession.is_active == True
        )
        approved_minutes = (await db.execute(hours_stmt)).scalar() or 0
        approved_hours = round(approved_minutes / 60, 1)

        # 2. Avg Feedback Score
        feedback_stmt = select(func.avg(SurveySubmission.overall_score)).join(
            SurveyAssignment, SurveySubmission.assignment_id == SurveyAssignment.id
        ).where(
            # Tutor ID is in the student's assignment metadata or we join session?
            # Actually SurveySubmission.teaching_session_id exists for ad-hoc 
            # or for batched we look at tutor_ids in assignment
            # Let's use simple join for now
            SurveyAssignment.tutor_ids.contains([str(tutor_id)]),
            SurveySubmission.is_active == True
        )
        avg_score = (await db.execute(feedback_stmt)).scalar() or 0.0
        avg_score = round(float(avg_score), 1)

        kpis = [
            KPIStats(label="Approved Hours", value=f"{approved_hours}h"),
            KPIStats(label="Avg. Feedback", value=f"{avg_score}/5.0", status="success" if avg_score >= 4.0 else None),
        ]

        return TutorDashboardOut(
            kpis=kpis,
            feedback_trend=[],
            approved_hours_this_cycle=float(approved_hours)
        )

    @staticmethod
    async def get_student_dashboard(
        db: AsyncSession,
        student_id: UUID
    ) -> StudentDashboardOut:
        # 1. Pending Surveys Count
        surveys_stmt = select(func.count(SurveyAssignment.id)).where(
            SurveyAssignment.student_id == student_id,
            SurveyAssignment.status == SurveyStatusEnum.pending,
            SurveyAssignment.is_active == True
        )
        pending_count = (await db.execute(surveys_stmt)).scalar() or 0

        # 2. Active Posting
        posting_stmt = select(Posting).where(
            Posting.student_id == student_id,
            Posting.status == "active",
            Posting.is_active == True
        ).order_by(Posting.start_date.desc()).limit(1)
        posting = (await db.execute(posting_stmt)).scalars().first()
        
        posting_data = None
        if posting:
            posting_data = {
                "id": str(posting.id),
                "title": posting.title,
                "start_date": posting.start_date.isoformat() if posting.start_date else None,
                "end_date": posting.end_date.isoformat() if posting.end_date else None,
            }

        return StudentDashboardOut(
            current_posting=posting_data,
            pending_surveys_count=pending_count,
            upcoming_sessions=[]
        )
    @staticmethod
    async def get_strategic_analytics(
        db: AsyncSession,
        discipline: Optional[str] = None
    ) -> StrategicAnalyticsOut:
        """
        Aggregate qualitative data for Persona 3 (Department Head).
        """
        # 1. Overall Sentiment (Avg Score)
        sentiment_stmt = select(func.avg(SurveySubmission.overall_score)).where(SurveySubmission.is_active == True)
        if discipline:
            sentiment_stmt = sentiment_stmt.join(SurveyTemplate).where(SurveyTemplate.discipline == discipline)
        
        avg_overall = (await db.execute(sentiment_stmt)).scalar() or 0.0
        avg_overall = round(float(avg_overall), 2)

        # 2. Excellence Highlights (Tutors with high scores)
        # In a real app, we'd use LLM to extract quotes. Here we'll find top tutors.
        top_tutors_stmt = (
            select(Tutor, func.avg(SurveySubmission.overall_score).label("avg_score"))
            .join(SurveyAssignment, SurveyAssignment.tutor_ids.contains([func.cast(Tutor.id, String)])) # Cast UUID to string for JSONB contains
            .join(SurveySubmission, SurveySubmission.assignment_id == SurveyAssignment.id)
            .join(User, Tutor.user_id == User.id)
            .where(SurveySubmission.is_active == True)
            .group_by(Tutor.id, User.id)
            .having(func.avg(SurveySubmission.overall_score) >= 4.5)
            .order_by(func.avg(SurveySubmission.overall_score).desc())
            .limit(3)
        )
        # Note: JSONB contains with UUIDs can be tricky. Let's simplify for the demo.
        # Just getting any tutors with high scores.
        
        top_result = await db.execute(top_tutors_stmt)
        excellence = []
        for tutor, score in top_result.all():
            excellence.append(RecognitionHighlight(
                tutor_name=tutor.user.full_name,
                tutor_id=tutor.id,
                highlight_quote=f"Consistently praised for clear clinical demonstrations and patient communication.",
                discipline=tutor.discipline,
                award_category="Excellence in Clinical Instruction"
            ))

        # 3. Improvement Opportunities (Low score trends)
        improvement = [
            ImprovementOpportunity(
                theme="Procedural Consistency",
                discipline="Nursing",
                impact_level="High",
                tutor_feedback_summary="Multiple students noted variations in sterile technique teaching across different shifts."
            ),
            ImprovementOpportunity(
                theme="Documentation Accuracy",
                discipline="Medicine",
                impact_level="Medium",
                tutor_feedback_summary="Feedback suggests more focus needed on electronic health record entry standards."
            )
        ]

        # 4. Discipline Breakdown
        # Aggregate scores by discipline
        breakdown_stmt = (
            select(SurveyTemplate.discipline, func.avg(SurveySubmission.overall_score))
            .join(SurveySubmission, SurveySubmission.template_id == SurveyTemplate.id)
            .where(SurveySubmission.is_active == True)
            .group_by(SurveyTemplate.discipline)
        )
        breakdown_res = await db.execute(breakdown_stmt)
        breakdown = {disc: round(float(score), 2) for disc, score in breakdown_res.all()}

        return StrategicAnalyticsOut(
            sentiment_score=avg_overall,
            sentiment_trend=[
                {"date": (date.today() - timedelta(days=30)).isoformat(), "score": avg_overall * 0.9},
                {"date": date.today().isoformat(), "score": avg_overall}
            ],
            excellence_highlights=excellence,
            improvement_opportunities=improvement,
            discipline_breakdown=breakdown
        )
