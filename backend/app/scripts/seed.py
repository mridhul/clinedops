"""
ClinEdOps Demo Seed Script
Run: docker compose exec backend python -m app.scripts.seed

Idempotent: pass --reset flag to wipe seeded data and re-seed.
Uses random.seed(42) for reproducible data.
"""
from __future__ import annotations

import argparse
import os
import random
import sys
import uuid
import json
from datetime import date, datetime, timezone, timedelta
from decimal import Decimal

# ---------------------------------------------------------------------------
# Minimal deps — no faker required; we generate our own realistic data
# ---------------------------------------------------------------------------

DISCIPLINES = ["medicine", "allied_health", "nursing", "training"]

FIRST_NAMES = [
    "Aisha", "Wei Ling", "Priya", "Johan", "Min", "Sara", "Bala", "Raj",
    "Nurul", "Cheng", "Fatimah", "Ahmad", "Siti", "Tan", "Lee", "Lim",
    "Ng", "Chua", "Koh", "Wong", "James", "Sarah", "David", "Emma", "Daniel",
    "Sophia", "Michael", "Olivia", "John", "Amelia", "Robert", "Mia",
    "William", "Isla", "Benjamin", "Ella", "Lucas", "Grace", "Henry", "Chloe",
    "Alexander", "Layla", "Mason", "Scarlett", "Ethan", "Zoe", "Logan", "Lily",
    "Jacob", "Victoria",
]
LAST_NAMES = [
    "Tan", "Lim", "Lee", "Ng", "Chua", "Koh", "Wong", "Chen", "Goh", "Teo",
    "Ong", "Yeo", "Chow", "Sim", "Ho", "Chia", "Soh", "Phua", "Beh", "Yap",
    "Seah", "Wee", "Toh", "Ang", "Yong", "Khoo", "Quah", "Loh", "Poh", "Lau",
]

SESSION_TYPES = ["bedside_teaching", "tutorial", "simulation", "clinical_skills", "ward_round", "case_discussion"]
INSTITUTIONS = ["NUS Yong Soo Lin School of Medicine", "NTU Lee Kong Chian", "NUH", "SGH", "TTSH", "CGH", "KTPH"]


def rng_name() -> str:
    return f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}"


def rng_email(name: str, domain: str = "nuhs.edu.sg") -> str:
    slug = name.lower().replace(" ", ".")
    return f"{slug}.{random.randint(100, 999)}@{domain}"


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def days_ago(n: int) -> datetime:
    return utcnow() - timedelta(days=n)


def days_from_now(n: int) -> datetime:
    return utcnow() + timedelta(days=n)


# ---------------------------------------------------------------------------
# DB connection — use sync psycopg2 to avoid asyncio complexity
# ---------------------------------------------------------------------------

def get_engine():
    from sqlalchemy import create_engine
    raw_url = os.environ.get(
        "DATABASE_URL",
        "postgresql+asyncpg://clinedops:clinedops_password@db:5432/clinedops",
    )
    # Convert asyncpg URL → psycopg2 URL for sync session
    sync_url = raw_url.replace("postgresql+asyncpg://", "postgresql+psycopg2://")
    # psycopg2 not installed by default — fall back to plain psycopg
    try:
        import psycopg2  # noqa: F401
    except ImportError:
        sync_url = raw_url.replace("postgresql+asyncpg://", "postgresql://")
    return create_engine(sync_url, echo=False, future=True)


def get_session(engine):
    from sqlalchemy.orm import Session
    return Session(engine)


# ---------------------------------------------------------------------------
# Hashing — use project's own security utility
# ---------------------------------------------------------------------------

def get_hashed_password(pw: str) -> str:
    from app.core.security import hash_password
    return hash_password(pw)


# Delay hashing until run_seed to avoid import issues at module level
SEED_PASSWORD = None 


# ---------------------------------------------------------------------------
# Seed functions
# ---------------------------------------------------------------------------

