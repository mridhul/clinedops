from __future__ import annotations

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from alembic import op


revision = "0003_spec2"
down_revision = "0002_spec1"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── teaching_sessions: add Spec 2 columns ────────────────────────────────
    op.add_column("teaching_sessions", sa.Column("session_type", sa.String(50), nullable=True))
    op.add_column("teaching_sessions", sa.Column("duration_minutes", sa.Integer(), nullable=True))
    op.add_column(
        "teaching_sessions",
        sa.Column(
            "department_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("departments.id", ondelete="SET NULL"),
            nullable=True,
        ),
    )
    op.add_column("teaching_sessions", sa.Column("discipline", sa.String(50), nullable=True))
    op.add_column("teaching_sessions", sa.Column("description", sa.Text(), nullable=True))
    op.add_column(
        "teaching_sessions",
        sa.Column(
            "approval_status",
            sa.String(50),
            nullable=False,
            server_default=sa.text("'draft'"),
        ),
    )
    op.add_column(
        "teaching_sessions",
        sa.Column("submitted_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "teaching_sessions",
        sa.Column("approved_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "teaching_sessions",
        sa.Column(
            "approved_by",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
    )
    op.add_column(
        "teaching_sessions",
        sa.Column("rejected_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "teaching_sessions",
        sa.Column(
            "rejected_by",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
    )
    op.add_column("teaching_sessions", sa.Column("rejection_reason", sa.Text(), nullable=True))
    op.add_column(
        "teaching_sessions",
        sa.Column(
            "anomaly_flags",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=True,
            server_default=sa.text("'[]'::jsonb"),
        ),
    )
    op.add_column(
        "teaching_sessions",
        sa.Column("is_flagged", sa.Boolean(), nullable=False, server_default=sa.text("false")),
    )
    op.add_column("teaching_sessions", sa.Column("billable_minutes", sa.Integer(), nullable=True))

    # Indexes for common query patterns
    op.create_index("ix_ts_tutor_approval", "teaching_sessions", ["tutor_id", "approval_status"])
    op.create_index("ix_ts_discipline_dept", "teaching_sessions", ["discipline", "department_id"])

    # ── session_students: add attendance confirmation ─────────────────────────
    op.add_column(
        "session_students",
        sa.Column("attendance_confirmed_at", sa.DateTime(timezone=True), nullable=True),
    )

    # ── tutor_billable_rates: new table ───────────────────────────────────────
    op.create_table(
        "tutor_billable_rates",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column("tutor_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("tutors.id", ondelete="CASCADE"), nullable=False),
        sa.Column("rate_per_hour", sa.Numeric(10, 2), nullable=False),
        sa.Column("currency", sa.String(3), nullable=False, server_default=sa.text("'SGD'")),
        sa.Column("effective_from", sa.Date(), nullable=False),
        sa.Column("effective_to", sa.Date(), nullable=True),
        sa.Column(
            "created_by",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
    )
    op.create_index("ix_tbr_tutor_id", "tutor_billable_rates", ["tutor_id"])


def downgrade() -> None:
    op.drop_index("ix_tbr_tutor_id", table_name="tutor_billable_rates")
    op.drop_table("tutor_billable_rates")

    op.drop_column("session_students", "attendance_confirmed_at")

    op.drop_index("ix_ts_discipline_dept", table_name="teaching_sessions")
    op.drop_index("ix_ts_tutor_approval", table_name="teaching_sessions")
    op.drop_column("teaching_sessions", "billable_minutes")
    op.drop_column("teaching_sessions", "is_flagged")
    op.drop_column("teaching_sessions", "anomaly_flags")
    op.drop_column("teaching_sessions", "rejection_reason")
    op.drop_column("teaching_sessions", "rejected_by")
    op.drop_column("teaching_sessions", "rejected_at")
    op.drop_column("teaching_sessions", "approved_by")
    op.drop_column("teaching_sessions", "approved_at")
    op.drop_column("teaching_sessions", "submitted_at")
    op.drop_column("teaching_sessions", "approval_status")
    op.drop_column("teaching_sessions", "description")
    op.drop_column("teaching_sessions", "discipline")
    op.drop_column("teaching_sessions", "department_id")
    op.drop_column("teaching_sessions", "duration_minutes")
    op.drop_column("teaching_sessions", "session_type")
