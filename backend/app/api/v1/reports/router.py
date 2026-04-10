from __future__ import annotations

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.reports.schemas import (
    ReportTemplateOut,
    ReportExecutionCreate,
    ReportExecutionOut,
)
from app.schemas.envelope import Envelope
from app.api.v1.deps import require_roles
from app.db.models import User
from app.db.models.enums import RoleEnum
from app.db.session import get_db_session
from app.services.reporting_service import ReportingService

router = APIRouter()

@router.get("/templates", response_model=Envelope[list[ReportTemplateOut]])
async def list_templates(
    db: AsyncSession = Depends(get_db_session),
    actor: User = Depends(require_roles([RoleEnum.super_admin, RoleEnum.programme_admin])),
) -> Envelope[list[ReportTemplateOut]]:
    templates = await ReportingService.list_templates(db)
    out = [ReportTemplateOut(
        id=t.id,
        name=t.name,
        config=t.config,
        status=t.status,
        created_at=t.created_at
    ) for t in templates]
    return Envelope(data=out, meta={"total": len(out)}, errors=None)

@router.post("/executions", response_model=Envelope[ReportExecutionOut])
async def create_execution(
    payload: ReportExecutionCreate,
    db: AsyncSession = Depends(get_db_session),
    actor: User = Depends(require_roles([RoleEnum.super_admin, RoleEnum.programme_admin])),
) -> Envelope[ReportExecutionOut]:
    execution = await ReportingService.create_execution(
        db, 
        template_id=payload.template_id, 
        format=payload.format, 
        actor_id=actor.id
    )
    out = ReportExecutionOut(
        id=execution.id,
        template_id=execution.template_id,
        status=execution.status,
        format=execution.format,
        created_at=execution.created_at
    )
    return Envelope(data=out, meta=None, errors=None)

@router.get("/executions/{execution_id}", response_model=Envelope[ReportExecutionOut])
async def get_execution(
    execution_id: UUID,
    db: AsyncSession = Depends(get_db_session),
    actor: User = Depends(require_roles([RoleEnum.super_admin, RoleEnum.programme_admin])),
) -> Envelope[ReportExecutionOut]:
    execution = await ReportingService.get_execution(db, execution_id)
    if not execution:
        raise HTTPException(status_code=404, detail="Execution not found")
    
    out = ReportExecutionOut(
        id=execution.id,
        template_id=execution.template_id,
        status=execution.status,
        format=execution.format,
        file_url=execution.file_url,
        error_message=execution.error_message,
        created_at=execution.created_at,
        expires_at=execution.expires_at
    )
    return Envelope(data=out, meta=None, errors=None)

@router.get("/history", response_model=Envelope[list[ReportExecutionOut]])
async def list_history(
    db: AsyncSession = Depends(get_db_session),
    actor: User = Depends(require_roles([RoleEnum.super_admin, RoleEnum.programme_admin])),
) -> Envelope[list[ReportExecutionOut]]:
    executions = await ReportingService.list_executions(db, actor_id=actor.id)
    out = [ReportExecutionOut(
        id=e.id,
        template_id=e.template_id,
        status=e.status,
        format=e.format,
        file_url=e.file_url,
        error_message=e.error_message,
        created_at=e.created_at,
        expires_at=e.expires_at
    ) for e in executions]
    return Envelope(data=out, meta={"total": len(out)}, errors=None)