def seed_users(session) -> dict[str, list]:
    """Returns categorised lists of user dicts."""
    from sqlalchemy import text

    global SEED_PASSWORD
    print("  → Seeding users…")
    users: dict[str, list] = {
        "super_admin": [],
        "programme_admin": [],
        "supervisor": [],
        "tutor": [],
        "student": [],
    }

    def insert_user(email: str, full_name: str, role: str, discipline: Optional[str] = None, is_superuser: bool = False) -> dict:
        uid = uuid.uuid4()
        session.execute(
            text("""
                INSERT INTO users (id, email, hashed_password, full_name, role, discipline, is_superuser, is_active, is_verified, created_at, updated_at)
                VALUES (:id, :email, :hp, :fn, :role, :disc, :su, true, true, :now, :now)
                ON CONFLICT (email) DO NOTHING
            """),
            {"id": uid, "email": email, "hp": SEED_PASSWORD, "fn": full_name,
             "role": role, "disc": discipline, "su": is_superuser, "now": utcnow()},
        )
        # Return inserted row id (might be existing)
        row = session.execute(text("SELECT id FROM users WHERE email = :e"), {"e": email}).fetchone()
        return {"id": row[0], "email": email, "full_name": full_name, "role": role, "discipline": discipline}

    # Super admin
    u = insert_user("superadmin@nuhs.edu.sg", "Dr. Super Admin", "super_admin", is_superuser=True)
    users["super_admin"].append(u)

    # Programme admins — one per discipline
    for disc in DISCIPLINES:
        name = f"Admin {disc.replace('_', ' ').title()}"
        u = insert_user(f"admin.{disc}@nuhs.edu.sg", name, "programme_admin", discipline=disc)
        users["programme_admin"].append(u)

    # Supervisors — one per discipline
    for disc in DISCIPLINES:
        name = rng_name()
        u = insert_user(f"supervisor.{disc}@nuhs.edu.sg", f"Dr. {name}", "supervisor", discipline=disc)
        users["supervisor"].append(u)

    # Tutors — 20 total, 5 per discipline
    for disc in DISCIPLINES:
        for i in range(5):
            name = rng_name()
            u = insert_user(f"tutor.{disc}.{i}@nuhs.edu.sg", f"Dr. {name}", "tutor", discipline=disc)
            users["tutor"].append(u)

    # Students — 50 total (~12-13 per discipline)
    for i in range(50):
        disc = DISCIPLINES[i % 4]
        name = rng_name()
        u = insert_user(f"student.{i}@nus.edu.sg", name, "student", discipline=disc)
        users["student"].append(u)

    session.commit()
    print(f"     Users inserted: {sum(len(v) for v in users.values())}")
    return users


def seed_departments(session, admin_users: list) -> list[dict]:
    from sqlalchemy import text

    print("  → Seeding departments…")
    depts = [
        ("Dept of Internal Medicine", "medicine"),
        ("Dept of Surgery", "medicine"),
        ("Dept of Physiotherapy", "allied_health"),
        ("Dept of Occupational Therapy", "allied_health"),
        ("Dept of Adult Nursing", "nursing"),
        ("Dept of Paediatric Nursing", "nursing"),
        ("Advanced Clinical Training", "training"),
        ("Graduate Medical Education", "training"),
    ]
    result = []
    admin_by_disc = {u["discipline"]: u for u in admin_users}

    for name, disc in depts:
        did = uuid.uuid4()
        admin = admin_by_disc.get(disc)
        session.execute(
            text("""
                INSERT INTO departments (id, name, discipline, created_by, is_active, created_at, updated_at)
                VALUES (:id, :name, :disc, :cb, true, :now, :now)
                ON CONFLICT (name) DO NOTHING
            """),
            {"id": did, "name": name, "disc": disc, "cb": admin["id"] if admin else None, "now": utcnow()},
        )
        row = session.execute(text("SELECT id FROM departments WHERE name = :n"), {"n": name}).fetchone()
        result.append({"id": row[0], "name": name, "discipline": disc})

    session.commit()
    print(f"     Departments inserted: {len(result)}")
    return result


