from __future__ import annotations

import os
import re
from pathlib import Path
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.reports.schemas import (
    ReportTemplateOut,
    ReportExecutionCreate,
    ReportExecutionOut,
)
from app.schemas.envelope import Envelope
from app.api.v1.deps import require_roles
from app.db.models import User
from app.db.models import ReportDefinition
from app.db.models.enums import RoleEnum
from app.db.session import get_db_session
from app.services.reporting_service import ReportingService

router = APIRouter()


def _reports_storage_dir() -> Path:
    return Path(os.getenv("REPORTS_STORAGE_DIR", "/tmp/clinedops-reports")).resolve()


def _content_type(fmt: str) -> str:
    if fmt == "pdf":
        return "application/pdf"
    if fmt == "csv":
        return "text/csv"
    if fmt == "xlsx":
        return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    return "application/octet-stream"


def _safe_filename(name: str) -> str:
    # Keep it simple and header-safe.
    s = re.sub(r"[^A-Za-z0-9._-]+", "_", name.strip())
    return s[:80] or "report"


@router.get("/templates", response_model=Envelope[list[ReportTemplateOut]])
async def list_templates(
    db: AsyncSession = Depends(get_db_session),
    actor: User = Depends(require_roles([RoleEnum.super_admin, RoleEnum.programme_admin, RoleEnum.supervisor])),
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
    actor: User = Depends(require_roles([RoleEnum.super_admin, RoleEnum.programme_admin, RoleEnum.supervisor])),
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
    actor: User = Depends(require_roles([RoleEnum.super_admin, RoleEnum.programme_admin, RoleEnum.supervisor])),
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
    actor: User = Depends(require_roles([RoleEnum.super_admin, RoleEnum.programme_admin, RoleEnum.supervisor])),
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


@router.get("/executions/{execution_id}/download")
async def download_execution(
    execution_id: UUID,
    db: AsyncSession = Depends(get_db_session),
    actor: User = Depends(require_roles([RoleEnum.super_admin, RoleEnum.programme_admin, RoleEnum.supervisor])),
) -> FileResponse:
    execution = await ReportingService.get_execution(db, execution_id)
    if not execution:
        raise HTTPException(status_code=404, detail="Execution not found")

    # Only allow downloading your own generated reports.
    if execution.created_by != actor.id:
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    if execution.status != "completed":
        raise HTTPException(status_code=400, detail="Report is not ready for download")

    template = (await db.execute(
        select(ReportDefinition).where(ReportDefinition.id == execution.template_id)
    )).scalars().first()
    template_name = template.name if template else "report"

    storage_dir = _reports_storage_dir()
    file_path = storage_dir / f"{execution_id}.{execution.format}"
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Report file not found on server")

    filename = f"{_safe_filename(template_name)}-{execution_id}.{execution.format}"
    return FileResponse(
        path=str(file_path),
        media_type=_content_type(execution.format),
        filename=filename,
    )
