from datetime import datetime
from typing import Optional, Dict, Any, List
from uuid import UUID
from pydantic import BaseModel
from app.db.models.enums import NotificationType

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
