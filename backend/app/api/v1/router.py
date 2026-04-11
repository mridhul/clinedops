from __future__ import annotations

from fastapi import APIRouter

from app.api.v1.academic_cycles.router import router as academic_cycles_router
from app.api.v1.admin.router import router as admin_router
from app.api.v1.auth.router import router as auth_router
from app.api.v1.departments.router import router as departments_router
from app.api.v1.health import router as health_router
from app.api.v1.postings.router import router as postings_router
from app.api.v1.students.router import router as students_router
from app.api.v1.teaching_hours.router import router as teaching_hours_router
from app.api.v1.tutors.router import router as tutors_router
from app.api.v1.shadowing.router import router as shadowing_router

from app.api.v1.surveys.router import router as surveys_router
from app.api.v1.analytics.router import router as analytics_router
from app.api.v1.reports.router import router as reports_router
from app.api.v1.notifications.router import router as notifications_router
from app.api.v1.settings.router import router as settings_router
from app.api.v1.ai_help.router import router as ai_help_router

api_router = APIRouter()
api_router.include_router(health_router)
api_router.include_router(auth_router)
api_router.include_router(admin_router)
api_router.include_router(students_router)
api_router.include_router(tutors_router)
api_router.include_router(postings_router)
api_router.include_router(academic_cycles_router)
api_router.include_router(departments_router)
api_router.include_router(teaching_hours_router)
api_router.include_router(surveys_router)
api_router.include_router(analytics_router, prefix="/analytics", tags=["analytics"])
api_router.include_router(reports_router, prefix="/reports", tags=["reports"])
api_router.include_router(notifications_router, prefix="/notifications", tags=["notifications"])
api_router.include_router(settings_router, prefix="/settings", tags=["settings"])
api_router.include_router(ai_help_router, prefix="/ai-help", tags=["ai_help"])
api_router.include_router(shadowing_router, prefix="/shadowing", tags=["shadowing"])