def seed_academic_cycles(session, admin_id) -> list[dict]:
    from sqlalchemy import text

    print("  → Seeding academic cycles…")
    cycles_data = [
        ("AY 2022/2023 Sem 1", date(2022, 8, 1), date(2022, 12, 31), False),
        ("AY 2022/2023 Sem 2", date(2023, 1, 1), date(2023, 5, 31), False),
        ("AY 2023/2024", date(2023, 8, 1), date(2024, 5, 31), False),
        ("AY 2024/2025", date(2024, 8, 1), date(2025, 5, 31), True),
    ]
    result = []
    for name, start, end, is_current in cycles_data:
        cid = uuid.uuid4()
        session.execute(
            text("""
                INSERT INTO academic_cycles (id, name, start_date, end_date, is_current, created_by, is_active, created_at, updated_at)
                VALUES (:id, :name, :start, :end, :cur, :cb, true, :now, :now)
                ON CONFLICT (name) DO NOTHING
            """),
            {"id": cid, "name": name, "start": start, "end": end, "cur": is_current, "cb": admin_id, "now": utcnow()},
        )
        row = session.execute(text("SELECT id FROM academic_cycles WHERE name = :n"), {"n": name}).fetchone()
        result.append({"id": row[0], "name": name, "is_current": is_current})

    session.commit()
    print(f"     Academic cycles inserted: {len(result)}")
    return result


def seed_tutors(session, tutor_users: list, departments: list, cycles: list, admin_id) -> list[dict]:
    from sqlalchemy import text

    print("  → Seeding tutor profiles…")
    result = []
    disc_depts = {}
    for d in departments:
        disc_depts.setdefault(d["discipline"], []).append(d)

    current_cycle = next(c for c in cycles if c["is_current"])

    for i, u in enumerate(tutor_users):
        disc = u["discipline"]
        dept = random.choice(disc_depts.get(disc, departments))
        code = f"T{str(i+1).zfill(4)}"
        tid = uuid.uuid4()
        session.execute(
            text("""
                INSERT INTO tutors (id, user_id, tutor_code, department_id, academic_cycle_id, discipline, created_by, is_active, created_at, updated_at)
                VALUES (:id, :uid, :code, :dept, :cycle, :disc, :cb, true, :now, :now)
                ON CONFLICT (user_id) DO NOTHING
            """),
            {"id": tid, "uid": u["id"], "code": code, "dept": dept["id"],
             "cycle": current_cycle["id"], "disc": disc, "cb": admin_id, "now": utcnow()},
        )
        row = session.execute(text("SELECT id FROM tutors WHERE user_id = :uid"), {"uid": u["id"]}).fetchone()
        result.append({"id": row[0], "user_id": u["id"], "discipline": disc, "department_id": dept["id"]})

    session.commit()
    print(f"     Tutor profiles inserted: {len(result)}")
    return result


def seed_students(session, student_users: list, departments: list, cycles: list, admin_id) -> list[dict]:
    from sqlalchemy import text

    print("  → Seeding student profiles…")
    result = []
    disc_depts = {}
    for d in departments:
        disc_depts.setdefault(d["discipline"], []).append(d)

    current_cycle = next(c for c in cycles if c["is_current"])
    statuses = ["active", "active", "active", "active", "active", "active", "active", "pending_onboarding", "completed", "graduated"]

    for i, u in enumerate(student_users):
        disc = u["discipline"]
        dept = random.choice(disc_depts.get(disc, departments))
        code = f"S{str(i+1).zfill(5)}"
        sid = uuid.uuid4()
        status = random.choice(statuses)
        inst = random.choice(INSTITUTIONS)
        session.execute(
            text("""
                INSERT INTO students (id, user_id, student_code, institution, lifecycle_status, department_id, academic_cycle_id, discipline, created_by, is_active, created_at, updated_at)
                VALUES (:id, :uid, :code, :inst, :status, :dept, :cycle, :disc, :cb, true, :now, :now)
                ON CONFLICT (user_id) DO NOTHING
            """),
            {"id": sid, "uid": u["id"], "code": code, "inst": inst, "status": status,
             "dept": dept["id"], "cycle": current_cycle["id"], "disc": disc, "cb": admin_id, "now": utcnow()},
        )
        row = session.execute(text("SELECT id FROM students WHERE user_id = :uid"), {"uid": u["id"]}).fetchone()
        result.append({"id": row[0], "user_id": u["id"], "discipline": disc, "department_id": dept["id"]})

    session.commit()
    print(f"     Student profiles inserted: {len(result)}")
    return result


