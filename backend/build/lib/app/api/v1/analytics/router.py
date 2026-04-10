from __future__ import annotations

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.analytics.schemas import (
    AdminDashboardOut,
    HODDashboardOut,
    TutorDashboardOut,
    StudentDashboardOut,
)
from app.schemas.envelope import Envelope
from app.api.v1.deps import require_roles
from app.db.models import User
from app.db.models.enums import RoleEnum
from app.db.session import get_db_session
from app.services.analytics_service import AnalyticsService

router = APIRouter()

@router.get("/dashboard", response_model=Envelope[AdminDashboardOut | HODDashboardOut | TutorDashboardOut | StudentDashboardOut])
async def get_dashboard(
    db: AsyncSession = Depends(get_db_session),
    actor: User = Depends(require_roles([
        RoleEnum.super_admin, 
        RoleEnum.programme_admin, 
        RoleEnum.supervisor, 
        RoleEnum.tutor, 
        RoleEnum.student
    ])),
) -> Envelope[Any]:
    if actor.role in [RoleEnum.super_admin, RoleEnum.programme_admin]:
        # Filter by discipline for programme admins if needed
        discipline = actor.programme_admin_profile.discipline if actor.role == RoleEnum.programme_admin else None
        data = await AnalyticsService.get_admin_dashboard(db, actor.id, discipline=discipline)
        return Envelope(data=data, meta=None, errors=None)
    
    elif actor.role == RoleEnum.supervisor: # HOD
        # For simplicity, treat supervisor as HOD for now
        data = await AnalyticsService.get_admin_dashboard(db, actor.id) # Placeholder
        return Envelope(data=data, meta=None, errors=None)
        
    elif actor.role == RoleEnum.tutor:
        data = await AnalyticsService.get_tutor_dashboard(db, actor.tutor_profile.id)
        return Envelope(data=data, meta=None, errors=None)
        
    elif actor.role == RoleEnum.student:
        data = await AnalyticsService.get_student_dashboard(db, actor.student_profile.id)
        return Envelope(data=data, meta=None, errors=None)
    
    raise HTTPException(status_code=403, detail="Role not supported for dashboard")
