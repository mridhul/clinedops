from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Any, Literal, Optional
from uuid import UUID, uuid4

import bcrypt
from jose import jwt

from app.core.config import get_settings



TokenType = Literal["access", "refresh"]


@dataclass(frozen=True)
class DecodedToken:
    token_type: TokenType
    user_id: UUID
    role: str
    discipline: Optional[str]
    jti: str
    exp: datetime


def hash_password(password: str) -> str:
    # bcrypt truncates at 72 bytes; we rely on our API validation constraints.
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")


def verify_password(password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), hashed_password.encode("utf-8"))


def _now_utc() -> datetime:
    return datetime.now(timezone.utc)


def create_jwt(token_type: TokenType, *, user_id: UUID, role: str, discipline: Optional[str]) -> tuple[str, str]:
    settings = get_settings()
    ttl_seconds: int
    if token_type == "access":
        ttl_seconds = settings.access_token_ttl_minutes * 60
    else:
        ttl_seconds = settings.refresh_token_ttl_days * 24 * 60 * 60

    now = _now_utc()
    exp = now + timedelta(seconds=ttl_seconds)
    jti = str(uuid4())

    payload: dict[str, Any] = {
        "iss": settings.jwt_issuer,
        "aud": settings.jwt_audience,
        "sub": str(user_id),
        "type": token_type,
        "role": role,
        "discipline": discipline,
        "jti": jti,
        "iat": int(now.timestamp()),
        "exp": int(exp.timestamp()),
    }

    token = jwt.encode(payload, settings.jwt_private_key, algorithm="RS256")
    return token, jti


def decode_jwt(token: str, expected_type: TokenType) -> DecodedToken:
    settings = get_settings()
    payload = jwt.decode(
        token,
        settings.jwt_public_key,
        algorithms=["RS256"],
        issuer=settings.jwt_issuer,
        audience=settings.jwt_audience,
    )

    token_type = payload.get("type")
    if token_type != expected_type:
        raise ValueError("Invalid token type")

    exp_ts = payload.get("exp")
    if exp_ts is None:
        raise ValueError("Missing exp")

    exp_dt = datetime.fromtimestamp(int(exp_ts), tz=timezone.utc)

    return DecodedToken(
        token_type=expected_type,
        user_id=UUID(str(payload["sub"])),
        role=str(payload["role"]),
        discipline=payload.get("discipline"),
        jti=str(payload["jti"]),
        exp=exp_dt,
    )

