import asyncio
import uuid
from sqlalchemy import select
from app.db.session import async_session_factory
from app.db.models import JobShadowingApplication, Student, User

async def seed_shadowing():
    async with async_session_factory() as db:
        # Get a student to associate with
        stmt = select(Student).limit(1)
        student = (await db.execute(stmt)).scalar_one_or_none()
        
        if not student:
            print("No students found to seed shadowing applications.")
            return

        # Check if already seeded
        stmt = select(JobShadowingApplication).limit(1)
        existing = (await db.execute(stmt)).scalar_one_or_none()
        if existing:
            print("Shadowing applications already seeded.")
            return

        apps = [
            JobShadowingApplication(
                id=uuid.uuid4(),
                student_id=student.id,
                discipline="Medicine",
                reason="Interested in observing advanced cardiac procedures and patient management in the ICU.",
                status="pending"
            ),
            JobShadowingApplication(
                id=uuid.uuid4(),
                student_id=student.id,
                discipline="Nursing",
                reason="Keen to understand the specialized nursing care for post-operative pediatric patients.",
                status="shortlisted"
            )
        ]
        
        db.add_all(apps)
        await db.commit()
        print(f"Seeded {len(apps)} shadowing applications for student {student.id}")

if __name__ == "__main__":
    asyncio.run(seed_shadowing())
