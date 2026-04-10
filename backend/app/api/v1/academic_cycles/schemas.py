from __future__ import annotations

from datetime import date
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class AcademicCycleCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    is_current: bool = False


class AcademicCycleUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    is_current: Optional[bool] = None


class AcademicCycleOut(BaseModel):
    id: UUID
    name: str
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    is_current: bool
    is_active: bool


class AcademicCycleListResponse(BaseModel):
    items: list[AcademicCycleOut]
    total: int
    limit: int
    offset: int
