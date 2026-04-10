import uuid
from datetime import datetime
from typing import Optional, List, Sequence
from sqlalchemy import select, update, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.core import Notification, NotificationPreference
from app.db.models.enums import NotificationType
from app.tasks.notifications import send_email_notification_task

class NotificationService:
    @staticmethod
    async def create_notification(
        db: AsyncSession,
        recipient_id: uuid.UUID,
        notification_type: NotificationType,
        title: str,
        message: str,
        data: Optional[dict] = None
    ) -> Notification:
        # 1. Persist notification
        notification = Notification(
            recipient_id=recipient_id,
            type=notification_type,
            title=title,
            message=message,
            data=data
        )
        db.add(notification)
        await db.flush()

        # 2. Check preferences for email
        pref_stmt = select(NotificationPreference).where(
            and_(
                NotificationPreference.user_id == recipient_id,
                NotificationPreference.notification_type == notification_type
            )
        )
        pref_result = await db.execute(pref_stmt)
        preference = pref_result.scalar_one_or_none()

        # Default to True if no preference set yet
        email_enabled = preference.email_enabled if preference else True

        if email_enabled:
            # Trigger async email task
            # We pass the ID and recipient info
            send_email_notification_task.delay(
                str(notification.id),
                str(recipient_id),
                title,
                message
            )

        return notification

    @staticmethod
    async def get_notifications(
        db: AsyncSession,
        user_id: uuid.UUID,
        unread_only: bool = False,
        limit: int = 50,
        offset: int = 0
    ) -> Sequence[Notification]:
        stmt = select(Notification).where(Notification.recipient_id == user_id)
        if unread_only:
            stmt = stmt.where(Notification.is_read == False)
        
        stmt = stmt.order_by(Notification.created_at.desc()).limit(limit).offset(offset)
        result = await db.execute(stmt)
        return result.scalars().all()

    @staticmethod
    async def get_unread_count(db: AsyncSession, user_id: uuid.UUID) -> int:
        stmt = select(func.count(Notification.id)).where(
            and_(Notification.recipient_id == user_id, Notification.is_read == False)
        )
        result = await db.execute(stmt)
        return result.scalar() or 0

    @staticmethod
    async def mark_as_read(db: AsyncSession, notification_id: uuid.UUID, user_id: uuid.UUID) -> bool:
        stmt = update(Notification).where(
            and_(Notification.id == notification_id, Notification.recipient_id == user_id)
        ).values(is_read=True, read_at=datetime.utcnow())
        
        result = await db.execute(stmt)
        return result.rowcount > 0

    @staticmethod
    async def mark_all_read(db: AsyncSession, user_id: uuid.UUID) -> int:
        stmt = update(Notification).where(
            and_(Notification.recipient_id == user_id, Notification.is_read == False)
        ).values(is_read=True, read_at=datetime.utcnow())
        
        result = await db.execute(stmt)
        return result.rowcount

    @staticmethod
    async def update_preferences(
        db: AsyncSession,
        user_id: uuid.UUID,
        preferences: List[dict] # [{"type": "HOURS_APPROVED", "enabled": true}, ...]
    ):
        for p in preferences:
            n_type = NotificationType(p["type"])
            enabled = p["enabled"]
            
            # Upsert preference
            stmt = select(NotificationPreference).where(
                and_(NotificationPreference.user_id == user_id, NotificationPreference.notification_type == n_type)
            )
            result = await db.execute(stmt)
            pref = result.scalar_one_or_none()
            
            if pref:
                pref.email_enabled = enabled
            else:
                db.add(NotificationPreference(user_id=user_id, notification_type=n_type, email_enabled=enabled))
        
        await db.commit()

    @staticmethod
    async def send_broadcast(
        db: AsyncSession,
        title: str,
        message: str,
        discipline: Optional[str] = None,
        role: Optional[str] = None,
        data: Optional[dict] = None
    ) -> int:
        from app.db.models.user import User
        
        stmt = select(User.id)
        filters = []
        if discipline:
            filters.append(User.discipline == discipline)
        if role:
            filters.append(User.role == role)
        
        if filters:
            stmt = stmt.where(and_(*filters))
        
        result = await db.execute(stmt)
        user_ids = result.scalars().all()
        
        count = 0
        for u_id in user_ids:
            await NotificationService.create_notification(
                db, u_id, NotificationType.BROADCAST, title, message, data
            )
            count += 1
        
        await db.commit()
        return count
