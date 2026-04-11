# ClinEdOps Demo Script: Modern Clinical Education Operations

**Duration**: 15 Minutes
**Objective**: Demonstrate a seamless flow from student onboarding to administrative oversight and reporting.

---

## 🚀 Setup Demo Data
Run this command to clear existing data and seed the realistic demo profiles:
```bash
docker compose exec backend python -m app.scripts.seed --reset
```

## 🔑 Persona Credentials
*All users share the password:* `ClinEdOps2024!`

| Role | Email Example | Description |
| :--- | :--- | :--- |
| **Super Admin** (SAAS ADMIN) | `superadmin@nuhs.edu.sg` | Full system access, RBAC, System Settings. |
| **Prog Admin** (PROGRAM ADMIN) | `admin.medicine@nuhs.edu.sg` | Discipline-specific management (Medicine). |
| **Supervisor** (Dept Head) | `supervisor.nursing@nuhs.edu.sg` | High-level oversite for Nursing. |
| **Tutor** (Medical Tutor) | `tutor.medicine.0@nuhs.edu.sg` | Log teaching sessions, view student stats (0-4). |
| **Student** (Medical Student) | `student.0@nus.edu.sg` | View postings, fill surveys (0-49). |

Mridhul@slashllm.com q1w2e3r4t5
---

## 1. Introduction (1 min)
*   **The Problem**: Clinical rotations are often managed with spreadsheets and paper logs, leading to compliance gaps and slow feedback.
*   **The Solution**: ClinEdOps - A premium, mobile-first platform for tracking clinical education at scale.

## 2. Admin: System Configuration (2 mins)
*   **Login**: Sign in as `superadmin@nuhs.edu.sg`.
*   **RBAC**: Navigate to **Admin Console -> RBAC Config**. Show the permission matrix. Explain how we control access for Tutors vs. Students.
*   **Settings**: Show **System Settings**. Point out the PDPA data retention policy—compliance is built-in.

## 3. Student Onboarding & Bulk Operations (3 mins)
*   **Student List**: Navigate to **Students**. Show the premium glassmorphism design and the clean table.
*   **Manual Add**: Briefly show the "Register New Student" drawer.
*   **Verification**: Show **Import History**. Explain that we just synced 50 students via CSV from the hospital's HR system.

## 4. Tutor: Logging a Teaching Session (3 mins)
*   **Role Switch**: Sign in as a Tutor (`tutor.medicine.0@nuhs.edu.sg`).
*   **Dashboard**: Show KPI cards (Teaching Hours, Student Feedback).
*   **Log Session**: Click **Log New Session**. Fill in a sample 2-hour clinical skills session.
*   **Submit**: Show the draft state and then click **Submit**. Notice the real-time notification indicator in the header.

## 5. Admin: Review & Approval (2 mins)
*   **Pending Queue**: Back in Admin view, go to **Sessions -> Pending Review**.
*   **Approval**: Find the tutor's session. Show the audit trail (who logged it, when). Click **Approve**.
*   **Result**: The tutor's dashboard KPIs update instantly.

## 6. Student: The Feedback Loop (2 mins)
*   **Student View**: Sign in as a Student (`student.0@nus.edu.sg`).
*   **Dashboard**: Show "Active Posting" (e.g., Ward 7 Nursing).
*   **Survey**: Navigate to **Surveys**. Take the "Clinical Environment Audit".
*   **UX**: Show the smooth transitions between questions. Note: If I give a low score (<=2), the system prompts for a mandatory comment.

## 7. Leadership: Analytics & Reporting (2 mins)
*   **Reports**: Navigate to **Reports & Analytics**.
*   **Generate**: Select "Student Progress Portfolio" -> **PDF**.
*   **History**: Show the generation history. Download the completed PDF.
*   **Mobile Moment**: Briefly shrink the browser (or show a recording) of the **Mobile Bottom Tab Bar** and responsive tables.

---

## Conclusion
*   ClinEdOps standardizes clinical tracking, ensures compliance, and provides real-time insights for healthcare leadership.
*   **Ready for Demo.**
