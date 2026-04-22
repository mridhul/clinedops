import pytest
from httpx import AsyncClient
from uuid import uuid4
from app.db.models.enums import RoleEnum
from app.core.security import create_jwt

@pytest.mark.asyncio
async def test_permission_enforcement(client: AsyncClient, db):
    # 1. Create a programme_admin user
    from app.db.models import User
    user = User(
        id=uuid4(),
        email=f"test_pa_{uuid4()}@example.com",
        role=RoleEnum.programme_admin.value,
        is_active=True,
        hashed_password="...",
    )
    db.add(user)
    await db.commit()
    
    token, _ = create_jwt("access", user_id=user.id, role=user.role, discipline=None)
    headers = {"Authorization": f"Bearer {token}"}

    
    # 2. Check if they can view students (enabled by default in seed)
    resp = await client.get("/api/v1/students", headers=headers)
    assert resp.status_code == 200
    
    # 3. Update permissions to remove 'view_students' for programme_admin
    # Note: Requires super_admin token
    from app.db.models import RolePermission
    from sqlalchemy import select, update
    
    await db.execute(
        update(RolePermission)
        .where(RolePermission.role == RoleEnum.programme_admin.value)
        .values(permissions=[])
    )
    await db.commit()
    
    # 4. Try to view students again (should fail now)
    # Clear cache first - in a real app, we might have a cache invalidation strategy.
    # In my implementation, it's a simple dict. If I'm running in the same process,
    # I might need to wait or invalidate.
    
    # Let's import the cache to clear it if needed
    from app.api.v1.deps import _PERMISSION_CACHE
    _PERMISSION_CACHE.clear()
    
    resp = await client.get("/api/v1/students", headers=headers)
    assert resp.status_code == 403
    assert "Insufficient permissions" in resp.json()["detail"]
    
    # 5. Restore permission and check again
    await db.execute(
        update(RolePermission)
        .where(RolePermission.role == RoleEnum.programme_admin.value)
        .values(permissions=["view_students"])
    )
    await db.commit()
    _PERMISSION_CACHE.clear()
    
    resp = await client.get("/api/v1/students", headers=headers)
    assert resp.status_code == 200

