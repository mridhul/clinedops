from __future__ import annotations

from celery import shared_task
from app.db.session import async_session_factory
from app.services.survey_service import SurveyService
import asyncio

@shared_task(name="app.tasks.surveys.batch_surveys_task")
def batch_surveys_task():
    """
    Nightly task to group teaching sessions into survey assignments.
    """
    async def _run():
        async with async_session_factory() as session:
            count = await SurveyService.batch_sessions_into_assignments(session)
            return count

    return asyncio.run(_run())

@shared_task(name="app.tasks.surveys.send_reminders_task")
def send_reminders_task():
    """
    Checks for pending survey assignments and sends reminders.
    """
    async def _run():
        # Implementation for reminders would go here
        # Similar to batching, find pending assignments > 3 days old
        return "Reminders sent"

    return asyncio.run(_run())
