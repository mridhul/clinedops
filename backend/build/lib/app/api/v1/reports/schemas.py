from __future__ import annotations

from datetime import datetime
from typing import Optional, Any
from uuid import UUID
from pydantic import BaseModel
from app.schemas.envelope import Envelope

class ReportTemplateCreate(BaseModel):
    name: str
    config: dict[str, Any]

class ReportTemplateOut(BaseModel):
    id: UUID
    name: str
    config: dict[str, Any]
    status: str
    created_at: datetime

class ReportExecutionCreate(BaseModel):
    template_id: UUID
    format: str # 'pdf', 'xlsx', 'csv'

class ReportExecutionOut(BaseModel):
    id: UUID
    template_id: UUID
    status: str
    format: str
    file_url: Optional[str] = None
    error_message: Optional[str] = None
    created_at: datetime
    expires_at: Optional[datetime] = None

class ReportScheduleCreate(BaseModel):
    template_id: UUID
    frequency: str # 'daily', 'weekly', 'monthly'
    recipients: list[str]

class ReportScheduleOut(BaseModel):
    id: UUID
    template_id: UUID
    frequency: str
    recipients: list[str]
    is_active: bool
    next_run_at: Optional[datetime] = None
