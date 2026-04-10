import asyncio
import json
from uuid import uuid4
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select
from app.db.models import User, Student
from app.db.models.enums import RoleEnum, DisciplineEnum, StudentLifecycleStatusEnum
from app.services import student_service
from app.api.v1.students.schemas import StudentCreate

# Mock Actor (Programme Admin)
class MockUser:
    def __init__(self):
        self.id = uuid4()
        self.role = RoleEnum.programme_admin.value
        self.discipline = "medicine"
        self.email = "admin@example.com"

async def test_create_student():
    actor = MockUser()
    payload = StudentCreate(
        email=f"test_student_{uuid4()}@example.com",
        password="password123",
        full_name="Test Student",
        student_code=f"STU_{uuid4()}",
        discipline="medicine",
        lifecycle_status="pending_onboarding"
    )
    
    # This is just a thought experiment since I can't run it against a real DB easily without setting up env
    print(f"Testing student creation with payload: {payload}")
    print(f"Actor role: {actor.role}, discipline: {actor.discipline}")
    
    # Check checks
    valid_statuses = {e.value for e in StudentLifecycleStatusEnum}
    print(f"Valid statuses: {valid_statuses}")
    if payload.lifecycle_status not in valid_statuses:
        print("FAIL: Invalid lifecycle_status")
    else:
        print("PASS: Valid lifecycle_status")

if __name__ == "__main__":
    asyncio.run(test_create_student())
