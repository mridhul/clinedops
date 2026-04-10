# RBAC Mapping Matrix

This document defines the expected access control for each role in ClinEdOps.

## Role Definitions
- **Super Admin (`super_admin`)**: Global access to all disciplines and system administration.
- **Program Admin (`programme_admin`)**: Administrative access scoped to a specific discipline (e.g., Medicine).
- **Supervisor / HOD (`supervisor`)**: Read-only access to discipline data + Approval rights for teaching sessions.
- **Tutor (`tutor`)**: Logs teaching hours and views self-analytics.
- **Student (`student`)**: Logs teaching hours and completes surveys.

## Feature / API Matrix

| Feature Module | API Endpoint Prefix | Super Admin | Program Admin | Supervisor (HOD) | Tutor | Student |
|---|---|:---:|:---:|:---:|:---:|:---:|
| **Admin Console** | `/api/v1/admin/*` | ✅ | ❌ | ❌ | ❌ | ❌ |
| **User Directory** | `/api/v1/admin/users` | ✅ | ❌ | ❌ | ❌ | ❌ |
| **RBAC / Settings** | `/api/v1/admin/rbac` | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Student Mgmt** | `/api/v1/students/*` | ✅ (All) | ✅ (Disc) | ❌ | ❌ | ❌ |
| **Tutor Mgmt** | `/api/v1/tutors/*` | ✅ (All) | ✅ (Disc) | ❌ | ❌ | ❌ |
| **Postings** | `/api/v1/postings/*` | ✅ (All) | ✅ (Disc) | ❌ | ❌ | ❌ |
| **Analytics** | `/api/v1/analytics/dashboard` | ✅ (Global) | ✅ (Disc) | ✅ (Disc) | ✅ (Self) | ✅ (Self) |
| **Sessions (Log)** | `/api/v1/teaching-sessions` (POST) | ✅ | ✅ | ❌ | ✅ | ✅ |
| **Sessions (Approve)** | `/api/v1/teaching-sessions/{id}/approve` | ✅ | ✅ (Disc) | ✅ (Disc) | ❌ | ❌ |
| **Survey Templates** | `/api/v1/surveys/templates/*` | ✅ (All) | ✅ (Disc) | ❌ | ❌ | ❌ |
| **Reports** | `/api/v1/reports/*` | ✅ (All) | ✅ (Disc) | ✅ (Disc) | ❌ | ❌ |
| **Broadcasts** | `/api/v1/admin/broadcast` | ✅ | ❌ | ❌ | ❌ | ❌ |

## Discipline Scoping Rules
- If `actor.role != super_admin`, then `actor.discipline` MUST match the discipline of the target entity (Student, Tutor, Session, etc.).
- Access is denied (403) if the discipline scope is violated.
