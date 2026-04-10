from pydantic import BaseModel, EmailStr
from typing import Any, Optional
from uuid import UUID
from datetime import datetime

class UserCreate(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    role: str
    discipline: Optional[str] = None
    is_active: bool = True
    password: Optional[str] = "ClinEdOps2024!"

class AuditLogOut(BaseModel):
    id: UUID
    created_at: datetime
    created_by: Optional[UUID] = None
    action: str
    entity_type: Optional[str] = None
    entity_id: Optional[UUID] = None
    before_state: Optional[dict[str, Any]] = None
    after_state: Optional[dict[str, Any]] = None
    metadata_json: dict[str, Any]

class UserOut(BaseModel):
    id: UUID
    email: str
    full_name: Optional[str] = None
    role: str
    discipline: Optional[str] = None
    is_active: bool
    created_at: datetime

class UserListOut(BaseModel):
    items: list[UserOut]
    total: int
    
class SystemSettingsOut(BaseModel):
    id: UUID
    setting_key: str
    setting_value: dict[str, Any]
    description: Optional[str] = None
    
class SystemSettingsUpdate(BaseModel):
    setting_value: dict[str, Any]

class RolePermissionOut(BaseModel):
    id: UUID
    role: str
    permissions: list[str]

class RolePermissionUpdate(BaseModel):
    permissions: list[str]

class ImportBatchOut(BaseModel):
    id: UUID
    batch_type: str
    file_name: Optional[str] = None
    status: str
    details: dict[str, Any]
    created_at: datetime
    created_by: Optional[UUID] = None
