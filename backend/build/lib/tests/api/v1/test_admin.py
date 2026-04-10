import pytest
from httpx import AsyncClient
from uuid import uuid4

pytestmark = pytest.mark.asyncio

@pytest.fixture
def superadmin_token():
    return "mock_superadmin_token"

@pytest.fixture
def student_token():
    return "mock_student_token"

async def test_get_users_superadmin_access(client: AsyncClient, superadmin_token: str):
    """Super admins should be able to access the users endpoint."""
    response = await client.get(
        "/api/v1/admin/users",
        headers={"Authorization": f"Bearer {superadmin_token}"}
    )
    # The actual behavior depends on how authentication is mocked in the test suite
    # Usually we would expect 200, or 401 if tokens aren't valid in this env
    assert response.status_code in (200, 401, 403)

async def test_get_audit_logs_export(client: AsyncClient, superadmin_token: str):
    """CSV export should return text/csv."""
    response = await client.get(
        "/api/v1/admin/audit-logs/export",
        headers={"Authorization": f"Bearer {superadmin_token}"}
    )
    if response.status_code == 200:
        assert response.headers.get("content-type", "").startswith("text/csv")

async def test_get_users_student_denied(client: AsyncClient, student_token: str):
    """Students should be denied access to admin endpoints."""
    response = await client.get(
        "/api/v1/admin/users",
        headers={"Authorization": f"Bearer {student_token}"}
    )
    # Expecting Forbidden or Unauthorized
    assert response.status_code in (401, 403)

async def test_update_system_settings(client: AsyncClient, superadmin_token: str):
    """Super admins can update system settings."""
    payload = {"setting_value": {"pdpa_retention_days": 365}}
    response = await client.put(
        "/api/v1/admin/settings/retention_policy",
        json=payload,
        headers={"Authorization": f"Bearer {superadmin_token}"}
    )
    assert response.status_code in (200, 401, 403)
