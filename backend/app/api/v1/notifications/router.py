from typing import List, Sequence, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.deps import get_current_user, get_db
from app.db.models.user import User
from app.services.notification_service import NotificationService
from app.api.v1.notifications.schemas import NotificationRead, NotificationUnreadCount

router = APIRouter()

@router.get("/", response_model=List[NotificationRead])
async def get_notifications(
    unread_only: bool = False,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get paginated notifications for the current user.
    """
    return await NotificationService.get_notifications(
        db, current_user.id, unread_only, limit, offset
    )

@router.get("/unread-count", response_model=NotificationUnreadCount)
async def get_unread_count(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get the count of unread notifications.
    """
    count = await NotificationService.get_unread_count(db, current_user.id)
    return {"count": count}

@router.patch("/{notification_id}/read", response_model=bool)
async def mark_as_read(
    notification_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Mark a specific notification as read.
    """
    success = await NotificationService.mark_as_read(db, notification_id, current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Notification not found")
    await db.commit()
    return True

@router.post("/mark-all-read")
async def mark_all_read(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Mark all notifications for the current user as read.
    """
    count = await NotificationService.mark_all_read(db, current_user.id)
    await db.commit()
    return {"marked_read": count}

@router.post("/broadcast")
async def send_broadcast(
    title: str,
    message: str,
    discipline: Optional[str] = None,
    role: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Send a broadcast notification to multiple users. Admin only.
    """
    if current_user.role != "Admin":
        raise HTTPException(status_code=403, detail="Admin only")
    
    count = await NotificationService.send_broadcast(
        db, title, message, discipline, role
    )
    return {"sent_count": count}
