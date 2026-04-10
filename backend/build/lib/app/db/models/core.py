from __future__ import annotations

from typing import TYPE_CHECKING, Any, Optional
from uuid import UUID, uuid4

from datetime import date, datetime

from decimal import Decimal

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, Numeric, String, Text, text, Enum, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID as PGUUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, SoftDeleteMixin, TimestampMixin
from app.db.models.enums import NotificationType

if TYPE_CHECKING:
    from app.db.models.user import User


def _uuid_pk():
    return mapped_column(
        PGUUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
        server_default=text("gen_random_uuid()"),
    )


class Department(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "departments"

    id: Mapped[UUID] = _uuid_pk()
    name: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    discipline: Mapped[str] = mapped_column(String(50), nullable=False)
    head_user_id: Mapped[Optional[UUID]] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    created_by: Mapped[Optional[UUID]] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    head_user: Mapped[Optional["User"]] = relationship("User", foreign_keys=[head_user_id])


class AcademicCycle(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "academic_cycles"

    id: Mapped[UUID] = _uuid_pk()
    name: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    start_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    end_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    is_current: Mapped[bool] = mapped_column(Boolean, server_default=text("false"), nullable=False)
    created_by: Mapped[Optional[UUID]] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )


class Student(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "students"

    id: Mapped[UUID] = _uuid_pk()
    user_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    student_code: Mapped[str] = mapped_column(String(64), nullable=False, unique=True)
    institution: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    lifecycle_status: Mapped[str] = mapped_column(
        String(50), nullable=False, server_default=text("'pending_onboarding'")
    )
    department_id: Mapped[Optional[UUID]] = mapped_column(PGUUID(as_uuid=True), ForeignKey("departments.id"), nullable=True)
    academic_cycle_id: Mapped[Optional[UUID]] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("academic_cycles.id"), nullable=True
    )
    discipline: Mapped[str] = mapped_column(String(50), nullable=False)
    created_by: Mapped[Optional[UUID]] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    user: Mapped["User"] = relationship("User", back_populates="student_profile", foreign_keys=[user_id])
    postings: Mapped[list["Posting"]] = relationship("Posting", back_populates="student")


class Tutor(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "tutors"

    id: Mapped[UUID] = _uuid_pk()
    user_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    tutor_code: Mapped[str] = mapped_column(String(64), nullable=False, unique=True)
    department_id: Mapped[Optional[UUID]] = mapped_column(PGUUID(as_uuid=True), ForeignKey("departments.id"), nullable=True)
    academic_cycle_id: Mapped[Optional[UUID]] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("academic_cycles.id"), nullable=True
    )
    discipline: Mapped[str] = mapped_column(String(50), nullable=False)
    created_by: Mapped[Optional[UUID]] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    user: Mapped["User"] = relationship("User", back_populates="tutor_profile", foreign_keys=[user_id])


class Posting(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "postings"

    id: Mapped[UUID] = _uuid_pk()
    title: Mapped[str] = mapped_column(Text, nullable=False)
    student_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    academic_cycle_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("academic_cycles.id"), nullable=False)
    department_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("departments.id"), nullable=False)
    discipline: Mapped[str] = mapped_column(String(50), nullable=False)
    status: Mapped[str] = mapped_column(String(50), nullable=False, server_default=text("'active'"))
    start_date: Mapped[Optional[Any]] = mapped_column(Date, nullable=True)
    end_date: Mapped[Optional[Any]] = mapped_column(Date, nullable=True)
    created_by: Mapped[Optional[UUID]] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    student: Mapped["Student"] = relationship("Student", back_populates="postings")


class PostingTutor(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "posting_tutors"

    id: Mapped[UUID] = _uuid_pk()
    posting_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("postings.id", ondelete="CASCADE"), nullable=False)
    tutor_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("tutors.id", ondelete="CASCADE"), nullable=False)
    created_by: Mapped[Optional[UUID]] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )


