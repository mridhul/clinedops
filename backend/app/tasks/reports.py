from __future__ import annotations

import io
import csv
import asyncio
import os
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal
from pathlib import Path
from uuid import UUID

from celery import shared_task
from sqlalchemy import case, func, select
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

from app.core.config import get_settings
from app.db.models import (
    ReportExecution,
    ReportDefinition,
    SurveySubmission,
    SurveyTemplate,
    TeachingSession,
    Tutor,
    TutorBillableRate,
    User,
)

@shared_task(name="app.tasks.reports.generate_report_task")
def generate_report_task(execution_id: str):
    return asyncio.run(_generate_report_async(execution_id))


async def _get_billable_rate(db, tutor_id: UUID, session_date: date) -> Decimal | None:
    stmt = (
        select(TutorBillableRate.rate_per_hour)
        .where(
            TutorBillableRate.tutor_id == tutor_id,
            TutorBillableRate.is_active.is_(True),
            TutorBillableRate.effective_from <= session_date,
        )
        .where(
            (TutorBillableRate.effective_to.is_(None))
            | (TutorBillableRate.effective_to >= session_date)
        )
        .order_by(TutorBillableRate.effective_from.desc())
        .limit(1)
    )
    return (await db.execute(stmt)).scalars().first()


def _window_start(window_days: int) -> datetime:
    now = datetime.now(timezone.utc)
    return now - timedelta(days=window_days)


def _reports_storage_dir() -> Path:
    # Default to an ephemeral but writable location in containers.
    return Path(os.getenv("REPORTS_STORAGE_DIR", "/tmp/clinedops-reports")).resolve()


