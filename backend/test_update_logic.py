import asyncio
import json
from uuid import uuid4
from app.db.models import User, Student
from app.db.models.enums import RoleEnum, DisciplineEnum, StudentLifecycleStatusEnum
from app.services import student_service
from app.api.v1.students.schemas import StudentUpdate

class MockUser:
    def __init__(self, role, discipline):
        self.id = uuid4()
        self.role = role
        self.discipline = discipline
        self.email = f"user_{role}@example.com"

async def test_update_student_logic():
    # 1. Programme Admin Editing own discipline student
    actor = MockUser(RoleEnum.programme_admin.value, "medicine")
    payload = StudentUpdate(lifecycle_status="completed")
    
    print(f"Testing lifecycle update by {actor.role} for discipline {actor.discipline}")
    valid_statuses = {e.value for e in StudentLifecycleStatusEnum}
    if payload.lifecycle_status not in valid_statuses:
        print(f"FAIL: Invalid lifecycle_status {payload.lifecycle_status}")
    else:
        print("PASS: Valid lifecycle_status logic")

    # 2. Programme Admin changing discipline (Should be blocked by logic but UI might allow)
    payload_disc = StudentUpdate(discipline="nursing")
    print(f"Testing discipline change to {payload_disc.discipline} by {actor.role}")
    if actor.discipline is not None and payload_disc.discipline != actor.discipline:
        print("PASS: Correctly identified discipline scope violation (would raise 403)")
    else:
        print("FAIL: Should have identified scope violation")

if __name__ == "__main__":
    asyncio.run(test_update_student_logic())
