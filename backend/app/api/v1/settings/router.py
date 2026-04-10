from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.api.v1.deps import get_current_user, get_db
from app.db.models.user import User
from app.db.models.core import NotificationPreference
from app.services.notification_service import NotificationService
from app.api.v1.notifications.schemas import NotificationPreferenceRead, NotificationPreferencesUpdate

router = APIRouter()

@router.get("/notifications", response_model=List[NotificationPreferenceRead])
async def get_notification_preferences(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get notification preferences for the current user.
    """
    stmt = select(NotificationPreference).where(NotificationPreference.user_id == current_user.id)
    result = await db.execute(stmt)
    return result.scalars().all()

@router.patch("/notifications", response_model=bool)
async def update_notification_preferences(
    data: NotificationPreferencesUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update notification preferences for the current user.
    """
    await NotificationService.update_preferences(
        db, current_user.id, [p.model_dump() for p in data.preferences]
    )
    return True
