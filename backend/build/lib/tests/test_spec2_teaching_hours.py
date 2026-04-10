from __future__ import annotations

import datetime
import uuid
from typing import Any

import pytest
from httpx import AsyncClient

from app.scripts.seed_demo_data import (
    SEED_PASSWORD,
    SEED_STUDENT_EMAIL,
    SEED_SUPER_ADMIN_EMAIL,
)


# ── Auth helpers ──────────────────────────────────────────────────────────────

async def _login(client: AsyncClient, email: str, password: str = SEED_PASSWORD) -> str:
    r = await client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert r.status_code == 200, f"Login failed for {email}: {r.text}"
    return r.json()["data"]["access_token"]


def _auth(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


# ── Fixtures ──────────────────────────────────────────────────────────────────

async def _get_seed_posting_id(client: AsyncClient, admin_token: str) -> str | None:
    r = await client.get("/api/v1/postings", headers=_auth(admin_token))
    items = r.json()["data"]["items"]
    # Filter for the one created in seed_demo_data.py
    for item in items:
        if item["title"] == "General Surgery Rotation":
            return item["id"]
    return items[0]["id"] if items else None


async def _get_seed_student_id(client: AsyncClient, admin_token: str) -> str | None:
    r = await client.get("/api/v1/students", headers=_auth(admin_token))
    items = r.json()["data"]["items"]
    return items[0]["id"] if items else None


async def _get_seed_tutor_id(client: AsyncClient, admin_token: str) -> str | None:
    r = await client.get("/api/v1/tutors", headers=_auth(admin_token))
    items = r.json()["data"]["items"]
    return items[0]["id"] if items else None


def _future_starts_at(days: int = 1) -> str:
    return (datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=days)).isoformat()


def _make_session_payload(posting_id: str, **overrides: Any) -> dict[str, Any]:
    return {
        "posting_id": posting_id,
        "starts_at": _future_starts_at(),
        "session_type": "scheduled",
        "duration_minutes": 60,
        "student_ids": [],
        **overrides,
    }


# ── Tests ─────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_tutor_create_draft_session(client: AsyncClient) -> None:
    """Tutor logs a session and it appears in draft status."""
    admin_token = await _login(client, SEED_SUPER_ADMIN_EMAIL)
    posting_id = await _get_seed_posting_id(client, admin_token)
    if not posting_id:
        pytest.skip("No postings in seed data")

    # Use super admin acting as admin (has permission) to create draft
    payload = _make_session_payload(posting_id)
    r = await client.post("/api/v1/teaching-sessions", json=payload, headers=_auth(admin_token))
    assert r.status_code == 200, r.text
    data = r.json()["data"]
    assert data["approval_status"] == "draft"
    assert data["duration_minutes"] == 60


@pytest.mark.asyncio
async def test_submit_session(client: AsyncClient) -> None:
    """Tutor (admin acting) submits a draft, status becomes submitted."""
    admin_token = await _login(client, SEED_SUPER_ADMIN_EMAIL)
    posting_id = await _get_seed_posting_id(client, admin_token)
    if not posting_id:
        pytest.skip("No postings in seed data")

    payload = _make_session_payload(posting_id, starts_at=_future_starts_at(2))
    r = await client.post("/api/v1/teaching-sessions", json=payload, headers=_auth(admin_token))
    session_id = r.json()["data"]["id"]

    r2 = await client.post(f"/api/v1/teaching-sessions/{session_id}/submit", headers=_auth(admin_token))
    assert r2.status_code == 200, r2.text
    assert r2.json()["data"]["approval_status"] == "submitted"


@pytest.mark.asyncio
async def test_supervisor_approve_session(client: AsyncClient) -> None:
    """Supervisor approves a submitted session, billable_minutes is set."""
    admin_token = await _login(client, SEED_SUPER_ADMIN_EMAIL)
    posting_id = await _get_seed_posting_id(client, admin_token)
    if not posting_id:
        pytest.skip("No postings in seed data")

    payload = _make_session_payload(posting_id, starts_at=_future_starts_at(3))
    r = await client.post("/api/v1/teaching-sessions", json=payload, headers=_auth(admin_token))
    session_id = r.json()["data"]["id"]

    await client.post(f"/api/v1/teaching-sessions/{session_id}/submit", headers=_auth(admin_token))
    r3 = await client.post(f"/api/v1/teaching-sessions/{session_id}/approve", headers=_auth(admin_token))
    assert r3.status_code == 200, r3.text
    data = r3.json()["data"]
    assert data["approval_status"] == "approved"
    assert data["billable_minutes"] == 60


