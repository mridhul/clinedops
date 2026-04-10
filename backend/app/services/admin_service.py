from typing import Any, Sequence, Optional, Union, TYPE_CHECKING
from uuid import UUID

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.core import AuditLog, SystemSettings, RolePermission, ImportBatch
from app.db.models.user import User
from app.api.v1.admin.schemas import UserCreate
from app.core.security import hash_password
from fastapi import HTTPException


class AdminService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_user(self, payload: UserCreate, creator_id: UUID) -> User:
        # Check if email already exists
        existing = await self.db.execute(select(User).where(User.email == payload.email))
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="User with this email already exists")

        user = User(
            email=payload.email,
            full_name=payload.full_name,
            hashed_password=hash_password(payload.password),
            role=payload.role,
            discipline=payload.discipline,
            is_active=payload.is_active,
            created_by=creator_id,
        )
        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)
        return user

    async def get_users(self, skip: int = 0, limit: int = 50, role: Optional[str] = None) -> tuple[Sequence[User], int]:
        query = select(User)
        if role:
            query = query.where(User.role == role)
        
        # Count
        count_stmt = select(func.count()).select_from(query.subquery())
        total = await self.db.scalar(count_stmt) or 0
        
        # Paginate
        query = query.offset(skip).limit(limit)
        result = await self.db.execute(query)
        users = result.scalars().all()
        return users, total

    async def get_audit_logs(
        self, skip: int = 0, limit: int = 50, actor_id: Optional[UUID] = None, action: Optional[str] = None
    ) -> tuple[Sequence[AuditLog], int]:
        query = select(AuditLog)
        if actor_id:
            query = query.where(AuditLog.created_by == actor_id)
        if action:
            query = query.where(AuditLog.action == action)
            
        count_stmt = select(func.count()).select_from(query.subquery())
        total = await self.db.scalar(count_stmt) or 0

        query = query.order_by(AuditLog.created_at.desc()).offset(skip).limit(limit)
        result = await self.db.execute(query)
        logs = result.scalars().all()
        return logs, total

    async def get_system_settings(self) -> Sequence[SystemSettings]:
        result = await self.db.execute(select(SystemSettings))
        return result.scalars().all()

    async def update_system_setting(self, key: str, value: dict[str, Any], user_id: UUID) -> SystemSettings:
        result = await self.db.execute(select(SystemSettings).where(SystemSettings.setting_key == key))
        setting = result.scalars().first()
        if not setting:
            setting = SystemSettings(setting_key=key, setting_value=value, updated_by=user_id)
            self.db.add(setting)
        else:
            setting.setting_value = value
            setting.updated_by = user_id
        await self.db.commit()
        await self.db.refresh(setting)
        return setting

    async def get_role_permissions(self) -> Sequence[RolePermission]:
        result = await self.db.execute(select(RolePermission))
        return result.scalars().all()

    async def update_role_permissions(self, role: str, permissions: list[str], user_id: UUID) -> RolePermission:
        result = await self.db.execute(select(RolePermission).where(RolePermission.role == role))
        rp = result.scalars().first()
        if not rp:
            rp = RolePermission(role=role, permissions=permissions, updated_by=user_id)
            self.db.add(rp)
        else:
            rp.permissions = permissions
            rp.updated_by = user_id
        await self.db.commit()
        await self.db.refresh(rp)
        return rp

    async def get_import_history(self, skip: int = 0, limit: int = 5) -> tuple[Sequence[ImportBatch], int]:
        query = select(ImportBatch)
        
        count_stmt = select(func.count()).select_from(query.subquery())
        total = await self.db.scalar(count_stmt) or 0
        
        query = query.order_by(ImportBatch.created_at.desc()).offset(skip).limit(limit)
        result = await self.db.execute(query)
        imports = result.scalars().all()
        return imports, total
