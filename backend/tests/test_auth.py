from __future__ import annotations

import pytest
from httpx import AsyncClient

from app.scripts.seed_demo_data import SEED_PASSWORD, SEED_STUDENT_EMAIL, SEED_SUPER_ADMIN_EMAIL


@pytest.mark.asyncio
async def test_me_requires_auth(client: AsyncClient) -> None:
    resp = await client.get("/api/v1/auth/me")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_login_and_me(client: AsyncClient) -> None:
    login_resp = await client.post(
        "/api/v1/auth/login",
        json={"email": SEED_SUPER_ADMIN_EMAIL, "password": SEED_PASSWORD},
    )
    assert login_resp.status_code == 200

    body = login_resp.json()
    assert body["data"]["access_token"]
    assert body["data"]["role"] == "super_admin"

    access_token: str = body["data"]["access_token"]

    me_resp = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {access_token}"},
    )
    assert me_resp.status_code == 200
    assert me_resp.json()["data"]["role"] == "super_admin"


@pytest.mark.asyncio
async def test_refresh_and_logout(client: AsyncClient) -> None:
    login_resp = await client.post(
        "/api/v1/auth/login",
        json={"email": SEED_SUPER_ADMIN_EMAIL, "password": SEED_PASSWORD},
    )
    assert login_resp.status_code == 200

    body = login_resp.json()
    access_token: str = body["data"]["access_token"]

    # Cookie is set during login; httpx client jar should persist it.
    refresh_resp = await client.post("/api/v1/auth/refresh")
    assert refresh_resp.status_code == 200
    assert refresh_resp.json()["data"]["access_token"]

    logout_resp = await client.post(
        "/api/v1/auth/logout",
        headers={"Authorization": f"Bearer {access_token}"},
    )
    assert logout_resp.status_code == 200


@pytest.mark.asyncio
async def test_forgot_and_reset_password_flow(client: AsyncClient) -> None:
    forgot_resp = await client.post(
        "/api/v1/auth/forgot-password",
        json={"email": SEED_STUDENT_EMAIL},
    )
    assert forgot_resp.status_code == 200
    forgot_body = forgot_resp.json()
    reset_token = forgot_body["data"]["reset_token"]
    assert reset_token

    new_password = "NewDemoPassword1!"
    reset_resp = await client.post(
        "/api/v1/auth/reset-password",
        json={"token": reset_token, "new_password": new_password},
    )
    assert reset_resp.status_code == 200

    # Login should succeed with the new password.
    login_resp = await client.post(
        "/api/v1/auth/login",
        json={"email": SEED_STUDENT_EMAIL, "password": new_password},
    )
    assert login_resp.status_code == 200
    assert login_resp.json()["data"]["role"] == "student"

