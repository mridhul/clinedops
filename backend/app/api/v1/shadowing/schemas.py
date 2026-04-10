from __future__ import annotations

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class ShadowingApplicationBase(BaseModel):
    discipline: str
    reason: Optional[str] = None


class ShadowingApplicationCreate(ShadowingApplicationBase):
    pass


class MentorAssignmentOut(BaseModel):
    id: UUID
    mentor_user_id: UUID
    status: str
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ShadowingApplicationOut(ShadowingApplicationBase):
    id: UUID
    student_id: UUID
    status: str
    admin_notes: Optional[str] = None
    created_at: datetime
    assignments: list[MentorAssignmentOut] = []

    class Config:
        from_attributes = True


class ShadowingApplicationUpdate(BaseModel):
    status: Optional[str] = Field(None, pattern="^(pending|shortlisted|rejected)$")
    admin_notes: Optional[str] = None


class MentorAssignmentCreate(BaseModel):
    mentor_user_id: UUID
    notes: Optional[str] = None