def seed_postings(session, students: list, tutors: list, departments: list, cycles: list, admin_id) -> list[dict]:
    from sqlalchemy import text

    print("  → Seeding postings…")
    result = []
    disc_depts = {}
    for d in departments:
        disc_depts.setdefault(d["discipline"], []).append(d)

    disc_tutors = {}
    for t in tutors:
        disc_tutors.setdefault(t["discipline"], []).append(t)

    posting_statuses = ["active", "active", "active", "active", "completed", "scheduled"]

    for i, student in enumerate(students):
        # 2 postings per student = 100 total
        for j in range(2):
            disc = student["discipline"]
            dept = random.choice(disc_depts.get(disc, departments))
            cycle = cycles[random.randint(0, len(cycles) - 1)]
            status = random.choice(posting_statuses)
            start = date(2024, random.randint(1, 6), random.randint(1, 28))
            end = start + timedelta(days=random.randint(14, 90))
            pid = uuid.uuid4()
            title = f"{disc.replace('_', ' ').title()} Clinical Posting #{i * 2 + j + 1}"

            session.execute(
                text("""
                    INSERT INTO postings (id, title, student_id, academic_cycle_id, department_id, discipline, status, start_date, end_date, created_by, is_active, created_at, updated_at)
                    VALUES (:id, :title, :sid, :cycle, :dept, :disc, :status, :start, :end, :cb, true, :now, :now)
                """),
                {"id": pid, "title": title, "sid": student["id"], "cycle": cycle["id"],
                 "dept": dept["id"], "disc": disc, "status": status, "start": start, "end": end,
                 "cb": admin_id, "now": utcnow()},
            )

            # Assign a tutor via posting_tutors
            available_tutors = disc_tutors.get(disc, tutors)
            if available_tutors:
                tutor = random.choice(available_tutors)
                pt_id = uuid.uuid4()
                session.execute(
                    text("""
                        INSERT INTO posting_tutors (id, posting_id, tutor_id, created_by, is_active, created_at, updated_at)
                        VALUES (:id, :pid, :tid, :cb, true, :now, :now)
                    """),
                    {"id": pt_id, "pid": pid, "tid": tutor["id"], "cb": admin_id, "now": utcnow()},
                )

            result.append({"id": pid, "student_id": student["id"], "discipline": disc,
                          "department_id": dept["id"], "status": status})

    session.commit()
    print(f"     Postings inserted: {len(result)}")
    return result


