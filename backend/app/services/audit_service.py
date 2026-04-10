from __future__ import annotations

from typing import Any, Optional
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import AuditLog


async def record_audit(
    session: AsyncSession,
    *,
    actor_id: Optional[UUID],
    action: str,
    entity_type: str,
    entity_id: Optional[UUID],
    before_state: Optional[dict[str, Any]],
    after_state: Optional[dict[str, Any]],
    metadata: Optional[dict[str, Any]] = None,
) -> None:
    meta = metadata or {}
    log = AuditLog(
        created_by=actor_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        before_state=before_state,
        after_state=after_state,
        metadata_json=meta,
    )
    session.add(log)
