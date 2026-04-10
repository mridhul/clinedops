from __future__ import annotations

from datetime import date, datetime
from typing import Any, Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


class StudentListItem(BaseModel):
    id: UUID
    student_code: str
    email: EmailStr
    full_name: Optional[str] = None
    discipline: str
    institution: Optional[str] = None
    lifecycle_status: str
    academic_cycle_id: Optional[UUID] = None
    department_id: Optional[UUID] = None
    is_active: bool


class StudentCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    full_name: Optional[str] = None
    student_code: str = Field(min_length=1, max_length=64)
    institution: Optional[str] = None
    discipline: str
    lifecycle_status: str = "pending_onboarding"
    academic_cycle_id: Optional[UUID] = None
    department_id: Optional[UUID] = None


class StudentUpdate(BaseModel):
    full_name: Optional[str] = None
    institution: Optional[str] = None
    discipline: Optional[str] = None
    lifecycle_status: Optional[str] = None
    academic_cycle_id: Optional[UUID] = None
    department_id: Optional[UUID] = None
    is_active: Optional[bool] = None


class PostingHistoryItem(BaseModel):
    id: UUID
    title: str
    status: str
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    department_id: UUID
    created_at: datetime


class FeedbackSummaryItem(BaseModel):
    id: UUID
    template_id: UUID
    status: str
    created_at: datetime


class StudentDetail(BaseModel):
    id: UUID
    student_code: str
    email: EmailStr
    full_name: Optional[str] = None
    discipline: str
    institution: Optional[str] = None
    lifecycle_status: str
    academic_cycle_id: Optional[UUID] = None
    department_id: Optional[UUID] = None
    is_active: bool
    teaching_hours_total: float
    posting_history: list[PostingHistoryItem]
    feedback_recent: list[FeedbackSummaryItem]


class StudentListResponse(BaseModel):
    items: list[StudentListItem]
    total: int
    limit: int
    offset: int
