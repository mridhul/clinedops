from __future__ import annotations

import io
import uuid

import pytest
from httpx import AsyncClient

from app.scripts.seed_demo_data import SEED_PASSWORD, SEED_STUDENT_EMAIL, SEED_SUPER_ADMIN_EMAIL


async def _login(client: AsyncClient, email: str, password: str = SEED_PASSWORD) -> str:
    r = await client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert r.status_code == 200, r.text
    return r.json()["data"]["access_token"]


@pytest.mark.asyncio
async def test_list_students_super_admin(client: AsyncClient) -> None:
    token = await _login(client, SEED_SUPER_ADMIN_EMAIL)
    r = await client.get("/api/v1/students", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    data = r.json()["data"]
    assert "items" in data
    assert len(data["items"]) >= 1


@pytest.mark.asyncio
async def test_programme_admin_medicine_cannot_see_allied_student_in_list(client: AsyncClient) -> None:
    token = await _login(client, "programme_admin_medicine@example.com")
    r = await client.get("/api/v1/students", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    disciplines = {row["discipline"] for row in r.json()["data"]["items"]}
    assert "allied_health" not in disciplines


@pytest.mark.asyncio
async def test_student_cannot_list_all_students(client: AsyncClient) -> None:
    token = await _login(client, SEED_STUDENT_EMAIL)
    r = await client.get("/api/v1/students", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 403


@pytest.mark.asyncio
async def test_student_postings_only_own(client: AsyncClient) -> None:
    token = await _login(client, SEED_STUDENT_EMAIL)
    r = await client.get("/api/v1/postings", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    assert r.json()["data"]["items"] == []


@pytest.mark.asyncio
async def test_create_student(client: AsyncClient) -> None:
    token = await _login(client, SEED_SUPER_ADMIN_EMAIL)
    suffix = uuid.uuid4().hex[:8]
    payload = {
        "email": f"newstudent_{suffix}@example.com",
        "password": "DemoPassword1!",
        "student_code": f"STU-SPEC1-{suffix}",
        "discipline": "medicine",
        "lifecycle_status": "pending_onboarding",
    }
    r = await client.post("/api/v1/students", json=payload, headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200, r.text
    assert r.json()["data"]["student_code"] == f"STU-SPEC1-{suffix}"


@pytest.mark.asyncio
async def test_student_batch_dry_run_duplicate_in_file(client: AsyncClient) -> None:
    token = await _login(client, SEED_SUPER_ADMIN_EMAIL)
    csv_content = "email,student_code,discipline\na1@example.com,DUP1,medicine\na2@example.com,DUP1,medicine\n"
    files = {"file": ("t.csv", io.BytesIO(csv_content.encode("utf-8")), "text/csv")}
    data = {
        "mapping": '{"email":"email","student_code":"student_code","discipline":"discipline"}',
        "dry_run": "true",
        "default_password": "DemoPassword1!",
    }
    r = await client.post(
        "/api/v1/students/batch",
        headers={"Authorization": f"Bearer {token}"},
        data=data,
        files=files,
    )
    assert r.status_code == 200, r.text
    rows = r.json()["data"]["rows"]
    assert any(not row["ok"] for row in rows)


@pytest.mark.asyncio
async def test_list_departments_super_admin(client: AsyncClient) -> None:
    token = await _login(client, SEED_SUPER_ADMIN_EMAIL)
    r = await client.get("/api/v1/departments", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    assert len(r.json()["data"]["items"]) >= 1


@pytest.mark.asyncio
async def test_list_academic_cycles(client: AsyncClient) -> None:
    token = await _login(client, SEED_SUPER_ADMIN_EMAIL)
    r = await client.get("/api/v1/academic-cycles", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
