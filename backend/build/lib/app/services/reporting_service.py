from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any, Optional
from uuid import UUID

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import ReportExecution, ReportDefinition, ReportSchedule
from app.db.models.enums import StatusEnum, ReportFormatEnum
from app.api.v1.reports.schemas import ReportExecutionCreate, ReportExecutionOut

class ReportingService:

    @staticmethod
    async def create_execution(
        db: AsyncSession,
        template_id: UUID,
        format: str,
        actor_id: UUID
    ) -> ReportExecution:
        execution = ReportExecution(
            template_id=template_id,
            format=format,
            status="pending",
            created_by=actor_id
        )
        db.add(execution)
        await db.commit()
        await db.refresh(execution)
        
        # Trigger Celery Task (to be implemented)
        from app.tasks.reports import generate_report_task
        generate_report_task.delay(str(execution.id))
        
        return execution

    @staticmethod
    async def get_execution(db: AsyncSession, execution_id: UUID) -> Optional[ReportExecution]:
        stmt = select(ReportExecution).where(ReportExecution.id == execution_id)
        return (await db.execute(stmt)).scalars().first()

    @staticmethod
    async def list_executions(
        db: AsyncSession, 
        actor_id: Optional[UUID] = None
    ) -> list[ReportExecution]:
        stmt = select(ReportExecution).order_by(ReportExecution.created_at.desc())
        if actor_id:
             stmt = stmt.where(ReportExecution.created_by == actor_id)
        return list((await db.execute(stmt)).scalars().all())

    @staticmethod
    async def create_template(
        db: AsyncSession,
        name: str,
        config: dict[str, Any],
        actor_id: UUID
    ) -> ReportDefinition:
        template = ReportDefinition(
            name=name,
            config=config,
            created_by=actor_id
        )
        db.add(template)
        await db.commit()
        await db.refresh(template)
        return template

    @staticmethod
    async def list_templates(db: AsyncSession) -> list[ReportDefinition]:
        stmt = select(ReportDefinition).where(ReportDefinition.status == "active")
        return list((await db.execute(stmt)).scalars().all())
