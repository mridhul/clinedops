import asyncio
import httpx
import pytest
from uuid import UUID

BASE_URL = "http://localhost:8000/api/v1"
PASSWORD = "ClinEdOps2024!"

PERSONAS = {
    "super_admin": "superadmin@nuhs.edu.sg",
    "programme_admin_med": "admin.medicine@nuhs.edu.sg",
    "supervisor_med": "supervisor.medicine@nuhs.edu.sg",
    "tutor_med": "tutor.medicine.0@nuhs.edu.sg",
    "student_med": "student.0@nus.edu.sg",
}

async def get_token(email: str):
    async with httpx.AsyncClient() as client:
        resp = await client.post(f"{BASE_URL}/auth/login", json={"email": email, "password": PASSWORD})
        if resp.status_code != 200:
            print(f"Login failed for {email}: {resp.text}")
            return None
        return resp.json()["data"]["access_token"]

@pytest.mark.asyncio
async def test_rbac_matrix():
    tokens = {}
    for name, email in PERSONAS.items():
        token = await get_token(email)
        if token:
            tokens[name] = token
    
    # Test Matrix: (Persona, Endpoint, Expected Status)
    test_cases = [
        # Admin Console
        ("super_admin", "/admin/users", 200),
        ("programme_admin_med", "/admin/users", 403),
        ("supervisor_med", "/admin/users", 403),
        ("tutor_med", "/admin/users", 403),
        
        # Student Management (List)
        ("super_admin", "/students", 200),
        ("programme_admin_med", "/students?discipline=medicine", 200),
        ("supervisor_med", "/students?discipline=medicine", 200),
        ("tutor_med", "/students", 403),
        
        # Discipline Scoping
        ("programme_admin_med", "/students?discipline=nursing", 403),
        
        # Analytics
        ("super_admin", "/analytics/dashboard", 200),
        ("programme_admin_med", "/analytics/dashboard", 200),
        ("supervisor_med", "/analytics/dashboard", 200),
        ("tutor_med", "/analytics/dashboard", 200),
        
        # Notifications
        ("student_med", "/notifications/unread-count", 200),
        
        # RBAC Settings
        ("super_admin", "/admin/rbac", 200),
        ("programme_admin_med", "/admin/rbac", 403),
    ]

    results = []
    async with httpx.AsyncClient() as client:
        for persona, endpoint, expected in test_cases:
            if persona not in tokens:
                results.append(f"[SKIP] {persona} -> {endpoint} (No token)")
                continue
                
            headers = {"Authorization": f"Bearer {tokens[persona]}"}
            resp = await client.get(f"{BASE_URL}{endpoint}", headers=headers)
            
            status = resp.status_code
            if status == expected:
                results.append(f"[PASS] {persona} -> {endpoint} (Expected {expected}, got {status})")
            else:
                results.append(f"[FAIL] {persona} -> {endpoint} (Expected {expected}, got {status})")
                print(f"FAIL Detail: {resp.text}")

    print("\n" + "="*50)
    print("RBAC TEST RESULTS")
    print("="*50)
    for r in results:
        print(r)
    print("="*50)

if __name__ == "__main__":
    asyncio.run(test_rbac_matrix())
