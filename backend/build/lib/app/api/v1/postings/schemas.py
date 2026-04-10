from __future__ import annotations

from datetime import date, datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class PostingCreate(BaseModel):
    title: str = Field(min_length=1)
    student_id: UUID
    academic_cycle_id: UUID
    department_id: UUID
    discipline: str
    tutor_ids: list[UUID] = Field(default_factory=list)
    start_date: Optional[date] = None
    end_date: Optional[date] = None


class PostingUpdate(BaseModel):
    title: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: Optional[str] = None
    tutor_ids: Optional[list[UUID]] = None


class PostingOut(BaseModel):
    id: UUID
    title: str
    student_id: UUID
    academic_cycle_id: UUID
    department_id: UUID
    discipline: str
    status: str
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    tutor_ids: list[UUID]
    created_at: datetime


class PostingListResponse(BaseModel):
    items: list[PostingOut]
    total: int
    limit: int
    offset: int
