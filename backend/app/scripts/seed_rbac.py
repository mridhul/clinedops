import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select

from app.db.models.core import RolePermission
from app.db.models.enums import RoleEnum
from app.core.config import get_settings

# Default permissions for each role
DEFAULT_RBAC = {
    RoleEnum.super_admin.value: [
        "view_students", "edit_students",
        "view_tutors", "edit_tutors",
        "approve_hours", "manage_surveys",
        "view_reports", "manage_settings"
    ],
    RoleEnum.programme_admin.value: [
        "view_students", "edit_students",
        "view_tutors", "edit_tutors",
        "manage_surveys", "view_reports"
    ],
    RoleEnum.supervisor.value: [
        "view_students",
        "view_tutors",
        "approve_hours",
        "view_reports"
    ],
    RoleEnum.tutor.value: [
        "view_students" # Can see students in their postings
    ],
    RoleEnum.student.value: []
}

async def seed_rbac():
    settings = get_settings()
    engine = create_async_engine(settings.database_url)
    AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with AsyncSessionLocal() as session:
        print("Seeding RBAC permissions...")
        for role, permissions in DEFAULT_RBAC.items():
            # Check if exists
            result = await session.execute(select(RolePermission).where(RolePermission.role == role))
            rp = result.scalars().first()
            if not rp:
                print(f"Creating permissions for {role}")
                rp = RolePermission(role=role, permissions=permissions)
                session.add(rp)
            else:
                print(f"Updating permissions for {role}")
                rp.permissions = permissions
        
        await session.commit()
        print("RBAC seeding complete.")

if __name__ == "__main__":
    asyncio.run(seed_rbac())