def seed_teaching_sessions(session, postings: list, tutors: list, students: list, admin_id) -> list[dict]:
    from sqlalchemy import text

    print("  → Seeding teaching sessions (300)…")
    result = []
    disc_tutors = {}
    for t in tutors:
        disc_tutors.setdefault(t["discipline"], []).append(t)

    approval_statuses = ["approved"] * 6 + ["pending_review"] * 2 + ["submitted"] * 1 + ["rejected"] * 1

    for i in range(300):
        posting = postings[i % len(postings)]
        disc = posting["discipline"]
        tutor = random.choice(disc_tutors.get(disc, tutors))
        dept_id = posting["department_id"]
        session_type = random.choice(SESSION_TYPES)
        duration = random.choice([30, 45, 60, 90, 120])
        starts = days_ago(random.randint(1, 365))
        ends = starts + timedelta(minutes=duration)
        approval_status = random.choice(approval_statuses)
        is_flagged = random.random() < 0.08  # ~8% flagged
        billable = duration if approval_status == "approved" else None

        approved_at = None
        approved_by = None
        submitted_at = starts + timedelta(hours=2)
        if approval_status in ("approved", "rejected"):
            approved_at = submitted_at + timedelta(hours=random.randint(1, 48))
            approved_by = admin_id

        sid = uuid.uuid4()
        session.execute(
            text("""
                INSERT INTO teaching_sessions (
                    id, posting_id, tutor_id, starts_at, ends_at, status, session_type,
                    duration_minutes, department_id, discipline, approval_status,
                    submitted_at, approved_at, approved_by, is_flagged, billable_minutes,
                    created_by, is_active, created_at, updated_at
                ) VALUES (
                    :id, :pid, :tid, :starts, :ends, 'active', :stype,
                    :dur, :dept, :disc, :astatus,
                    :subat, :appat, :appby, :flagged, :bill,
                    :cb, true, :now, :now
                )
            """),
            {
                "id": sid, "pid": posting["id"], "tid": tutor["id"], "starts": starts, "ends": ends,
                "stype": session_type, "dur": duration, "dept": dept_id, "disc": disc,
                "astatus": approval_status, "subat": submitted_at, "appat": approved_at,
                "appby": approved_by, "flagged": is_flagged, "bill": billable,
                "cb": admin_id, "now": utcnow(),
            },
        )

        # Link a student from the posting
        student_id = posting["student_id"]
        ss_id = uuid.uuid4()
        session.execute(
            text("""
                INSERT INTO session_students (id, teaching_session_id, student_id, created_by, is_active, created_at, updated_at)
                VALUES (:id, :tsid, :sid, :cb, true, :now, :now)
            """),
            {"id": ss_id, "tsid": sid, "sid": student_id, "cb": admin_id, "now": utcnow()},
        )

        result.append({"id": sid, "posting_id": posting["id"], "student_id": student_id,
                        "discipline": disc, "approval_status": approval_status, "tutor_id": tutor["id"]})

    session.commit()
    print(f"     Teaching sessions inserted: {len(result)}")
    return result


def seed_survey_templates(session, admin_id) -> list[dict]:
    from sqlalchemy import text

    print("  → Seeding survey templates…")
    templates = []
    sample_questions = [
        {"id": "q1", "type": "rating", "text": "How would you rate the teaching quality?", "scale": 5},
        {"id": "q2", "type": "rating", "text": "How well did the tutor explain clinical concepts?", "scale": 5},
        {"id": "q3", "type": "rating", "text": "Rate the learning environment overall.", "scale": 5},
        {"id": "q4", "type": "free_text", "text": "What did you find most valuable in this posting?"},
        {"id": "q5", "type": "free_text", "text": "What improvements would you suggest?"},
        {"id": "q6", "type": "multi_choice", "text": "Which areas were covered?",
         "options": ["Clinical Skills", "Communication", "Professionalism", "Procedures"]},
    ]

    configs = [
        ("Medicine End-of-Posting Survey", "medicine", "end_of_posting"),
        ("Allied Health Midpoint Check", "allied_health", "midpoint"),
        ("Nursing End-of-Posting Survey", "nursing", "end_of_posting"),
        ("Training Programme Ad-hoc Feedback", "training", "ad_hoc"),
        ("Medicine Midpoint Review", "medicine", "midpoint"),
        ("General Teaching Quality Survey", "allied_health", "end_of_posting"),
    ]

    for name, disc, stype in configs:
        tid = uuid.uuid4()
        low_threshold = random.choice([2, 3, 3, 3, 4])
        session.execute(
            text("""
                INSERT INTO survey_templates (id, name, discipline, survey_type, questions, low_score_threshold, created_by, is_active, created_at, updated_at)
                VALUES (:id, :name, :disc, :stype, :questions, :thresh, :cb, true, :now, :now)
                ON CONFLICT (id) DO NOTHING
            """),
            {"id": tid, "name": name, "disc": disc, "stype": stype,
             "questions": json.dumps(sample_questions), "thresh": low_threshold,
             "cb": admin_id, "now": utcnow()},
        )
        row = session.execute(text("SELECT id FROM survey_templates WHERE name = :n"), {"n": name}).fetchone()
        templates.append({"id": row[0], "name": name, "discipline": disc, "low_score_threshold": low_threshold})

    session.commit()
    print(f"     Survey templates inserted: {len(templates)}")
    return templates


