from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.deps import get_current_user, get_db, require_roles
from app.db.models.user import User
from app.db.models.enums import RoleEnum
from app.services.notification_service import NotificationService
from app.api.v1.notifications.schemas import (
    BroadcastCreate,
    BroadcastResult,
    NotificationRead,
    NotificationUnreadCount,
)
from app.schemas.envelope import Envelope

router = APIRouter()


@router.get("/", response_model=Envelope[List[NotificationRead]])
async def get_notifications(
    unread_only: bool = False,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get paginated notifications for the current user.
    """
    rows = await NotificationService.get_notifications(
        db, current_user.id, unread_only, limit, offset
    )
    data = [NotificationRead.model_validate(n) for n in rows]
    return Envelope(data=data, meta=None, errors=None)


@router.get("/unread-count", response_model=Envelope[NotificationUnreadCount])
async def get_unread_count(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get the count of unread notifications.
    """
    count = await NotificationService.get_unread_count(db, current_user.id)
    return Envelope(
        data=NotificationUnreadCount(count=count),
        meta=None,
        errors=None,
    )


@router.patch("/{notification_id}/read", response_model=Envelope[bool])
async def mark_as_read(
    notification_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Mark a specific notification as read.
    """
    success = await NotificationService.mark_as_read(db, notification_id, current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Notification not found")
    await db.commit()
    return Envelope(data=success, meta=None, errors=None)


@router.post("/mark-all-read", response_model=Envelope[dict])
async def mark_all_read(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Mark all notifications for the current user as read.
    """
    count = await NotificationService.mark_all_read(db, current_user.id)
    await db.commit()
    return Envelope(data={"marked_read": count}, meta=None, errors=None)


@router.post("/broadcast", response_model=Envelope[BroadcastResult])
async def send_broadcast(
    payload: BroadcastCreate,
    current_user: User = Depends(require_roles([RoleEnum.super_admin])),
    db: AsyncSession = Depends(get_db),
):
    """
    Send a broadcast notification to multiple users. Super admin only.
    """

    matched_user_ids = await NotificationService.resolve_broadcast_recipients(
        db,
        target_role=payload.target_role,
        discipline=payload.discipline,
        academic_cycle_id=payload.academic_cycle_id,
        department_id=payload.department_id,
        posting_id=payload.posting_id,
    )

    if payload.dry_run:
        return Envelope(
            data=BroadcastResult(matched_count=len(matched_user_ids), sent_count=0),
            meta=None,
            errors=None,
        )

    sent = await NotificationService.send_broadcast_to_users(
        db,
        actor=current_user,
        user_ids=matched_user_ids,
        title=payload.title,
        message=payload.message,
        criteria={
            "target_role": payload.target_role.value if hasattr(payload.target_role, "value") else str(payload.target_role),
            "discipline": payload.discipline,
            "academic_cycle_id": str(payload.academic_cycle_id) if payload.academic_cycle_id else None,
            "department_id": str(payload.department_id) if payload.department_id else None,
            "posting_id": str(payload.posting_id) if payload.posting_id else None,
        },
    )
    return Envelope(
        data=BroadcastResult(matched_count=len(matched_user_ids), sent_count=sent),
        meta=None,
        errors=None,
    )
