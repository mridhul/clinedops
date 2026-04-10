import asyncio
import os
import uuid
from sqlalchemy import insert
from app.db.session import async_session_factory
from app.db.models import ReportDefinition

async def seed_reports():
    async with async_session_factory() as db:
        templates = [
            {
                "id": uuid.uuid4(),
                "name": "Tutor Billing",
                "config": {"fields": ["tutor_code", "billable_minutes", "starts_at"], "filters": {"status": "approved"}},
                "status": "active"
            },
            {
                "id": uuid.uuid4(),
                "name": "Faculty Appraisal",
                "config": {"fields": ["tutor_name", "avg_feedback_score", "sessions_count"]},
                "status": "active"
            },
            {
                "id": uuid.uuid4(),
                "name": "Programme Quality Review",
                "config": {"fields": ["department", "completion_rate", "flagged_count"]},
                "status": "active"
            }
        ]
        
        for t in templates:
            await db.execute(insert(ReportDefinition).values(**t))
        
        await db.commit()
        print(f"Seeded {len(templates)} report templates.")

if __name__ == "__main__":
    asyncio.run(seed_reports())
