
import pytest
import time
from httpx import AsyncClient

# Seeded credentials
ADMIN_EMAIL = "superadmin@nuhs.edu.sg"
PASSWORD = "ClinEdOps2024!"

@pytest.mark.asyncio
async def test_api_performance_p95(client: AsyncClient):
    """
    Verify that key API endpoints respond in < 500ms with seed data.
    """
    # 1. Login to get token
    login_resp = await client.post(
        "/api/v1/auth/login",
        json={"email": ADMIN_EMAIL, "password": PASSWORD},
    )
    assert login_resp.status_code == 200
    token = login_resp.json()["data"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    endpoints = [
        "/api/v1/students",
        "/api/v1/tutors",
        "/api/v1/postings",
        "/api/v1/teaching-sessions",
        "/api/v1/analytics/dashboard",
        "/api/v1/admin/audit-logs",
        "/api/v1/notifications/",  # This one needs trailing slash because of @router.get("/")
    ]

    threshold_ms = 500

    print("\n--- Performance Benchmarks ---")
    for endpoint in endpoints:
        start = time.perf_counter()
        # Use a fresh client for each to avoid any session side-effects, 
        # but follow_redirects is safer.
        resp = await client.get(endpoint, headers=headers, follow_redirects=True)
        elapsed_ms = (time.perf_counter() - start) * 1000
        
        print(f"Endpoint: {endpoint:40} | Status: {resp.status_code} | Elapsed: {elapsed_ms:8.2f}ms")
        
        assert resp.status_code == 200, f"Failed on {endpoint} with status {resp.status_code}"
        assert elapsed_ms < threshold_ms, f"Endpoint {endpoint} was too slow: {elapsed_ms:.2f}ms"

    print("--- End Benchmarks ---\n")