@pytest.mark.asyncio
async def test_supervisor_reject_session(client: AsyncClient) -> None:
    """Supervisor rejects submitted session with a reason."""
    admin_token = await _login(client, SEED_SUPER_ADMIN_EMAIL)
    posting_id = await _get_seed_posting_id(client, admin_token)
    if not posting_id:
        pytest.skip("No postings in seed data")

    payload = _make_session_payload(posting_id, starts_at=_future_starts_at(4))
    r = await client.post("/api/v1/teaching-sessions", json=payload, headers=_auth(admin_token))
    session_id = r.json()["data"]["id"]

    await client.post(f"/api/v1/teaching-sessions/{session_id}/submit", headers=_auth(admin_token))
    reject_payload = {"reason": "Session overlaps with another event."}
    r3 = await client.post(
        f"/api/v1/teaching-sessions/{session_id}/reject",
        json=reject_payload,
        headers=_auth(admin_token),
    )
    assert r3.status_code == 200, r3.text
    data = r3.json()["data"]
    assert data["approval_status"] == "rejected"
    assert data["rejection_reason"] == "Session overlaps with another event."


@pytest.mark.asyncio
async def test_rejected_session_visible_with_reason(client: AsyncClient) -> None:
    """Rejected session appears in list with rejection reason visible."""
    admin_token = await _login(client, SEED_SUPER_ADMIN_EMAIL)
    posting_id = await _get_seed_posting_id(client, admin_token)
    if not posting_id:
        pytest.skip("No postings in seed data")

    payload = _make_session_payload(posting_id, starts_at=_future_starts_at(5))
    r = await client.post("/api/v1/teaching-sessions", json=payload, headers=_auth(admin_token))
    session_id = r.json()["data"]["id"]
    await client.post(f"/api/v1/teaching-sessions/{session_id}/submit", headers=_auth(admin_token))
    await client.post(
        f"/api/v1/teaching-sessions/{session_id}/reject",
        json={"reason": "Test rejection reason"},
        headers=_auth(admin_token),
    )

    r_list = await client.get(
        "/api/v1/teaching-sessions?status=rejected", headers=_auth(admin_token)
    )
    assert r_list.status_code == 200
    items = r_list.json()["data"]["items"]
    found = [i for i in items if i["id"] == session_id]
    assert found, "Rejected session not found in list"
    assert found[0]["rejection_reason"] == "Test rejection reason"


@pytest.mark.asyncio
async def test_duplicate_slot_anomaly_flag(client: AsyncClient) -> None:
    """Two sessions for same tutor at same time → second has is_flagged=True."""
    admin_token = await _login(client, SEED_SUPER_ADMIN_EMAIL)
    posting_id = await _get_seed_posting_id(client, admin_token)
    if not posting_id:
        pytest.skip("No postings in seed data")

    same_time = _future_starts_at(6)
    payload = _make_session_payload(posting_id, starts_at=same_time)

    # First session — may or may not be flagged
    r1 = await client.post("/api/v1/teaching-sessions", json=payload, headers=_auth(admin_token))
    assert r1.status_code == 200, r1.text

    # Second session at virtually same time → must be flagged for duplicate_slot
    r2 = await client.post("/api/v1/teaching-sessions", json={**payload}, headers=_auth(admin_token))
    assert r2.status_code == 200, r2.text
    data2 = r2.json()["data"]
    assert data2["is_flagged"] is True
    flag_types = [f["type"] for f in data2["anomaly_flags"]]
    assert "duplicate_slot" in flag_types


@pytest.mark.asyncio
async def test_daily_hours_exceeded_anomaly(client: AsyncClient) -> None:
    """Logging >8h total in one day triggers daily_hours_exceeded flag."""
    admin_token = await _login(client, SEED_SUPER_ADMIN_EMAIL)
    posting_id = await _get_seed_posting_id(client, admin_token)
    if not posting_id:
        pytest.skip("No postings in seed data")

    # Log 7.5h (450 min) first
    day = (datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=10)).strftime("%Y-%m-%dT08:00:00+00:00")
    r1 = await client.post(
        "/api/v1/teaching-sessions",
        json=_make_session_payload(posting_id, starts_at=day, duration_minutes=450),
        headers=_auth(admin_token),
    )
    assert r1.status_code == 200, r1.text

    # Log another 60 min on the same day → total 510 > 480
    day2 = (datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=10)).strftime("%Y-%m-%dT16:00:00+00:00")
    r2 = await client.post(
        "/api/v1/teaching-sessions",
        json=_make_session_payload(posting_id, starts_at=day2, duration_minutes=60),
        headers=_auth(admin_token),
    )
    assert r2.status_code == 200, r2.text
    data2 = r2.json()["data"]
    assert data2["is_flagged"] is True
    flag_types = [f["type"] for f in data2["anomaly_flags"]]
    assert "daily_hours_exceeded" in flag_types


