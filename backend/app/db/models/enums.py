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

