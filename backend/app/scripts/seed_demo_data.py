from __future__ import annotations

import asyncio

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
        # Idempotency guard
        result = await session.execute(select(User).where(User.email == SEED_SUPER_ADMIN_EMAIL))
        existing = result.scalar_one_or_none()
        if existing is not None:
            return

        # Departments + cycle
        cycle = AcademicCycleModel(
            name="2025/26",
            start_date=None,
            end_date=None,
            created_by=None,
        )
        session.add(cycle)

        departments: dict[DisciplineEnum, DepartmentModel] = {}
        for discipline in DisciplineEnum:
            dept = DepartmentModel(
                name=f"{discipline.value.capitalize()} Department",
                discipline=discipline.value,
                created_by=None,
            )
            session.add(dept)
            departments[discipline] = dept

        await session.flush()

        def add_user(*, email: str, role: RoleEnum, discipline: DisciplineEnum | None) -> User:
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
            return user

        # Users
        _ = add_user(email=SEED_SUPER_ADMIN_EMAIL, role=RoleEnum.super_admin, discipline=None)

        _ = add_user(
            email="programme_admin_medicine@example.com",
            role=RoleEnum.programme_admin,
            discipline=DisciplineEnum.medicine,
        )
        _ = add_user(
            email="programme_admin_nursing@example.com",
            role=RoleEnum.programme_admin,
            discipline=DisciplineEnum.nursing,
        )

        _ = add_user(email="supervisor_medicine@example.com", role=RoleEnum.supervisor, discipline=DisciplineEnum.medicine)
        _ = add_user(email="supervisor_training@example.com", role=RoleEnum.supervisor, discipline=DisciplineEnum.training)

        tutor_med = add_user(email="tutor_medicine@example.com", role=RoleEnum.tutor, discipline=DisciplineEnum.medicine)
        tutor_allied = add_user(
            email="tutor_allied_health@example.com",
            role=RoleEnum.tutor,
            discipline=DisciplineEnum.allied_health,
        )
        tutor_nursing = add_user(email="tutor_nursing@example.com", role=RoleEnum.tutor, discipline=DisciplineEnum.nursing)

        students: list[User] = [
            add_user(email="student1@example.com", role=RoleEnum.student, discipline=DisciplineEnum.medicine),
            add_user(email="student2@example.com", role=RoleEnum.student, discipline=DisciplineEnum.medicine),
            add_user(email="student3@example.com", role=RoleEnum.student, discipline=DisciplineEnum.allied_health),
            add_user(email="student4@example.com", role=RoleEnum.student, discipline=DisciplineEnum.allied_health),
            add_user(email="student5@example.com", role=RoleEnum.student, discipline=DisciplineEnum.nursing),
        ]

        await session.flush()

        # Create tutor/student rows (minimal scaffolding)
        tutors = [
            TutorModel(
                user_id=tutor_med.id,
                department_id=departments[DisciplineEnum.medicine].id,
                academic_cycle_id=cycle.id,
                discipline=DisciplineEnum.medicine.value,
                created_by=None,
            ),
            TutorModel(
                user_id=tutor_allied.id,
                department_id=departments[DisciplineEnum.allied_health].id,
                academic_cycle_id=cycle.id,
                discipline=DisciplineEnum.allied_health.value,
                created_by=None,
            ),
            TutorModel(
                user_id=tutor_nursing.id,
                department_id=departments[DisciplineEnum.nursing].id,
                academic_cycle_id=cycle.id,
                discipline=DisciplineEnum.nursing.value,
                created_by=None,
            ),
        ]
        session.add_all(tutors)

        student_rows = [
            StudentModel(
                user_id=s.id,
                department_id=departments[DisciplineEnum(s.discipline)].id if s.discipline else None,
                academic_cycle_id=cycle.id,
                discipline=s.discipline or DisciplineEnum.medicine.value,
                created_by=None,
            )
            for s in students
        ]
        session.add_all(student_rows)

        await session.commit()


def main() -> None:
    asyncio.run(seed())


if __name__ == "__main__":
    main()

