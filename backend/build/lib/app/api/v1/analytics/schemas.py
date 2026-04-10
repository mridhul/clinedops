from __future__ import annotations

from typing import Optional, Any
from uuid import UUID
from pydantic import BaseModel
from app.schemas.envelope import Envelope

class KPIStats(BaseModel):
    label: str
    value: str | int | float
    trend: Optional[float] = None  # Percentage change
    status: Optional[str] = None # 'success', 'warning', 'error'

class AdminDashboardOut(BaseModel):
    kpis: list[KPIStats]
    recent_activity: list[dict[str, Any]]
    flagged_items_count: int

class HODDashboardOut(BaseModel):
    kpis: list[KPIStats]
    heatmap_data: list[dict[str, Any]]
    compliance_score: float

class TutorDashboardOut(BaseModel):
    kpis: list[KPIStats]
    feedback_trend: list[dict[str, Any]]
    approved_hours_this_cycle: float

class StudentDashboardOut(BaseModel):
    current_posting: Optional[dict[str, Any]]
    pending_surveys_count: int
    upcoming_sessions: list[dict[str, Any]]

class DrillDownDetails(BaseModel):
    metric_id: str
    data: list[dict[str, Any]]
