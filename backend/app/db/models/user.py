from __future__ import annotations

from typing import Optional
from uuid import UUID, uuid4

from sqlalchemy import Boolean, ForeignKey, String, text
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, SoftDeleteMixin, TimestampMixin



class User(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "users"

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
        server_default=text("gen_random_uuid()"),
    )
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # Scaffold: store enum-like fields as TEXT (migrations will create real ENUMs later).
    role: Mapped[str] = mapped_column(String(50), nullable=False)
    discipline: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    created_by: Mapped[Optional[UUID]] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    # fastapi-users fields
    is_superuser: Mapped[bool] = mapped_column(Boolean, server_default=text("false"), nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, server_default=text("false"), nullable=False)