class TeachingSession(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "teaching_sessions"

    id: Mapped[UUID] = _uuid_pk()
    posting_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("postings.id", ondelete="CASCADE"), nullable=False)
    tutor_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("tutors.id", ondelete="CASCADE"), nullable=False)
    # Legacy time window fields (kept for backward compat)
    starts_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=text("now()"))
    ends_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    # Old generic status (kept; approval flow uses approval_status below)
    status: Mapped[str] = mapped_column(String(50), nullable=False, server_default=text("'active'"))
    # Spec 2 fields
    session_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    duration_minutes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    department_id: Mapped[Optional[UUID]] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("departments.id", ondelete="SET NULL"), nullable=True
    )
    discipline: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    approval_status: Mapped[str] = mapped_column(String(50), nullable=False, server_default=text("'draft'"))
    submitted_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    approved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    approved_by: Mapped[Optional[UUID]] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    rejected_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    rejected_by: Mapped[Optional[UUID]] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    rejection_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    anomaly_flags: Mapped[Optional[list[Any]]] = mapped_column(JSONB, nullable=True, server_default=text("'[]'::jsonb"))
    is_flagged: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("false"))
    billable_minutes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    created_by: Mapped[Optional[UUID]] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    session_students: Mapped[list["SessionStudent"]] = relationship(
        "SessionStudent", back_populates="session", lazy="selectin"
    )


class SessionStudent(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "session_students"

    id: Mapped[UUID] = _uuid_pk()
    teaching_session_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("teaching_sessions.id", ondelete="CASCADE"), nullable=False
    )
    student_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    attendance_confirmed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_by: Mapped[Optional[UUID]] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    session: Mapped["TeachingSession"] = relationship("TeachingSession", back_populates="session_students")


class TutorBillableRate(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "tutor_billable_rates"

    id: Mapped[UUID] = _uuid_pk()
    tutor_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("tutors.id", ondelete="CASCADE"), nullable=False)
    rate_per_hour: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), nullable=False, server_default=text("'SGD'"))
    effective_from: Mapped[date] = mapped_column(Date, nullable=False)
    effective_to: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    created_by: Mapped[Optional[UUID]] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )


class SurveyTemplate(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "survey_templates"

    id: Mapped[UUID] = _uuid_pk()
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    discipline: Mapped[str] = mapped_column(String(50), nullable=False)
    posting_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    survey_type: Mapped[str] = mapped_column(String(50), nullable=False, server_default=text("'end_of_posting'"))
    questions: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False, server_default=text("'[]'::jsonb"))
    low_score_threshold: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("3"))
    created_by: Mapped[Optional[UUID]] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )


class SurveyAssignment(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "survey_assignments"

    id: Mapped[UUID] = _uuid_pk()
    template_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("survey_templates.id", ondelete="CASCADE"), nullable=False)
    student_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    posting_id: Mapped[Optional[UUID]] = mapped_column(PGUUID(as_uuid=True), ForeignKey("postings.id", ondelete="SET NULL"), nullable=True)
    session_ids: Mapped[list[UUID]] = mapped_column(JSONB, nullable=False, server_default=text("'[]'::jsonb"))
    tutor_ids: Mapped[list[UUID]] = mapped_column(JSONB, nullable=False, server_default=text("'[]'::jsonb"))
    status: Mapped[str] = mapped_column(String(50), nullable=False, server_default=text("'pending'"))
    due_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_by: Mapped[Optional[UUID]] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    template: Mapped["SurveyTemplate"] = relationship("SurveyTemplate")
    student: Mapped["Student"] = relationship("Student")


class SurveySubmission(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "survey_submissions"

    id: Mapped[UUID] = _uuid_pk()
    assignment_id: Mapped[Optional[UUID]] = mapped_column(PGUUID(as_uuid=True), ForeignKey("survey_assignments.id", ondelete="SET NULL"), nullable=True)
    template_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("survey_templates.id", ondelete="CASCADE"), nullable=False)
    teaching_session_id: Mapped[Optional[UUID]] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("teaching_sessions.id", ondelete="SET NULL"), nullable=True
    )
    student_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    responses: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False, server_default=text("'{}'::jsonb"))
    overall_score: Mapped[Optional[Decimal]] = mapped_column(Numeric(4, 2), nullable=True)
    has_low_scores: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("false"))
    status: Mapped[str] = mapped_column(String(50), nullable=False, server_default=text("'submitted'"))
    created_by: Mapped[Optional[UUID]] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    assignment: Mapped[Optional["SurveyAssignment"]] = relationship("SurveyAssignment")


class SurveyReminder(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "survey_reminders"

    id: Mapped[UUID] = _uuid_pk()
    assignment_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("survey_assignments.id", ondelete="CASCADE"), nullable=False)
    sent_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=text("now()"))
    reminder_type: Mapped[str] = mapped_column(String(50), nullable=False)
    created_by: Mapped[Optional[UUID]] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )


