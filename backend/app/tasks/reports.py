from __future__ import annotations

import io
import csv
import asyncio
from datetime import datetime
from uuid import UUID

from celery import shared_task
from sqlalchemy import select, update
from sqlalchemy.orm import Session as SyncSession

from app.db.session import async_session_factory
from app.db.models import ReportExecution, ReportDefinition, TeachingSession, Tutor, Student
from app.db.models.enums import ReportFormatEnum

@shared_task(name="app.tasks.reports.generate_report_task")
def generate_report_task(execution_id: str):
    return asyncio.run(_generate_report_async(execution_id))

async def _generate_report_async(execution_id: str):
    async with async_session_factory() as db:
        try:
            stmt = select(ReportExecution).where(ReportExecution.id == UUID(execution_id))
            execution = (await db.execute(stmt)).scalars().first()
            if not execution:
                return
            
            execution.status = "processing"
            await db.commit()

            template_stmt = select(ReportDefinition).where(ReportDefinition.id == execution.template_id)
            template = (await db.execute(template_stmt)).scalars().first()
            config = template.config
            
            # 1. Fetch Data
            data = []
            if template.name == "Tutor Billing":
                data_stmt = select(TeachingSession).join(Tutor).limit(100)
                sessions = (await db.execute(data_stmt)).scalars().all()
                data = [
                    {
                        "Tutor": s.tutor.tutor_code if s.tutor else "N/A", 
                        "Minutes": s.billable_minutes, 
                        "Date": s.starts_at.isoformat()
                    }
                    for s in sessions
                ]
            else:
                data = [{"Message": "Generic Report Data", "Timestamp": datetime.now().isoformat()}]

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

            # 3. Upload to S3 (Simulated)
            s3_url = f"https://mock-s3.amazonaws.com/reports/{execution_id}.{execution.format}"

            # 4. Finalize
            execution.status = "completed"
            execution.file_url = s3_url
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
