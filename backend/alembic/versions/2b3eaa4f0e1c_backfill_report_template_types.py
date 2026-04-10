"""backfill report template types

Revision ID: 2b3eaa4f0e1c
Revises: 9c2b6e0c1a3f
Create Date: 2026-04-10 00:00:00.000000
"""

from __future__ import annotations

import json

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "2b3eaa4f0e1c"
down_revision = "9c2b6e0c1a3f"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Ensure existing templates (like Faculty Appraisal) have a report_type so generation is not "Unknown report type".
    # We only update rows where config is empty or missing report_type.
    op.execute(
        sa.text(
            """
            UPDATE report_definitions
            SET config = jsonb_set(
              COALESCE(config, '{}'::jsonb),
              '{report_type}',
              to_jsonb('survey_analytics'::text),
              true
            )
            WHERE status = 'active'
              AND lower(name) IN ('faculty appraisal')
              AND (
                config IS NULL
                OR config = '{}'::jsonb
                OR (config ? 'report_type') = false
              )
            """
        )
    )


def downgrade() -> None:
    # Best-effort revert: remove report_type key for the same template name.
    op.execute(
        sa.text(
            """
            UPDATE report_definitions
            SET config = (COALESCE(config, '{}'::jsonb) - 'report_type')
            WHERE lower(name) IN ('faculty appraisal')
            """
        )
    )

