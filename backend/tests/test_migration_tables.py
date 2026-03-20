from __future__ import annotations

import os

import pytest
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine


CORE_TABLES = [
    "users",
    "students",
    "tutors",
    "postings",
    "posting_tutors",
    "teaching_sessions",
    "session_students",
    "survey_templates",
    "survey_submissions",
    "audit_logs",
    "academic_cycles",
    "departments",
    "notifications",
    "import_batches",
    "report_definitions",
]


@pytest.mark.asyncio
async def test_all_core_tables_created() -> None:
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        pytest.skip("DATABASE_URL not set")

    engine = create_async_engine(database_url)
    async with engine.connect() as conn:
        res = await conn.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema='public'"))
        table_names = {row[0] for row in res.fetchall()}

    missing = [t for t in CORE_TABLES if t not in table_names]
    assert not missing, f"Missing tables: {missing}"

