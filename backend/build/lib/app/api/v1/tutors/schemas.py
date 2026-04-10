from __future__ import annotations

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


class TutorListItem(BaseModel):
    id: UUID
    tutor_code: str
    email: EmailStr
    full_name: Optional[str] = None
    discipline: str
    department_id: Optional[UUID] = None
    academic_cycle_id: Optional[UUID] = None
    is_active: bool


class TutorCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    full_name: Optional[str] = None
    tutor_code: str = Field(min_length=1, max_length=64)
    discipline: str
    department_id: Optional[UUID] = None
    academic_cycle_id: Optional[UUID] = None


class TutorUpdate(BaseModel):
    full_name: Optional[str] = None
    discipline: Optional[str] = None
    department_id: Optional[UUID] = None
    academic_cycle_id: Optional[UUID] = None
    is_active: Optional[bool] = None


class TutorDetail(BaseModel):
    id: UUID
    tutor_code: str
    email: EmailStr
    full_name: Optional[str] = None
    discipline: str
    department_id: Optional[UUID] = None
    academic_cycle_id: Optional[UUID] = None
    is_active: bool
    teaching_sessions_count: int


class TutorListResponse(BaseModel):
    items: list[TutorListItem]
    total: int
    limit: int
    offset: int
