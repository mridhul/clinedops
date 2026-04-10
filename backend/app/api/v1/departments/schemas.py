from __future__ import annotations

from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class DepartmentCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    discipline: str
    head_user_id: Optional[UUID] = None


class DepartmentUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    discipline: Optional[str] = None
    head_user_id: Optional[UUID] = None


class DepartmentOut(BaseModel):
    id: UUID
    name: str
    discipline: str
    head_user_id: Optional[UUID] = None
    is_active: bool


class DepartmentListResponse(BaseModel):
    items: list[DepartmentOut]
    total: int
    limit: int
    offset: int
