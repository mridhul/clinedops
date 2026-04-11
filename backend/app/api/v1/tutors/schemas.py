from __future__ import annotations

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field, field_validator


class TutorListItem(BaseModel):
    id: UUID
    user_id: UUID
    tutor_code: str
    email: EmailStr
    full_name: Optional[str] = None
    discipline: str
    department_id: Optional[UUID] = None
    academic_cycle_id: Optional[UUID] = None
    is_active: bool


class TutorCreate(BaseModel):
    email: EmailStr
    password: Optional[str] = Field(
        default=None,
        description="Required for new user accounts; omit to keep password when user already exists (e.g. from Admin Console).",
    )
    full_name: Optional[str] = None
    tutor_code: str = Field(min_length=1, max_length=64)
    discipline: str
    department_id: Optional[UUID] = None
    academic_cycle_id: Optional[UUID] = None

    @field_validator("password")
    @classmethod
    def password_min_length_when_set(cls, v: Optional[str]) -> Optional[str]:
        if v is None or v == "":
            return None
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v


class TutorUpdate(BaseModel):
    full_name: Optional[str] = None
    discipline: Optional[str] = None
    department_id: Optional[UUID] = None
    academic_cycle_id: Optional[UUID] = None
    is_active: Optional[bool] = None


class TutorDetail(BaseModel):
    id: UUID
    user_id: UUID
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
