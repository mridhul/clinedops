from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from threading import Lock
from typing import Dict, Optional
from uuid import UUID, uuid4


_refresh_lock = Lock()
_current_refresh_jti_by_user: Dict[UUID, str] = {}


def set_current_refresh_jti(user_id: UUID, jti: str) -> None:
    with _refresh_lock:
        _current_refresh_jti_by_user[user_id] = jti


def get_current_refresh_jti(user_id: UUID) -> Optional[str]:
    with _refresh_lock:
        return _current_refresh_jti_by_user.get(user_id)


def clear_current_refresh_jti(user_id: UUID) -> None:
    with _refresh_lock:
        _current_refresh_jti_by_user.pop(user_id, None)


@dataclass(frozen=True)
class ResetTokenRecord:
    user_id: UUID
    expires_at: datetime


_reset_lock = Lock()
_reset_tokens: Dict[str, ResetTokenRecord] = {}


def create_reset_token(user_id: UUID, expires_in_seconds: int) -> str:
    token = str(uuid4())
    expires_at = datetime.now(timezone.utc) + timedelta(seconds=expires_in_seconds)
    with _reset_lock:
        _reset_tokens[token] = ResetTokenRecord(user_id=user_id, expires_at=expires_at)
    return token


def pop_valid_reset_token(token: str) -> Optional[UUID]:
    now = datetime.now(timezone.utc)
    with _reset_lock:
        rec = _reset_tokens.get(token)
        if rec is None:
            return None
        if rec.expires_at <= now:
            _reset_tokens.pop(token, None)
            return None
        _reset_tokens.pop(token, None)
        return rec.user_id