class AuditLog(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "audit_logs"

    id: Mapped[UUID] = _uuid_pk()
    created_by: Mapped[Optional[UUID]] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    action: Mapped[str] = mapped_column(String(255), nullable=False)
    entity_type: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    entity_id: Mapped[Optional[UUID]] = mapped_column(PGUUID(as_uuid=True), nullable=True)
    before_state: Mapped[Optional[dict[str, Any]]] = mapped_column(JSONB, nullable=True)
    after_state: Mapped[Optional[dict[str, Any]]] = mapped_column(JSONB, nullable=True)
    # 'metadata' is reserved for SQLAlchemy Declarative internals, so map it via an alternate attribute name.
    metadata_json: Mapped[dict[str, Any]] = mapped_column("metadata", JSONB, nullable=False, server_default=text("'{}'::jsonb"))


class Notification(Base, TimestampMixin):
    __tablename__ = "notifications"

    id: Mapped[UUID] = _uuid_pk()
    recipient_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    type: Mapped[NotificationType] = mapped_column(Enum(NotificationType))
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    data: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)
    read_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    recipient: Mapped["User"] = relationship("User", back_populates="notifications", foreign_keys=[recipient_id])


class ImportBatch(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "import_batches"

    id: Mapped[UUID] = _uuid_pk()
    batch_type: Mapped[str] = mapped_column(String(255), nullable=False)
    file_name: Mapped[str] = mapped_column(String(255), nullable=True)
    status: Mapped[str] = mapped_column(String(50), nullable=False, server_default=text("'queued'"))
    details: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False, server_default=text("'{}'::jsonb"))
    created_by: Mapped[Optional[UUID]] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )


class ReportDefinition(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "report_definitions"

    id: Mapped[UUID] = _uuid_pk()
    name: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    config: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False, server_default=text("'{}'::jsonb"))
    status: Mapped[str] = mapped_column(String(50), nullable=False, server_default=text("'active'"))
    created_by: Mapped[Optional[UUID]] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )


class ReportExecution(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "report_executions"

    id: Mapped[UUID] = _uuid_pk()
    template_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("report_definitions.id", ondelete="CASCADE"), nullable=False
    )
    status: Mapped[str] = mapped_column(String(50), nullable=False, server_default=text("'pending'"))
    format: Mapped[str] = mapped_column(String(20), nullable=False)
    file_url: Mapped[Optional[str]] = mapped_column(String(1024), nullable=True)
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_by: Mapped[Optional[UUID]] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    template: Mapped["ReportDefinition"] = relationship("ReportDefinition")


class ReportSchedule(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "report_schedules"

    id: Mapped[UUID] = _uuid_pk()
    template_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("report_definitions.id", ondelete="CASCADE"), nullable=False
    )
    frequency: Mapped[str] = mapped_column(String(50), nullable=False)
    recipients: Mapped[list[str]] = mapped_column(JSONB, nullable=False, server_default=text("'[]'::jsonb"))
    last_run_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    next_run_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("true"))
    created_by: Mapped[Optional[UUID]] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    template: Mapped["ReportDefinition"] = relationship("ReportDefinition")



class NotificationPreference(Base, TimestampMixin):
    __tablename__ = "notification_preferences"

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    notification_type: Mapped[NotificationType] = mapped_column(Enum(NotificationType))
    email_enabled: Mapped[bool] = mapped_column(Boolean, default=True)

    user: Mapped["User"] = relationship("User", back_populates="notification_preferences", foreign_keys=[user_id])

    __table_args__ = (
        UniqueConstraint("user_id", "notification_type", name="uq_user_notification_type"),
    )


class SystemSettings(Base, TimestampMixin):
    __tablename__ = "system_settings"

    id: Mapped[UUID] = _uuid_pk()
    setting_key: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    setting_value: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False, server_default=text("'{}'::jsonb"))
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    updated_by: Mapped[Optional[UUID]] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )


class RolePermission(Base, TimestampMixin):
    __tablename__ = "role_permissions"

    id: Mapped[UUID] = _uuid_pk()
    role: Mapped[str] = mapped_column(String(50), nullable=False)
    permissions: Mapped[list[str]] = mapped_column(JSONB, nullable=False, server_default=text("'[]'::jsonb"))
    updated_by: Mapped[Optional[UUID]] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    __table_args__ = (
        UniqueConstraint("role", name="uq_role_permissions_role"),
    )
