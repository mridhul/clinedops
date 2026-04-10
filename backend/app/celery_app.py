from __future__ import annotations

from celery import Celery

from app.core.config import get_settings

settings = get_settings()

celery_app = Celery(
    "clinedops",
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend,
    include=["app.tasks.surveys", "app.tasks.reports", "app.tasks.notifications"]
)

# Celery CLI expects a module-level variable named `celery` by default.
celery = celery_app

celery_app.conf.update(
    task_track_started=True,
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
)