def seed_survey_submissions(session, templates: list, tech_sessions: list, students: list, admin_id) -> None:
    from sqlalchemy import text

    print("  → Seeding survey assignments + submissions (200)…")
    disc_templates = {}
    for t in templates:
        disc_templates.setdefault(t["discipline"], []).append(t)

    disc_students = {}
    for s in students:
        disc_students.setdefault(s["discipline"], []).append(s)

    POSITIVE_COMMENTS = [
        "Excellent bedside manner, very patient with questions.",
        "The clinical demonstrations were very clear and helpful.",
        "Great session on clinical reasoning. I learned a lot.",
        "Very supportive and encouraging environment.",
        "Strong focus on practical skills which was much appreciated.",
        "Amazing tutor! Very knowledgeable and approachable.",
        "The case discussions were insightful and relevant.",
    ]
    NEGATIVE_COMMENTS = [
        "The session felt rushed and lacked depth.",
        "Feedback was generic and not very helpful.",
        "Instructions were bit unclear during the simulation.",
        "Hard to follow at times, could be more organized.",
        "Would appreciate more hands-on opportunities.",
    ]

    count = 0
    for i in range(200):
        disc = DISCIPLINES[i % 4]
        tmpl_list = disc_templates.get(disc, templates)
        tmpl = random.choice(tmpl_list)
        student = random.choice(disc_students.get(disc, students))

        # Survey assignment
        assignment_id = uuid.uuid4()
        session_obj = random.choice([s for s in tech_sessions if s["discipline"] == disc] or tech_sessions)
        due_date = days_from_now(random.randint(-30, 30))
        assignment_status = random.choice(["completed", "completed", "completed", "pending", "overdue"])

        session.execute(
            text("""
                INSERT INTO survey_assignments (
                    id, template_id, student_id, posting_id, session_ids, tutor_ids,
                    status, due_date, created_by, is_active, created_at, updated_at
                ) VALUES (
                    :id, :tmpl, :sid, :pid, :sids, :tids,
                    :status, :due, :cb, true, :now, :now
                )
            """),
            {
                "id": assignment_id, "tmpl": tmpl["id"], "sid": student["id"],
                "pid": session_obj["posting_id"],
                "sids": json.dumps([str(session_obj["id"])]),
                "tids": json.dumps([str(session_obj["tutor_id"])]),
                "status": assignment_status, "due": due_date,
                "cb": admin_id, "now": utcnow(),
            },
        )

        # Survey submission (for completed assignments)
        if assignment_status == "completed":
            # 20% chance of low-score submission
            is_low_score = i % 5 == 0
            scores = [random.randint(1, 2) if is_low_score else random.randint(3, 5) for _ in range(3)]
            overall = round(sum(scores) / len(scores), 2)

            responses = {
                "q1": {"score": scores[0]},
                "q2": {"score": scores[1]},
                "q3": {"score": scores[2]},
                "q4": {"text": random.choice(POSITIVE_COMMENTS) if not is_low_score else random.choice(NEGATIVE_COMMENTS)},
                "q5": {"text": "Maybe more focus on the new protocol next time." if not is_low_score else "The environment was a bit distracting."},
                "q6": {"selected": ["Clinical Skills", "Communication"]},
                "comment": random.choice(POSITIVE_COMMENTS) if not is_low_score else random.choice(NEGATIVE_COMMENTS)
            }

            sub_id = uuid.uuid4()
            session.execute(
                text("""
                    INSERT INTO survey_submissions (
                        id, assignment_id, template_id, teaching_session_id, student_id,
                        responses, overall_score, has_low_scores, status,
                        created_by, is_active, created_at, updated_at
                    ) VALUES (
                        :id, :aid, :tmpl, :tsid, :sid,
                        :resp, :score, :low, 'submitted',
                        :cb, true, :now, :now
                    )
                """),
                {
                    "id": sub_id, "aid": assignment_id, "tmpl": tmpl["id"],
                    "tsid": session_obj["id"], "sid": student["id"],
                    "resp": json.dumps(responses), "score": overall,
                    "low": is_low_score, "cb": admin_id, "now": utcnow(),
                },
            )
            count += 1

    session.commit()
    print(f"     Survey assignments (200) + submissions ({count}) inserted")


