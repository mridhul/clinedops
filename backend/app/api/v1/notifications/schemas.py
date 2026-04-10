from datetime import datetime
from typing import Optional, Dict, Any, List
from uuid import UUID
from pydantic import BaseModel, Field
from app.db.models.enums import NotificationType
from app.db.models.enums import RoleEnum

class NotificationRead(BaseModel):
    id: UUID
    type: NotificationType
    title: str
    message: str
    data: Optional[Dict[str, Any]] = None
    is_read: bool
    read_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

class NotificationUnreadCount(BaseModel):
    count: int

class NotificationPreferenceRead(BaseModel):
    notification_type: NotificationType
    email_enabled: bool

    class Config:
        from_attributes = True

class NotificationPreferenceUpdate(BaseModel):
    type: NotificationType
    enabled: bool

class NotificationPreferencesUpdate(BaseModel):
    preferences: List[NotificationPreferenceUpdate]


class BroadcastCreate(BaseModel):
    title: str = Field(min_length=1, max_length=100)
    message: str = Field(min_length=1, max_length=2000)
    target_role: RoleEnum
    discipline: Optional[str] = None
    academic_cycle_id: Optional[UUID] = None
    department_id: Optional[UUID] = None
    posting_id: Optional[UUID] = None
    dry_run: bool = False


class BroadcastResult(BaseModel):
    matched_count: int
    sent_count: int
