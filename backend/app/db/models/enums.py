from __future__ import annotations

import enum


class RoleEnum(str, enum.Enum):
    super_admin = "super_admin"
    programme_admin = "programme_admin"
    supervisor = "supervisor"
    tutor = "tutor"
    student = "student"


class DisciplineEnum(str, enum.Enum):
    medicine = "medicine"
    allied_health = "allied_health"
    nursing = "nursing"
    training = "training"


class StatusEnum(str, enum.Enum):
    draft = "draft"
    active = "active"
    completed = "completed"
    cancelled = "cancelled"
    submitted = "submitted"
    processed = "processed"
    failed = "failed"


class NotificationStatusEnum(str, enum.Enum):
    unread = "unread"
    read = "read"
    archived = "archived"


class ImportBatchStatusEnum(str, enum.Enum):
    queued = "queued"
    processing = "processing"
    completed = "completed"
    failed = "failed"


class StudentLifecycleStatusEnum(str, enum.Enum):
    pending_onboarding = "pending_onboarding"
    active_posting = "active_posting"
    completed = "completed"
    offboarded = "offboarded"


class SessionTypeEnum(str, enum.Enum):
    scheduled = "scheduled"
    ad_hoc = "ad_hoc"
    consultation = "consultation"


class SessionApprovalStatusEnum(str, enum.Enum):
    draft = "draft"
    submitted = "submitted"
    approved = "approved"
    rejected = "rejected"



class AnomalyTypeEnum(str, enum.Enum):
    duplicate_slot = "duplicate_slot"
    daily_hours_exceeded = "daily_hours_exceeded"
    outside_posting_period = "outside_posting_period"


class SurveyStatusEnum(str, enum.Enum):
    pending = "pending"
    completed = "completed"
    expired = "expired"
    overdue = "overdue"


class SurveyTypeEnum(str, enum.Enum):
    midpoint = "midpoint"
    end_of_posting = "end_of_posting"
    ad_hoc = "ad_hoc"


class ReminderTypeEnum(str, enum.Enum):
    first = "first"
    second = "second"
    final = "final"


class ReportFormatEnum(str, enum.Enum):
    pdf = "pdf"
    xlsx = "xlsx"
    csv = "csv"


class ReportFrequencyEnum(str, enum.Enum):
    daily = "daily"
    weekly = "weekly"
    monthly = "monthly"


class NotificationType(str, enum.Enum):
    SURVEY_PENDING = "SURVEY_PENDING"
    HOURS_PENDING_APPROVAL = "HOURS_PENDING_APPROVAL"
    HOURS_APPROVED = "HOURS_APPROVED"
    HOURS_REJECTED = "HOURS_REJECTED"
    LOW_SCORE_ALERT = "LOW_SCORE_ALERT"
    DEADLINE_APPROACHING = "DEADLINE_APPROACHING"
    BROADCAST = "BROADCAST"
    ESCALATION = "ESCALATION"
