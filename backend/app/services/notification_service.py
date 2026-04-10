import uuid
from datetime import datetime
from typing import Optional, List, Sequence
from sqlalchemy import select, update, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.core import Notification, NotificationPreference
from app.db.models.enums import NotificationType, RoleEnum
from app.tasks.notifications import send_email_notification_task
from app.services.audit_service import record_audit

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

        # Broadcasts are in-app only (no SES fan-out for mass sends).
        if notification_type == NotificationType.BROADCAST:
            email_enabled = False

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

    @staticmethod
    async def resolve_broadcast_recipients(
        db: AsyncSession,
        *,
        target_role: RoleEnum,
        discipline: Optional[str] = None,
        academic_cycle_id: Optional[uuid.UUID] = None,
        department_id: Optional[uuid.UUID] = None,
        posting_id: Optional[uuid.UUID] = None,
    ) -> list[uuid.UUID]:
        from app.db.models.user import User
        from app.db.models.core import Posting, PostingTutor, Student, Tutor

        # Without posting_id: target all active students/tutors (profile fields for filters).
        # With posting_id: narrow to users linked to that posting (posting row filters).
        if target_role.value == RoleEnum.student.value:
            if posting_id is not None:
                stmt = (
                    select(User.id)
                    .join(Student, Student.user_id == User.id)
                    .join(Posting, Posting.student_id == Student.id)
                    .where(User.is_active.is_(True))
                    .where(Posting.is_active.is_(True))
                    .where(Student.is_active.is_(True))
                    .where(User.role == RoleEnum.student.value)
                    .where(Posting.id == posting_id)
                )
                if discipline:
                    stmt = stmt.where(Posting.discipline == discipline)
                if academic_cycle_id:
                    stmt = stmt.where(Posting.academic_cycle_id == academic_cycle_id)
                if department_id:
                    stmt = stmt.where(Posting.department_id == department_id)
            else:
                stmt = (
                    select(User.id)
                    .join(Student, Student.user_id == User.id)
                    .where(User.is_active.is_(True))
                    .where(Student.is_active.is_(True))
                    .where(User.role == RoleEnum.student.value)
                )
                if discipline:
                    stmt = stmt.where(Student.discipline == discipline)
                if academic_cycle_id:
                    stmt = stmt.where(Student.academic_cycle_id == academic_cycle_id)
                if department_id:
                    stmt = stmt.where(Student.department_id == department_id)
        elif target_role.value == RoleEnum.tutor.value:
            if posting_id is not None:
                stmt = (
                    select(User.id)
                    .join(Tutor, Tutor.user_id == User.id)
                    .join(PostingTutor, PostingTutor.tutor_id == Tutor.id)
                    .join(Posting, Posting.id == PostingTutor.posting_id)
                    .where(User.is_active.is_(True))
                    .where(Posting.is_active.is_(True))
                    .where(Tutor.is_active.is_(True))
                    .where(PostingTutor.is_active.is_(True))
                    .where(User.role == RoleEnum.tutor.value)
                    .where(Posting.id == posting_id)
                )
                if discipline:
                    stmt = stmt.where(Posting.discipline == discipline)
                if academic_cycle_id:
                    stmt = stmt.where(Posting.academic_cycle_id == academic_cycle_id)
                if department_id:
                    stmt = stmt.where(Posting.department_id == department_id)
            else:
                stmt = (
                    select(User.id)
                    .join(Tutor, Tutor.user_id == User.id)
                    .where(User.is_active.is_(True))
                    .where(Tutor.is_active.is_(True))
                    .where(User.role == RoleEnum.tutor.value)
                )
                if discipline:
                    stmt = stmt.where(Tutor.discipline == discipline)
                if academic_cycle_id:
                    stmt = stmt.where(Tutor.academic_cycle_id == academic_cycle_id)
                if department_id:
                    stmt = stmt.where(Tutor.department_id == department_id)
        else:
            # v1 supports student/tutor only
            return []

        rows = (await db.execute(stmt)).scalars().all()
        return list({uid for uid in rows})

    @staticmethod
    async def send_broadcast_to_users(
        db: AsyncSession,
        *,
        actor,
        user_ids: list[uuid.UUID],
        title: str,
        message: str,
        criteria: dict,
    ) -> int:
        sent = 0
        for u_id in user_ids:
            await NotificationService.create_notification(
                db,
                u_id,
                NotificationType.BROADCAST,
                title,
                message,
                data={"criteria": criteria},
            )
            sent += 1

        await record_audit(
            db,
            actor_id=actor.id,
            action="CREATE",
            entity_type="broadcast",
            entity_id=None,
            before_state=None,
            after_state={"sent_count": sent, **criteria},
        )

        await db.commit()
        return sent
