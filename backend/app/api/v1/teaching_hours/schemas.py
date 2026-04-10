from __future__ import annotations

from datetime import date
from decimal import Decimal
from typing import Any, Optional
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


# ── Session schemas ───────────────────────────────────────────────────────────

class SessionCreate(BaseModel):
    posting_id: UUID
    starts_at: str  # ISO datetime string, e.g. "2026-03-22T09:00:00+08:00"
    session_type: str = Field(..., pattern="^(scheduled|ad_hoc|consultation)$")
    duration_minutes: int = Field(..., ge=1, le=1440)
    department_id: Optional[UUID] = None
    student_ids: list[UUID] = Field(default_factory=list)
    description: Optional[str] = None


class BulkSessionCreate(BaseModel):
    """Create a recurring series of sessions."""
    posting_id: UUID
    session_type: str = Field(..., pattern="^(scheduled|ad_hoc|consultation)$")
    duration_minutes: int = Field(..., ge=1, le=1440)
    department_id: Optional[UUID] = None
    student_ids: list[UUID] = Field(default_factory=list)
    description: Optional[str] = None
    # Recurrence fields
    start_date: date
    end_date: date
    days_of_week: list[str] = Field(
        ...,
        description="e.g. ['monday', 'wednesday']",
        min_length=1,
    )
    start_time: str = Field(..., description="HH:MM (24h) in session timezone")

    @field_validator("days_of_week")
    @classmethod
    def validate_days(cls, v: list[str]) -> list[str]:
        valid = {"monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"}
        for d in v:
            if d.lower() not in valid:
                raise ValueError(f"Invalid day: {d}")
        return [d.lower() for d in v]


class SessionUpdate(BaseModel):
    """Partial update — only allowed while in draft status."""
    session_type: Optional[str] = Field(None, pattern="^(scheduled|ad_hoc|consultation)$")
    duration_minutes: Optional[int] = Field(None, ge=1, le=1440)
    starts_at: Optional[str] = None
    department_id: Optional[UUID] = None
    description: Optional[str] = None
    student_ids: Optional[list[UUID]] = None


class SessionRejectPayload(BaseModel):
    reason: str = Field(..., min_length=1, max_length=2000)


class AnomalyFlagOut(BaseModel):
    type: str
    detail: str


class SessionStudentOut(BaseModel):
    id: UUID
    student_id: UUID
    attendance_confirmed_at: Optional[str] = None

    model_config = {"from_attributes": True}


class SessionOut(BaseModel):
    id: UUID
    posting_id: UUID
    tutor_id: UUID
    starts_at: str
    duration_minutes: Optional[int]
    session_type: Optional[str]
    department_id: Optional[UUID]
    discipline: Optional[str]
    description: Optional[str]
    approval_status: str
    submitted_at: Optional[str]
    approved_at: Optional[str]
    approved_by: Optional[UUID]
    rejected_at: Optional[str]
    rejected_by: Optional[UUID]
    rejection_reason: Optional[str]
    anomaly_flags: list[AnomalyFlagOut]
    is_flagged: bool
    billable_minutes: Optional[int]
    billable_amount: Optional[Decimal]
    session_students: list[SessionStudentOut]
    created_at: str

    model_config = {"from_attributes": True}


class SessionListResponse(BaseModel):
    items: list[SessionOut]
    total: int
    limit: int
    offset: int


# ── Billable Rate schemas ─────────────────────────────────────────────────────

class TutorBillableRateCreate(BaseModel):
    rate_per_hour: Decimal = Field(..., ge=Decimal("0.01"))
    currency: str = Field("SGD", min_length=3, max_length=3)
    effective_from: date
    effective_to: Optional[date] = None


class TutorBillableRateOut(BaseModel):
    id: UUID
    tutor_id: UUID
    rate_per_hour: Decimal
    currency: str
    effective_from: date
    effective_to: Optional[date]
    is_active: bool
    created_at: str

    model_config = {"from_attributes": True}


# ── Dashboard schemas ─────────────────────────────────────────────────────────

class DashboardBar(BaseModel):
    label: str
    total_minutes: int
    session_count: int


class DashboardOut(BaseModel):
    bars: list[DashboardBar]
    total_minutes: int
    total_sessions: int
    approved_sessions: int
