import pytest
from httpx import AsyncClient
from uuid import uuid4
from app.db.models.enums import RoleEnum
from app.core.security import create_jwt
from app.db.models.core import AuditLog, SystemSettings
from sqlalchemy import select

@pytest.mark.asyncio
async def test_audit_logging_flow(client: AsyncClient, db):
    # 1. Create a super_admin user for authentication
    from app.db.models import User
    admin_user = User(
        id=uuid4(),
        email=f"admin_{uuid4()}@example.com",
        role=RoleEnum.super_admin.value,
        is_active=True,
        hashed_password="...",
    )
    db.add(admin_user)
    await db.commit()
    
    token, _ = create_jwt("access", user_id=admin_user.id, role=admin_user.role, discipline=None)
    headers = {"Authorization": f"Bearer {token}"}
    
    # 2. Perform an action that should be audited (e.g., Update System Setting)
    setting_payload = {"setting_value": {"maintenance_mode": True}}
    resp = await client.put("/api/v1/admin/settings/maintenance_mode", json=setting_payload, headers=headers)
    assert resp.status_code == 200
    
    # 3. Verify audit log exists via Service/DB
    stmt = select(AuditLog).where(AuditLog.action == "UPDATE_SETTING")
    result = await db.execute(stmt)
    log = result.scalars().first()
    assert log is not None
    assert log.created_by == admin_user.id
    assert log.entity_type == "system_setting"
    
    # 4. Verify audit log retrieval via API with filtering
    # Check that we can find it by action
    resp = await client.get("/api/v1/admin/audit-logs?action=UPDATE_SETTING", headers=headers)
    assert resp.status_code == 200
    logs = resp.json()["data"]
    assert len(logs) >= 1
    assert logs[0]["action"] == "UPDATE_SETTING"
    
    # 5. Verify date filtering
    from datetime import datetime, timedelta
    tomorrow = (datetime.utcnow() + timedelta(days=1)).isoformat()
    yesterday = (datetime.utcnow() - timedelta(days=1)).isoformat()
    
    # Filtering for tomorrow should yield nothing
    resp = await client.get(f"/api/v1/admin/audit-logs?date_from={tomorrow}", headers=headers)
    assert resp.status_code == 200
    assert len(resp.json()["data"]) == 0
    
    # Filtering for yesterday to tomorrow should yield our log
    resp = await client.get(f"/api/v1/admin/audit-logs?date_from={yesterday}&date_to={tomorrow}", headers=headers)
    assert resp.status_code == 200
    assert len(resp.json()["data"]) >= 1
