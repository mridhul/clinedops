from __future__ import annotations

from typing import Optional, Any, Union
from uuid import UUID
from pydantic import BaseModel
from app.schemas.envelope import Envelope

class KPIStats(BaseModel):
    label: str
    value: Union[str, int, float]
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

class RecognitionHighlight(BaseModel):
    tutor_name: str
    tutor_id: UUID
    highlight_quote: str
    discipline: str
    award_category: str # e.g., "Excellence in Clinical Instruction"

class ImprovementOpportunity(BaseModel):
    theme: str
    discipline: str
    impact_level: str # "High", "Medium", "Low"
    tutor_feedback_summary: str

class StrategicAnalyticsOut(BaseModel):
    sentiment_score: float # Overall 0.0 to 1.0 or 0.0 to 5.0
    sentiment_trend: list[dict[str, Any]]
    excellence_highlights: list[RecognitionHighlight]
    improvement_opportunities: list[ImprovementOpportunity]
    discipline_breakdown: dict[str, float]
