from __future__ import annotations

from typing import Any, Optional
from uuid import UUID, uuid4

from datetime import date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, String, Text, text
from sqlalchemy.dialects.postgresql import UUID as PGUUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, SoftDeleteMixin, TimestampMixin


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
    created_by: Mapped[Optional[UUID]] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )


class AcademicCycle(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "academic_cycles"

    id: Mapped[UUID] = _uuid_pk()
    name: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    start_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    end_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    created_by: Mapped[Optional[UUID]] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )


class Student(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "students"

    id: Mapped[UUID] = _uuid_pk()
    user_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    department_id: Mapped[Optional[UUID]] = mapped_column(PGUUID(as_uuid=True), ForeignKey("departments.id"), nullable=True)
    academic_cycle_id: Mapped[Optional[UUID]] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("academic_cycles.id"), nullable=True
    )
    discipline: Mapped[str] = mapped_column(String(50), nullable=False)
    created_by: Mapped[Optional[UUID]] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )


class Tutor(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "tutors"

    id: Mapped[UUID] = _uuid_pk()
    user_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    department_id: Mapped[Optional[UUID]] = mapped_column(PGUUID(as_uuid=True), ForeignKey("departments.id"), nullable=True)
    academic_cycle_id: Mapped[Optional[UUID]] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("academic_cycles.id"), nullable=True
    )
    discipline: Mapped[str] = mapped_column(String(50), nullable=False)
    created_by: Mapped[Optional[UUID]] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )


class Posting(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "postings"

    id: Mapped[UUID] = _uuid_pk()
    title: Mapped[str] = mapped_column(Text, nullable=False)
    academic_cycle_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("academic_cycles.id"), nullable=False)
    department_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("departments.id"), nullable=False)
    discipline: Mapped[str] = mapped_column(String(50), nullable=False)
    status: Mapped[str] = mapped_column(String(50), nullable=False, server_default=text("'active'"))
    start_date: Mapped[Optional[Any]] = mapped_column(Date, nullable=True)
    end_date: Mapped[Optional[Any]] = mapped_column(Date, nullable=True)
    created_by: Mapped[Optional[UUID]] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )


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
    starts_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=text("now()"))
    ends_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[str] = mapped_column(String(50), nullable=False, server_default=text("'active'"))
    created_by: Mapped[Optional[UUID]] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )


class SessionStudent(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "session_students"

    id: Mapped[UUID] = _uuid_pk()
    teaching_session_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("teaching_sessions.id", ondelete="CASCADE"), nullable=False
    )
    student_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    created_by: Mapped[Optional[UUID]] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )


class SurveyTemplate(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "survey_templates"

    id: Mapped[UUID] = _uuid_pk()
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    discipline: Mapped[str] = mapped_column(String(50), nullable=False)
    questions: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False, server_default=text("'{}'::jsonb"))
    created_by: Mapped[Optional[UUID]] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )


class SurveySubmission(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "survey_submissions"

    id: Mapped[UUID] = _uuid_pk()
    template_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("survey_templates.id", ondelete="CASCADE"), nullable=False)
    teaching_session_id: Mapped[Optional[UUID]] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("teaching_sessions.id", ondelete="SET NULL"), nullable=True
    )
    student_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    responses: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False, server_default=text("'{}'::jsonb"))
    status: Mapped[str] = mapped_column(String(50), nullable=False, server_default=text("'submitted'"))
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


class Notification(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "notifications"

    id: Mapped[UUID] = _uuid_pk()
    user_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(50), nullable=False, server_default=text("'unread'"))
    read_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_by: Mapped[Optional[UUID]] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )


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

