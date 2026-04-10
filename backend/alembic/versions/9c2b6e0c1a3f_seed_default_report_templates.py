"""seed default report templates

Revision ID: 9c2b6e0c1a3f
Revises: 70f6fae95c49
Create Date: 2026-04-10 00:00:00.000000
"""

from __future__ import annotations

import json

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "9c2b6e0c1a3f"
down_revision = "70f6fae95c49"
branch_labels = None
depends_on = None


TEMPLATES: list[tuple[str, dict]] = [
    (
        "Teaching Hours Summary",
        {
            "report_type": "teaching_hours_summary",
            "default_params": {"window_days": 30, "status": "approved"},
        },
    ),
    (
        "Billing Export",
        {
            "report_type": "billing_export",
            "default_params": {"window_days": 30, "status": "approved"},
        },
    ),
    (
        "Survey Analytics Summary",
        {
            "report_type": "survey_analytics",
            "default_params": {"window_days": 30},
        },
    ),
]


def upgrade() -> None:
    for name, cfg in TEMPLATES:
        op.execute(
            sa.text(
                """
                INSERT INTO report_definitions (name, config, status)
                VALUES (:name, (:config)::jsonb, 'active')
                ON CONFLICT (name) DO NOTHING
                """
            ).bindparams(name=name, config=json.dumps(cfg))
        )


def downgrade() -> None:
    op.execute(
        sa.text(
            """
            DELETE FROM report_definitions
            WHERE name = ANY(:names)
            """
        ).bindparams(names=[name for name, _ in TEMPLATES])
    )

