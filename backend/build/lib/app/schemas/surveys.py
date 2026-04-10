from __future__ import annotations

from datetime import datetime
from typing import Any, Optional, List
from uuid import UUID
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field
from app.db.models.enums import SurveyStatusEnum, SurveyTypeEnum

class QuestionSchema(BaseModel):
    id: str
    text: str
    type: str  # 'likert', 'rating', 'text', 'multi-choice'
    options: Optional[List[str]] = None
    required: bool = True
    low_score_threshold: Optional[int] = None

class SurveyTemplateBase(BaseModel):
    name: str
    discipline: str
    posting_type: Optional[str] = None
    survey_type: SurveyTypeEnum = SurveyTypeEnum.end_of_posting
    questions: List[QuestionSchema]
    low_score_threshold: int = 3

class SurveyTemplateCreate(SurveyTemplateBase):
    pass

class SurveyTemplateUpdate(BaseModel):
    name: Optional[str] = None
    discipline: Optional[str] = None
    posting_type: Optional[str] = None
    survey_type: Optional[SurveyTypeEnum] = None
    questions: Optional[List[QuestionSchema]] = None
    low_score_threshold: Optional[int] = None

class SurveyTemplateRead(SurveyTemplateBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class SurveyAssignmentRead(BaseModel):
    id: UUID
    template_id: UUID
    student_id: UUID
    posting_id: Optional[UUID] = None
    session_ids: List[UUID]
    tutor_ids: List[UUID]
    status: SurveyStatusEnum
    due_date: Optional[datetime] = None
    created_at: datetime
    
    template: Optional[SurveyTemplateRead] = None

    model_config = ConfigDict(from_attributes=True)

class SurveySubmissionCreate(BaseModel):
    assignment_id: Optional[UUID] = None
    template_id: UUID
    teaching_session_id: Optional[UUID] = None
    student_id: UUID
    responses: dict[str, Any]

class SurveySubmissionRead(BaseModel):
    id: UUID
    assignment_id: Optional[UUID] = None
    template_id: UUID
    student_id: UUID
    responses: dict[str, Any]
    overall_score: Optional[Decimal] = None
    has_low_scores: bool
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class TutorFeedbackSummary(BaseModel):
    tutor_id: UUID
    average_score: Decimal
    total_responses: int
    low_score_count: int
    trends: List[dict[str, Any]] # e.g. [{"date": "2024-01-01", "score": 4.5}]
    recent_comments: List[str]

class CompletionRateSchema(BaseModel):
    cohort: str
    discipline: str
    total_assigned: int
    total_completed: int
    rate: float # 0.0 to 1.0