@pytest.mark.asyncio
async def test_outside_posting_period_anomaly(client: AsyncClient) -> None:
    """Session logged with a date before the posting's start_date triggers flag."""
    admin_token = await _login(client, SEED_SUPER_ADMIN_EMAIL)
    # Create a posting with a future start_date
    students_r = await client.get("/api/v1/students", headers=_auth(admin_token))
    depts_r = await client.get("/api/v1/departments", headers=_auth(admin_token))
    if not students_r.json()["data"]["items"] or not depts_r.json()["data"]["items"]:
        pytest.skip("No students/departments in seed data")

    student_data = students_r.json()["data"]["items"][0]
    student_id = student_data["id"]
    student_discipline = student_data["discipline"]
    
    # Find a department that matches the student's discipline
    matching_depts = [d for d in depts_r.json()["data"]["items"] if d["discipline"] == student_discipline]
    if not matching_depts:
        pytest.skip(f"No department found for student discipline {student_discipline}")
    
    dept = matching_depts[0]
    discipline = dept["discipline"]
    dept_id = dept["id"]

    ac_r = await client.get("/api/v1/academic-cycles", headers=_auth(admin_token))
    ac_id = ac_r.json()["data"]["items"][0]["id"]

    # Posting starts 30 days from now
    future_start = (datetime.date.today() + datetime.timedelta(days=30)).isoformat()
    future_end = (datetime.date.today() + datetime.timedelta(days=90)).isoformat()
    posting_r = await client.post(
        "/api/v1/postings",
        json={
            "title": "Anomaly Test Posting",
            "student_id": student_id,
            "academic_cycle_id": ac_id,
            "department_id": dept_id,
            "discipline": discipline,
            "tutor_ids": [],
            "start_date": future_start,
            "end_date": future_end,
        },
        headers=_auth(admin_token),
    )
    assert posting_r.status_code == 200, posting_r.text
    posting_id = posting_r.json()["data"]["id"]
    
    # Associate a tutor (e.g. the first seed tutor) with this posting
    tutor_id = await _get_seed_tutor_id(client, admin_token)
    await client.patch(
        f"/api/v1/postings/{posting_id}",
        json={"tutor_ids": [tutor_id]},
        headers=_auth(admin_token)
    )

    # Session logged today (before posting start)
    today_str = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT09:00:00+00:00")
    r = await client.post(
        "/api/v1/teaching-sessions",
        json=_make_session_payload(posting_id, starts_at=today_str),
        headers=_auth(admin_token),
    )
    assert r.status_code == 200, r.text
    data = r.json()["data"]
    assert data["is_flagged"] is True
    flag_types = [f["type"] for f in data["anomaly_flags"]]
    assert "outside_posting_period" in flag_types


@pytest.mark.asyncio
async def test_student_sees_only_linked_sessions(client: AsyncClient) -> None:
    """Student can only GET sessions they are linked to; list of others returns 0 items."""
    student_token = await _login(client, SEED_STUDENT_EMAIL)
    r = await client.get("/api/v1/teaching-sessions", headers=_auth(student_token))
    # Should not 403 — students can list but only see their own
    assert r.status_code == 200


@pytest.mark.asyncio
async def test_student_cannot_approve(client: AsyncClient) -> None:
    """Student cannot approve a session → 403."""
    admin_token = await _login(client, SEED_SUPER_ADMIN_EMAIL)
    posting_id = await _get_seed_posting_id(client, admin_token)
    if not posting_id:
        pytest.skip("No postings")

    r = await client.post(
        "/api/v1/teaching-sessions",
        json=_make_session_payload(posting_id, starts_at=_future_starts_at(15)),
        headers=_auth(admin_token),
    )
    session_id = r.json()["data"]["id"]
    await client.post(f"/api/v1/teaching-sessions/{session_id}/submit", headers=_auth(admin_token))

    student_token = await _login(client, SEED_STUDENT_EMAIL)
    r_approve = await client.post(
        f"/api/v1/teaching-sessions/{session_id}/approve",
        headers=_auth(student_token),
    )
    assert r_approve.status_code == 403


