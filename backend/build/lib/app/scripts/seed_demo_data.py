from __future__ import annotations

import asyncio
import datetime

from sqlalchemy import select

from app.core.security import hash_password
from app.db.models import User
from app.db.models.core import AcademicCycle as AcademicCycleModel
from app.db.models.core import Department as DepartmentModel
from app.db.models.core import Student as StudentModel
from app.db.models.core import Tutor as TutorModel
from app.db.session import get_db_session
from app.db.models.enums import DisciplineEnum, RoleEnum


SEED_SUPER_ADMIN_EMAIL = "admin@example.com"
SEED_STUDENT_EMAIL = "student1@example.com"
SEED_PASSWORD = "DemoPassword1!"


async def seed() -> None:
    async for session in get_db_session():
        # Idempotency guard for cycle
        result = await session.execute(select(AcademicCycleModel).where(AcademicCycleModel.name == "2025/26"))
        cycle = result.scalar_one_or_none()
        if cycle is None:
            cycle = AcademicCycleModel(
                name="2025/26",
                start_date=None,
                end_date=None,
                is_current=True,
                created_by=None,
            )
            session.add(cycle)
            await session.flush()

        # Departments
        departments: dict[str, DepartmentModel] = {}
        for discipline in DisciplineEnum:
            result = await session.execute(
                select(DepartmentModel).where(DepartmentModel.discipline == discipline.value)
            )
            dept = result.scalar_one_or_none()
            if dept is None:
                dept = DepartmentModel(
                    name=f"{discipline.value.capitalize()} Department",
                    discipline=discipline.value,
                    created_by=None,
                )
                session.add(dept)
            departments[discipline.value] = dept
        await session.flush()

        async def get_or_create_user(*, email: str, role: RoleEnum, discipline: DisciplineEnum | None) -> User:
            result = await session.execute(select(User).where(User.email == email))
            user = result.scalar_one_or_none()
            if user is None:
                user = User(
                    email=email,
                    hashed_password=hash_password(SEED_PASSWORD),
                    full_name=email.split("@")[0],
                    role=role.value,
                    discipline=discipline.value if discipline else None,
                    is_active=True,
                    is_superuser=(role == RoleEnum.super_admin),
                    is_verified=True,
                    created_by=None,
                )
                session.add(user)
                await session.flush()
            return user

        # Users
        admin_user = await get_or_create_user(email=SEED_SUPER_ADMIN_EMAIL, role=RoleEnum.super_admin, discipline=None)

        _ = await get_or_create_user(
            email="programme_admin_medicine@example.com",
            role=RoleEnum.programme_admin,
            discipline=DisciplineEnum.medicine,
        )
        
        supervisor_med = await get_or_create_user(email="supervisor_medicine@example.com", role=RoleEnum.supervisor, discipline=DisciplineEnum.medicine)

        tutor_med_user = await get_or_create_user(email="tutor_medicine@example.com", role=RoleEnum.tutor, discipline=DisciplineEnum.medicine)
        
        student_med_user = await get_or_create_user(email=SEED_STUDENT_EMAIL, role=RoleEnum.student, discipline=DisciplineEnum.medicine)

        # Profiles
        result = await session.execute(select(TutorModel).where(TutorModel.user_id == tutor_med_user.id))
        tutor_med = result.scalar_one_or_none()
        if tutor_med is None:
            tutor_med = TutorModel(
                user_id=tutor_med_user.id,
                tutor_code="TUT-MED-001",
                department_id=departments[DisciplineEnum.medicine.value].id,
                academic_cycle_id=cycle.id,
                discipline=DisciplineEnum.medicine.value,
                created_by=None,
            )
            session.add(tutor_med)

        result = await session.execute(select(StudentModel).where(StudentModel.user_id == student_med_user.id))
        student_med = result.scalar_one_or_none()
        if student_med is None:
            student_med = StudentModel(
                user_id=student_med_user.id,
                student_code="STU-MED-001",
                institution="National University of Singapore",
                lifecycle_status="active_posting",
                department_id=departments[DisciplineEnum.medicine.value].id,
                academic_cycle_id=cycle.id,
                discipline=DisciplineEnum.medicine.value,
                created_by=None,
            )
            session.add(student_med)
        
        await session.flush()

        # Posting
        from app.db.models.core import Posting as PostingModel
        result = await session.execute(select(PostingModel).where(PostingModel.title == "General Surgery Rotation"))
        posting = result.scalar_one_or_none()
        if posting is None:
            posting = PostingModel(
                title="General Surgery Rotation",
                student_id=student_med.id,
                academic_cycle_id=cycle.id,
                department_id=departments[DisciplineEnum.medicine.value].id,
                discipline=DisciplineEnum.medicine.value,
                start_date=datetime.date.today() - datetime.timedelta(days=7),
                end_date=datetime.date.today() + datetime.timedelta(days=21),
                created_by=None,
            )
            session.add(posting)
            await session.flush()
            
            # Link tutor
            from app.db.models.core import PostingTutor
            pt = PostingTutor(
                posting_id=posting.id,
                tutor_id=tutor_med.id,
                created_by=None,
            )
            session.add(pt)

        await session.commit()


def main() -> None:
    asyncio.run(seed())


if __name__ == "__main__":
    main()