def seed_notifications(session, users: dict[str, list]) -> None:
    from sqlalchemy import text

    print("  → Seeding notifications…")
    notif_types = [
        "SURVEY_PENDING", "HOURS_PENDING_APPROVAL", "HOURS_APPROVED", "HOURS_REJECTED",
        "LOW_SCORE_ALERT", "DEADLINE_APPROACHING", "BROADCAST", "ESCALATION",
    ]
    meta = {
        "SURVEY_PENDING": ("New Survey Assigned", "You have a pending survey to complete."),
        "HOURS_PENDING_APPROVAL": ("Session Pending Approval", "A teaching session is awaiting your approval."),
        "HOURS_APPROVED": ("Hours Approved", "Your teaching session hours have been approved."),
        "HOURS_REJECTED": ("Hours Rejected", "Your teaching session hours were rejected."),
        "LOW_SCORE_ALERT": ("Low Score Alert", "A student has submitted a low-score survey. Please review."),
        "DEADLINE_APPROACHING": ("Deadline Approaching", "Survey submission deadline is approaching in 2 days."),
        "BROADCAST": ("System Announcement", "System maintenance scheduled for this weekend. Please plan accordingly."),
        "ESCALATION": ("Escalation Alert", "Feedback overdue escalation: student has not submitted their survey."),
    }

    all_users = [u for group in users.values() for u in group]
    count = 0
    for i in range(150):
        recipient = random.choice(all_users)
        ntype = notif_types[i % len(notif_types)]
        title, msg = meta[ntype]
        nid = uuid.uuid4()
        session.execute(
            text("""
                INSERT INTO notifications (id, recipient_id, type, title, message, is_read, created_at, updated_at)
                VALUES (:id, :rid, :type, :title, :msg, :read, :now, :now)
            """),
            {
                "id": nid, "rid": recipient["id"], "type": ntype,
                "title": title, "msg": msg,
                "read": random.random() > 0.4,
                "now": days_ago(random.randint(0, 60)),
            },
        )
        count += 1

    session.commit()
    print(f"     Notifications inserted: {count}")


def seed_audit_logs(session, users: dict[str, list], admin_id) -> None:
    from sqlalchemy import text

    print("  → Seeding audit logs…")
    actions = [
        "CREATE_STUDENT", "UPDATE_STUDENT", "CREATE_TUTOR", "APPROVE_SESSION",
        "REJECT_SESSION", "CREATE_POSTING", "UPDATE_POSTING", "SUBMIT_SURVEY",
        "CREATE_USER", "UPDATE_USER", "DEACTIVATE_USER", "EXPORT_REPORT",
    ]
    entity_types = ["student", "tutor", "teaching_session", "posting", "survey_submission", "user"]
    all_users = [u for group in users.values() for u in group]

    for i in range(200):
        actor = random.choice(all_users + [{"id": admin_id}])
        action = random.choice(actions)
        entity_type = random.choice(entity_types)
        lid = uuid.uuid4()
        session.execute(
            text("""
                INSERT INTO audit_logs (id, action, entity_type, entity_id, before_state, after_state, created_by, created_at, updated_at)
                VALUES (:id, :action, :etype, :eid, :before, :after, :cb, :now, :now)
            """),
            {
                "id": lid, "action": action, "etype": entity_type,
                "eid": uuid.uuid4(), "cb": actor["id"],
                "before": json.dumps({"status": "pending"} if "UPDATE" in action or "APPROVE" in action else None),
                "after": json.dumps({"status": "approved"} if "APPROVE" in action else {"status": "active"}),
                "now": days_ago(random.randint(0, 365)),
            },
        )

    session.commit()
    print("     Audit logs inserted: 200")


