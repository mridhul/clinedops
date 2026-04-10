import csv
import io
from fastapi import APIRouter, Depends, Response
from typing import Sequence
from uuid import UUID

from app.api.v1.deps import permission_dependency, get_db
from app.api.v1.admin.schemas import (
    AuditLogOut,
    UserOut,
    SystemSettingsOut,
    SystemSettingsUpdate,
    RolePermissionOut,
    RolePermissionUpdate,
    ImportBatchOut,
)
from app.db.models.enums import RoleEnum
from app.db.models.user import User
from app.schemas.envelope import Envelope
from app.services.admin_service import AdminService
from sqlalchemy.ext.asyncio import AsyncSession


router = APIRouter(
    prefix="/admin",
    tags=["admin"],
    dependencies=[Depends(permission_dependency([RoleEnum.super_admin]))]
)

def get_admin_service(db: AsyncSession = Depends(get_db)):
    return AdminService(db)


@router.get("/users", response_model=Envelope[list[UserOut]])
async def list_users(
    skip: int = 0,
    limit: int = 50,
    role: str | None = None,
    service: AdminService = Depends(get_admin_service),
):
    users, total = await service.get_users(skip=skip, limit=limit, role=role)
    return Envelope(data=users, meta={"total": total, "skip": skip, "limit": limit})


@router.get("/audit-logs", response_model=Envelope[list[AuditLogOut]])
async def list_audit_logs(
    skip: int = 0,
    limit: int = 50,
    action: str | None = None,
    actor_id: UUID | None = None,
    service: AdminService = Depends(get_admin_service),
):
    logs, total = await service.get_audit_logs(skip=skip, limit=limit, action=action, actor_id=actor_id)
    return Envelope(data=logs, meta={"total": total, "skip": skip, "limit": limit})


@router.get("/audit-logs/export")
async def export_audit_logs_csv(
    action: str | None = None,
    actor_id: UUID | None = None,
    service: AdminService = Depends(get_admin_service),
):
    # Fetch a large amount for export
    logs, _ = await service.get_audit_logs(skip=0, limit=10000, action=action, actor_id=actor_id)
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Created At", "Action", "Actor ID", "Entity Type", "Entity ID"])
    for log in logs:
        writer.writerow([
            str(log.id), 
            log.created_at.isoformat(), 
            log.action, 
            str(log.created_by) if log.created_by else "", 
            log.entity_type or "", 
            str(log.entity_id) if log.entity_id else ""
        ])
        
    response = Response(content=output.getvalue(), media_type="text/csv")
    response.headers["Content-Disposition"] = "attachment; filename=audit_logs.csv"
    return response


@router.get("/settings", response_model=Envelope[list[SystemSettingsOut]])
async def list_system_settings(
    service: AdminService = Depends(get_admin_service),
):
    settings = await service.get_system_settings()
    return Envelope(data=settings)


@router.put("/settings/{key}", response_model=Envelope[SystemSettingsOut])
async def update_system_setting(
    key: str,
    payload: SystemSettingsUpdate,
    user: User = Depends(permission_dependency([RoleEnum.super_admin])),
    service: AdminService = Depends(get_admin_service),
):
    setting = await service.update_system_setting(key, payload.setting_value, user.id)
    return Envelope(data=setting)


@router.get("/rbac", response_model=Envelope[list[RolePermissionOut]])
async def list_role_permissions(
    service: AdminService = Depends(get_admin_service),
):
    rbac = await service.get_role_permissions()
    return Envelope(data=rbac)


@router.put("/rbac/{role}", response_model=Envelope[RolePermissionOut])
async def update_role_permissions(
    role: str,
    payload: RolePermissionUpdate,
    user: User = Depends(permission_dependency([RoleEnum.super_admin])),
    service: AdminService = Depends(get_admin_service),
):
    rp = await service.update_role_permissions(role, payload.permissions, user.id)
    return Envelope(data=rp)


@router.get("/imports", response_model=Envelope[list[ImportBatchOut]])
async def list_imports(
    skip: int = 0,
    limit: int = 5,
    service: AdminService = Depends(get_admin_service),
):
    imports, total = await service.get_import_history(skip=skip, limit=limit)
    return Envelope(data=imports, meta={"total": total, "skip": skip, "limit": limit})