async def _generate_report_async(execution_id: str):
    settings = get_settings()
    engine = create_async_engine(
        settings.database_url,
        poolclass=NullPool,  # important for Celery prefork + asyncio.run
        pool_pre_ping=True,
    )
    SessionLocal = async_sessionmaker(engine, expire_on_commit=False, autoflush=False)

    async with SessionLocal() as db:
        try:
            stmt = select(ReportExecution).where(ReportExecution.id == UUID(execution_id))
            execution = (await db.execute(stmt)).scalars().first()
            if not execution:
                return
            
            execution.status = "processing"
            await db.commit()

            template_stmt = select(ReportDefinition).where(ReportDefinition.id == execution.template_id)
            template = (await db.execute(template_stmt)).scalars().first()
            if not template:
                raise RuntimeError("Report template not found")

            config = template.config or {}
            report_type = (
                config.get("report_type")
                or config.get("type")
                or config.get("template_type")
            )
            default_params = config.get("default_params") or {}

            actor: User | None = None
            if execution.created_by:
                actor = (await db.execute(select(User).where(User.id == execution.created_by))).scalars().first()
            actor_discipline = actor.discipline if actor else None

            # Backward compatibility: older seeded templates may not have report_type in config.
            if not report_type:
                name_l = (template.name or "").strip().lower()
                if "billing" in name_l:
                    report_type = "billing_export"
                elif "teaching" in name_l or "hours" in name_l:
                    report_type = "teaching_hours_summary"
                elif "survey" in name_l or "feedback" in name_l or "appraisal" in name_l or "faculty" in name_l:
                    report_type = "survey_analytics"
            
            # 1. Fetch Data
            data: list[dict[str, object]] = []
            window_days = int(default_params.get("window_days") or 30)
            status = default_params.get("status") or "approved"
            start_dt = _window_start(window_days)

            if report_type == "teaching_hours_summary":
                # Aggregate approved teaching hours by tutor for the last N days.
                stmt = (
                    select(
                        TeachingSession.tutor_id,
                        func.count(TeachingSession.id).label("session_count"),
                        func.coalesce(func.sum(TeachingSession.duration_minutes), 0).label("total_minutes"),
                        func.max(TeachingSession.starts_at).label("last_session_at"),
                        Tutor.tutor_code,
                    )
                    .join(Tutor, Tutor.id == TeachingSession.tutor_id)
                    .where(TeachingSession.is_active.is_(True))
                    .where(TeachingSession.starts_at >= start_dt)
                    .where(TeachingSession.approval_status == status)
                    .group_by(TeachingSession.tutor_id, Tutor.tutor_code)
                    .order_by(func.coalesce(func.sum(TeachingSession.duration_minutes), 0).desc())
                )
                if actor_discipline:
                    stmt = stmt.where(TeachingSession.discipline == actor_discipline)

                rows = (await db.execute(stmt)).all()
                data = [
                    {
                        "TutorCode": r.tutor_code,
                        "TutorId": str(r.tutor_id),
                        "Sessions": int(r.session_count or 0),
                        "TotalMinutes": int(r.total_minutes or 0),
                        "TotalHours": float(Decimal(int(r.total_minutes or 0)) / Decimal(60)),
                        "LastSessionAt": r.last_session_at.isoformat() if r.last_session_at else None,
                    }
                    for r in rows
                ]

            elif report_type == "billing_export":
                # Export approved billable minutes + computed amount (rate-per-hour x billable_minutes/60).
                stmt = (
                    select(
                        TeachingSession.id,
                        TeachingSession.tutor_id,
                        TeachingSession.starts_at,
                        TeachingSession.billable_minutes,
                        Tutor.tutor_code,
                    )
                    .join(Tutor, Tutor.id == TeachingSession.tutor_id)
                    .where(TeachingSession.is_active.is_(True))
                    .where(TeachingSession.starts_at >= start_dt)
                    .where(TeachingSession.approval_status == status)
                    .where(TeachingSession.billable_minutes.is_not(None))
                    .where(TeachingSession.billable_minutes > 0)
                    .order_by(TeachingSession.starts_at.desc())
                )
                if actor_discipline:
                    stmt = stmt.where(TeachingSession.discipline == actor_discipline)

                rows = (await db.execute(stmt)).all()
                for r in rows:
                    mins = int(r.billable_minutes or 0)
                    session_date = r.starts_at.date() if r.starts_at else None
                    rate = await _get_billable_rate(db, r.tutor_id, session_date) if session_date else None
                    amount: Decimal | None = None
                    if rate is not None:
                        amount = (Decimal(mins) / Decimal(60)) * Decimal(rate)
                    data.append(
                        {
                            "SessionId": str(r.id),
                            "TutorCode": r.tutor_code,
                            "TutorId": str(r.tutor_id),
                            "SessionStart": r.starts_at.isoformat() if r.starts_at else None,
                            "BillableMinutes": mins,
                            "RatePerHour": str(rate) if rate is not None else None,
                            "AmountSGD": str(amount.quantize(Decimal("0.01"))) if amount is not None else None,
                        }
                    )

            elif report_type == "survey_analytics":
                # Aggregate survey submissions by template for the last N days.
                stmt = (
                    select(
                        SurveyTemplate.id.label("template_id"),
                        SurveyTemplate.name.label("template_name"),
                        SurveyTemplate.discipline.label("discipline"),
                        func.count(SurveySubmission.id).label("submission_count"),
                        func.avg(SurveySubmission.overall_score).label("avg_score"),
                        func.sum(case((SurveySubmission.has_low_scores.is_(True), 1), else_=0)).label("low_score_count"),
                        func.max(SurveySubmission.created_at).label("last_submitted_at"),
                    )
                    .join(SurveyTemplate, SurveyTemplate.id == SurveySubmission.template_id)
                    .where(SurveySubmission.is_active.is_(True))
                    .where(SurveySubmission.created_at >= start_dt)
                    .group_by(SurveyTemplate.id, SurveyTemplate.name, SurveyTemplate.discipline)
                    .order_by(func.count(SurveySubmission.id).desc())
                )
                if actor_discipline:
                    stmt = stmt.where(SurveyTemplate.discipline == actor_discipline)

                rows = (await db.execute(stmt)).all()
                data = [
                    {
                        "TemplateId": str(r.template_id),
                        "TemplateName": r.template_name,
                        "Discipline": r.discipline,
                        "Submissions": int(r.submission_count or 0),
                        "AvgOverallScore": float(r.avg_score) if r.avg_score is not None else None,
                        "LowScoreSubmissions": int(r.low_score_count or 0),
                        "LastSubmittedAt": r.last_submitted_at.isoformat() if r.last_submitted_at else None,
                    }
                    for r in rows
                ]

            else:
                data = [
                    {
                        "Message": "Unknown report type",
                        "ReportType": report_type,
                        "TemplateName": template.name,
                        "Timestamp": datetime.now(timezone.utc).isoformat(),
                    }
                ]

            # 2. Generate File
            file_content = b""
            if execution.format == "csv":
                output = io.StringIO()
                if data:
                    writer = csv.DictWriter(output, fieldnames=data[0].keys())
                    writer.writeheader()
                    writer.writerows(data)
                file_content = output.getvalue().encode("utf-8")
            
            elif execution.format == "xlsx":
                from openpyxl import Workbook
                wb = Workbook()
                ws = wb.active
                if data:
                    ws.append(list(data[0].keys()))
                    for row in data:
                        ws.append(list(row.values()))
                out = io.BytesIO()
                wb.save(out)
                file_content = out.getvalue()

            elif execution.format == "pdf":
                from reportlab.lib.pagesizes import letter
                from reportlab.pdfgen import canvas
                out = io.BytesIO()
                c = canvas.Canvas(out, pagesize=letter)
                c.drawString(100, 750, f"Report: {template.name}")
                y = 700
                for row in data[:20]:
                    c.drawString(100, y, str(row))
                    y -= 20
                c.save()
                file_content = out.getvalue()

            # 3. Persist on local disk
            storage_dir = _reports_storage_dir()
            storage_dir.mkdir(parents=True, exist_ok=True)
            file_path = storage_dir / f"{execution_id}.{execution.format}"
            file_path.write_bytes(file_content)

            # 4. Finalize
            execution.status = "completed"
            # Note: VITE_API_BASE_URL typically already includes `/api/v1`,
            # so we store paths relative to that base to avoid `/api/v1/api/v1/...`.
            execution.file_url = f"/reports/executions/{execution_id}/download"
            await db.commit()

        except Exception as e:
            await db.rollback()
            # Reload to avoid session issues
            stmt = select(ReportExecution).where(ReportExecution.id == UUID(execution_id))
            execution = (await db.execute(stmt)).scalars().first()
            if execution:
                execution.status = "failed"
                execution.error_message = str(e)
                await db.commit()
            raise e
        finally:
            await engine.dispose()