def seed_import_batches(session, admin_id) -> None:
    from sqlalchemy import text

    print("  → Seeding import batch records…")
    statuses = ["COMPLETED", "COMPLETED", "COMPLETED", "PARTIAL_SUCCESS", "FAILED", "PROCESSING"]
    batch_types = ["student_import", "tutor_import", "posting_import"]

    for i in range(10):
        status = random.choice(statuses)
        records = random.randint(10, 100)
        errors = 0 if status == "COMPLETED" else random.randint(1, 5)
        bid = uuid.uuid4()
        details = {
            "records_processed": records,
            "total_records": records,
            "processed_records": records - errors,
            "failed_records": errors,
            "errors": errors
        }
        session.execute(
            text("""
                INSERT INTO import_batches (
                    id, batch_type, file_name, status, details,
                    created_by, is_active, created_at, updated_at
                ) VALUES (
                    :id, :btype, :fname, :status, :details,
                    :cb, true, :now, :now
                )
            """),
            {
                "id": bid,
                "btype": random.choice(batch_types),
                "fname": f"import_{i+1}_{date.today().isoformat()}.csv",
                "status": status,
                "details": json.dumps(details),
                "cb": admin_id,
                "now": days_ago(random.randint(0, 90)),
            },
        )

    session.commit()
    print("     Import batches inserted: 10")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def run_seed(reset: bool = False) -> None:
    import time
    global SEED_PASSWORD
    random.seed(42)

    start_time = time.time()
    print("\n🌱 ClinEdOps Demo Seed Script")
    print("=" * 50)

    # Pre-hash password
    SEED_PASSWORD = get_hashed_password("ClinEdOps2024!")

    engine = get_engine()
    session = get_session(engine)

    if reset:
        print("  ⚠  --reset: truncating seeded data…")
        from sqlalchemy import text
        # Truncate in dependency order
        tables = [
            "import_batches", "audit_logs", "notifications",
            "survey_submissions", "survey_assignments", "survey_templates",
            "session_students", "teaching_sessions",
            "posting_tutors", "postings",
            "tutor_billable_rates", "tutors", "students",
            "academic_cycles", "departments",
        ]
        for table in tables:
            session.execute(text(f"TRUNCATE TABLE {table} CASCADE"))
        # Delete seeded users (by email patterns)
        session.execute(text("""
            DELETE FROM users WHERE email LIKE '%@nuhs.edu.sg' OR email LIKE '%@nus.edu.sg'
        """))
        session.commit()
        print("  ✓  Data truncated")

    try:
        users = seed_users(session)
        admin_id = users["super_admin"][0]["id"]

        departments = seed_departments(session, users["programme_admin"])
        cycles = seed_academic_cycles(session, admin_id)
        tutors = seed_tutors(session, users["tutor"], departments, cycles, admin_id)
        students = seed_students(session, users["student"], departments, cycles, admin_id)
        postings = seed_postings(session, students, tutors, departments, cycles, admin_id)
        tech_sessions = seed_teaching_sessions(session, postings, tutors, students, admin_id)
        templates = seed_survey_templates(session, admin_id)
        seed_survey_submissions(session, templates, tech_sessions, students, admin_id)
        seed_notifications(session, users)
        seed_audit_logs(session, users, admin_id)
        seed_import_batches(session, admin_id)

        elapsed = time.time() - start_time
        print("=" * 50)
        print(f"✅  Seed complete in {elapsed:.1f}s")
        print(f"\n  Login credentials:")
        print(f"  Super Admin : superadmin@nuhs.edu.sg / ClinEdOps2024!")
        print(f"  Tutor       : tutor.medicine.0@nuhs.edu.sg / ClinEdOps2024!")
        print(f"  Student     : student.0@nus.edu.sg / ClinEdOps2024!")
        print()

    except Exception as exc:
        session.rollback()
        print(f"\n❌  Seed failed: {exc}")
        raise
    finally:
        session.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="ClinEdOps demo seed script")
    parser.add_argument("--reset", action="store_true", help="Truncate seeded data before re-seeding")
    args = parser.parse_args()
    run_seed(reset=args.reset)