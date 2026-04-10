from __future__ import annotations

from typing import TYPE_CHECKING, Optional
from uuid import UUID

from sqlalchemy import ForeignKey, String, Text, text
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, SoftDeleteMixin, TimestampMixin

if TYPE_CHECKING:
    from app.db.models.user import User
    from app.db.models.core import Student


def _uuid_pk():
    return mapped_column(
        PGUUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )


class JobShadowingApplication(Base, TimestampMixin, SoftDeleteMixin):
    """
    Spec: Reviews job shadowing applications, shortlists, and assigns mentors.
    """
    __tablename__ = "job_shadowing_applications"

    id: Mapped[UUID] = _uuid_pk()
    student_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    discipline: Mapped[str] = mapped_column(String(50), nullable=False, doc="Preferred discipline for shadowing")
    status: Mapped[str] = mapped_column(String(50), nullable=False, server_default=text("'pending'"), doc="pending, shortlisted, rejected")
    reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True, doc="Statement of interest from student")
    admin_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True, doc="Notes from Department Head review")
    
    student: Mapped["Student"] = relationship("Student")
    assignments: Mapped[list["MentorAssignment"]] = relationship("MentorAssignment", back_populates="application")


class MentorAssignment(Base, TimestampMixin, SoftDeleteMixin):
    """
    Spec: Assigns mentors (Tutors) to shortlisted job shadowing applications.
    """
    __tablename__ = "mentor_assignments"

    id: Mapped[UUID] = _uuid_pk()
    application_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("job_shadowing_applications.id", ondelete="CASCADE"), nullable=False)
    mentor_user_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, doc="Tutor assigned as mentor")
    status: Mapped[str] = mapped_column(String(50), nullable=False, server_default=text("'assigned'"), doc="assigned, in_progress, completed")
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    application: Mapped["JobShadowingApplication"] = relationship("JobShadowingApplication", back_populates="assignments")
    mentor: Mapped["User"] = relationship("User")
