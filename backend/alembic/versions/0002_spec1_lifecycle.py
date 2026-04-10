from __future__ import annotations

import sqlalchemy as sa
from alembic import op


revision = "0002_spec1"
down_revision = "0001_initial"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("students", sa.Column("student_code", sa.String(length=64), nullable=True))
    op.add_column("students", sa.Column("institution", sa.String(length=255), nullable=True))
    op.add_column(
        "students",
        sa.Column(
            "lifecycle_status",
            sa.String(length=50),
            nullable=False,
            server_default=sa.text("'pending_onboarding'"),
        ),
    )

    op.execute(
        """
        UPDATE students
        SET student_code = 'STU-' || substr(replace(id::text, '-', ''), 1, 12)
        WHERE student_code IS NULL;
        """
    )
    op.alter_column("students", "student_code", nullable=False)
    op.create_index("ix_students_discipline_lifecycle", "students", ["discipline", "lifecycle_status"])
    op.create_index("ix_students_academic_cycle_id", "students", ["academic_cycle_id"])
    op.create_unique_constraint("uq_students_student_code", "students", ["student_code"])

    op.add_column(
        "tutors",
        sa.Column("tutor_code", sa.String(length=64), nullable=True),
    )
    op.execute(
        """
        UPDATE tutors
        SET tutor_code = 'TUT-' || substr(replace(id::text, '-', ''), 1, 12)
        WHERE tutor_code IS NULL;
        """
    )
    op.alter_column("tutors", "tutor_code", nullable=False)
    op.create_unique_constraint("uq_tutors_tutor_code", "tutors", ["tutor_code"])

    op.add_column(
        "departments",
        sa.Column(
            "head_user_id",
            sa.dialects.postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
    )

    op.add_column(
        "academic_cycles",
        sa.Column("is_current", sa.Boolean(), nullable=False, server_default=sa.text("false")),
    )
    op.execute(
        """
        UPDATE academic_cycles
        SET is_current = true
        WHERE id = (SELECT id FROM academic_cycles ORDER BY created_at ASC LIMIT 1)
        AND NOT EXISTS (SELECT 1 FROM academic_cycles WHERE is_current = true);
        """
    )
    op.create_index(
        "uq_academic_cycles_one_current",
        "academic_cycles",
        ["is_current"],
        unique=True,
        postgresql_where=sa.text("is_current = true"),
    )

    op.add_column(
        "postings",
        sa.Column(
            "student_id",
            sa.dialects.postgresql.UUID(as_uuid=True),
            sa.ForeignKey("students.id", ondelete="CASCADE"),
            nullable=True,
        ),
    )
    op.execute(
        """
        UPDATE postings p
        SET student_id = (SELECT s.id FROM students s ORDER BY s.created_at ASC LIMIT 1)
        WHERE p.student_id IS NULL
        AND EXISTS (SELECT 1 FROM students LIMIT 1);
        """
    )
    op.execute("DELETE FROM postings WHERE student_id IS NULL;")
    op.alter_column("postings", "student_id", nullable=False)
    op.create_index("ix_postings_student_id", "postings", ["student_id"])
    op.create_index("ix_postings_dept_dates", "postings", ["department_id", "start_date", "end_date"])


def downgrade() -> None:
    op.drop_index("ix_postings_dept_dates", table_name="postings")
    op.drop_index("ix_postings_student_id", table_name="postings")
    op.drop_column("postings", "student_id")

    op.drop_index("uq_academic_cycles_one_current", table_name="academic_cycles")
    op.drop_column("academic_cycles", "is_current")

    op.drop_column("departments", "head_user_id")

    op.drop_constraint("uq_tutors_tutor_code", "tutors", type_="unique")
    op.drop_column("tutors", "tutor_code")

    op.drop_constraint("uq_students_student_code", "students", type_="unique")
    op.drop_index("ix_students_academic_cycle_id", table_name="students")
    op.drop_index("ix_students_discipline_lifecycle", table_name="students")
    op.drop_column("students", "lifecycle_status")
    op.drop_column("students", "institution")
    op.drop_column("students", "student_code")