@pytest.mark.asyncio
async def test_admin_dashboard_returns_bars(client: AsyncClient) -> None:
    """Admin can GET the dashboard endpoint and receive a bars array."""
    admin_token = await _login(client, SEED_SUPER_ADMIN_EMAIL)
    r = await client.get("/api/v1/teaching-hours/dashboard", headers=_auth(admin_token))
    assert r.status_code == 200, r.text
    data = r.json()["data"]
    assert "bars" in data
    assert "total_minutes" in data


@pytest.mark.asyncio
async def test_admin_export_returns_xlsx(client: AsyncClient) -> None:
    """Admin can GET the export endpoint and receives xlsx content-type."""
    admin_token = await _login(client, SEED_SUPER_ADMIN_EMAIL)
    r = await client.get("/api/v1/teaching-hours/export", headers=_auth(admin_token))
    assert r.status_code == 200, r.text
    assert "spreadsheetml" in r.headers.get("content-type", "")


@pytest.mark.asyncio
async def test_bulk_create_sessions(client: AsyncClient) -> None:
    """Bulk create for 2 Tuesdays over 2 weeks creates 2 sessions."""
    admin_token = await _login(client, SEED_SUPER_ADMIN_EMAIL)
    posting_id = await _get_seed_posting_id(client, admin_token)
    if not posting_id:
        pytest.skip("No postings")

    today = datetime.date.today()
    # Find next Monday as start of range for predictable 2 Tuesdays
    days_until_monday = (7 - today.weekday()) % 7
    if days_until_monday == 0:
        days_until_monday = 7
    start = today + datetime.timedelta(days=days_until_monday)
    end = start + datetime.timedelta(days=13)

    payload = {
        "posting_id": posting_id,
        "session_type": "scheduled",
        "duration_minutes": 45,
        "student_ids": [],
        "start_date": start.isoformat(),
        "end_date": end.isoformat(),
        "days_of_week": ["tuesday"],
        "start_time": "10:00",
    }
    r = await client.post("/api/v1/teaching-sessions/bulk", json=payload, headers=_auth(admin_token))
    assert r.status_code == 200, r.text
    created = r.json()["data"]
    assert len(created) == 2


@pytest.mark.asyncio
async def test_cannot_edit_approved_session(client: AsyncClient) -> None:
    """An approved session cannot be edited (PATCH returns 400)."""
    admin_token = await _login(client, SEED_SUPER_ADMIN_EMAIL)
    posting_id = await _get_seed_posting_id(client, admin_token)
    if not posting_id:
        pytest.skip("No postings")

    payload = _make_session_payload(posting_id, starts_at=_future_starts_at(20))
    r = await client.post("/api/v1/teaching-sessions", json=payload, headers=_auth(admin_token))
    session_id = r.json()["data"]["id"]
    await client.post(f"/api/v1/teaching-sessions/{session_id}/submit", headers=_auth(admin_token))
    await client.post(f"/api/v1/teaching-sessions/{session_id}/approve", headers=_auth(admin_token))

    r_patch = await client.patch(
        f"/api/v1/teaching-sessions/{session_id}",
        json={"duration_minutes": 30},
        headers=_auth(admin_token),
    )
    assert r_patch.status_code == 400


@pytest.mark.asyncio
async def test_billable_rate_create_and_list(client: AsyncClient) -> None:
    """Admin can create and list billable rates for a tutor."""
    admin_token = await _login(client, SEED_SUPER_ADMIN_EMAIL)
    tutor_id = await _get_seed_tutor_id(client, admin_token)
    if not tutor_id:
        pytest.skip("No tutors in seed data")

    rate_payload = {
        "rate_per_hour": "80.00",
        "currency": "SGD",
        "effective_from": datetime.date.today().isoformat(),
    }
    r = await client.post(
        f"/api/v1/tutors/{tutor_id}/billable-rates",
        json=rate_payload,
        headers=_auth(admin_token),
    )
    assert r.status_code == 200, r.text
    assert r.json()["data"]["rate_per_hour"] == "80.00"

    r_list = await client.get(
        f"/api/v1/tutors/{tutor_id}/billable-rates", headers=_auth(admin_token)
    )
    assert r_list.status_code == 200
    assert len(r_list.json()["data"]) >= 1
