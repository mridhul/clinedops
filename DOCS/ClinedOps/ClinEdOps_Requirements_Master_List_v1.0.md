# ClinEdOps — Master Requirements List

**Project:** ClinEdOps — Unified Clinical Education Operations Platform
**Client:** National University Hospital (NUH) — Medical Affairs (Education)
**Version:** 1.0
**Date:** April 2026
**Prepared by:** SlashLLM

---

## How to Read This Document

Each requirement is assigned a unique ID using the format `[Category]-[Module]-[Number]`. Priority levels are defined as follows: **P0** = Must-have for MVP/POC demo, **P1** = Must-have for production, **P2** = Should-have (post-production enhancement), **P3** = Nice-to-have (future roadmap). The "Source" column traces each requirement back to the Challenge Brief (CB), PRD, or Proposal (PROP) to maintain traceability.

---

## 1. FUNCTIONAL REQUIREMENTS — Student & Tutor Lifecycle Management

| Req ID | Requirement | Description | Priority | Source | Acceptance Criteria |
|---|---|---|---|---|---|
| FR-STU-001 | Student profile creation | Create student records with fields: full name, student code, institution (NUS, SIT, SP, PSB Academy), discipline (Medicine, Allied Health, Nursing, Training), programme, cohort, academic cycle, current posting status | P0 | CB, PRD | Student record created with all mandatory fields validated; appears in student list |
| FR-STU-002 | Student status lifecycle tracking | Track student status through: Pending Onboard → Active → Completed → Offboarded. Status transitions must be auditable | P0 | CB, PRD | Status changes reflected in real-time; each transition logged in audit trail |
| FR-STU-003 | Assign students to postings | Assign students to departments, postings, tutors, and academic cycles with date ranges | P0 | CB, PRD | Student linked to posting with start/end dates; visible on student profile and posting detail |
| FR-STU-004 | Student detail view | View student profile card with posting history timeline, feedback received, teaching hours, and audit trail | P0 | PRD | All associated data rendered on single profile page with timeline view |
| FR-STU-005 | Student list with filters | Filterable student list by discipline, institution, status, academic cycle. Sortable table with bulk actions and export button | P0 | PRD | Filters reduce results correctly; sort toggles work; CSV/Excel export produces valid file |
| FR-STU-006 | Single student creation form | Add individual student via form with field-level validation (required fields, format checks, duplicate detection) | P0 | PRD | Form validates all required fields; duplicate student code rejected with error message |
| FR-STU-007 | Student record editing | Update existing student records (programme admin and above) | P0 | PRD | Edits saved successfully; changes logged in audit trail with before/after values |
| FR-STU-008 | Student soft delete | Deactivate student records (super admin only) without hard deletion. Soft-deleted records retained for historical/audit purposes | P1 | PRD | Student marked inactive; excluded from active lists; data retained in database |
| FR-STU-009 | Student offboarding workflow | Offline offboarding process capturing final data, posting completion status, and feedback closure | P1 | PRD | Offboarding checklist completed; student status moves to Offboarded; final data captured |
| FR-STU-010 | Historical student record retention | Retain completed/offboarded student records indefinitely for accreditation and audit | P1 | PRD | Historical records accessible via search/filter; no data loss after academic cycle closure |
| FR-TUT-001 | Tutor profile creation | Create tutor records with: full name, staff code, department, specialty, discipline, billable rate (SGD), active/inactive status | P0 | CB, PRD | Tutor record created; billable rate stored as NUMERIC(10,2); appears in tutor list |
| FR-TUT-002 | Tutor detail view | View tutor profile with teaching hours by cycle, feedback summary, billing summary, and assigned students | P0 | PRD | All associated data rendered; hours aggregated correctly by cycle |
| FR-TUT-003 | Tutor list with filters | Filterable, sortable tutor list showing current teaching load and status badges | P0 | PRD | Filters work correctly; teaching load calculated from approved hours |
| FR-TUT-004 | Tutor record editing | Update tutor records including billable rate changes (admin only) | P0 | PRD | Edits saved; billable rate changes logged in audit trail |
| FR-TUT-005 | Tutor billing data export | Export billing-ready hours data per tutor with approved hours mapped to billable rates | P1 | CB, PRD | Export produces accurate billing summary with hours × rate calculations |
| FR-TUT-006 | Tutor active/inactive toggle | Deactivate tutors who are no longer teaching without deleting historical data | P1 | PRD | Inactive tutors hidden from assignment dropdowns; historical data preserved |

---

## 2. FUNCTIONAL REQUIREMENTS — Postings Management

| Req ID | Requirement | Description | Priority | Source | Acceptance Criteria |
|---|---|---|---|---|---|
| FR-PST-001 | Create posting | Create postings with: student assignment, department, academic cycle, start date, end date, primary tutor, status | P0 | PRD | Posting created with all fields; appears on calendar and table views |
| FR-PST-002 | Posting status lifecycle | Track posting status: Scheduled → Active → Completed → Cancelled | P0 | PRD | Status transitions enforced; automated status change on start/end dates |
| FR-PST-003 | Assign multiple tutors to posting | Link multiple tutors to a single posting via junction table with role labels (primary supervisor, ad hoc) | P0 | PRD | Multiple tutors assigned; roles visible on posting detail page |
| FR-PST-004 | Posting list views | Display postings in both calendar view and table view; filter by department, discipline, date range, status | P0 | PRD | Both views render correctly; filters reduce results accurately |
| FR-PST-005 | Posting detail view | View posting with: student info, assigned tutors, teaching sessions, survey status, posting timeline | P0 | PRD | All related data displayed; survey completion status visible |
| FR-PST-006 | Edit posting | Update posting dates, tutor assignments, department (admin only) | P0 | PRD | Changes saved; audit trail captures before/after; linked sessions unaffected |

---

## 3. FUNCTIONAL REQUIREMENTS — Teaching Hours Tracking

| Req ID | Requirement | Description | Priority | Source | Acceptance Criteria |
|---|---|---|---|---|---|
| FR-TH-001 | Log teaching session | Tutors log sessions with: date, time, duration (minutes), session type (scheduled/ad hoc/consultation), linked students, department, description | P0 | CB, PRD | Session created with all fields; duration stored as INTEGER minutes |
| FR-TH-002 | Bulk session creation | Create multiple recurring scheduled sessions in one action | P0 | PRD | Multiple sessions created matching recurrence pattern; each individually editable |
| FR-TH-003 | Save session as draft | Tutors can save incomplete session entries as drafts before submission | P0 | PRD | Draft saved; retrievable from "My Sessions" list; editable before submission |
| FR-TH-004 | Submit session for approval | Tutor submits session entry, changing status from draft to submitted | P0 | PRD | Status changes to "submitted"; notification sent to supervisor |
| FR-TH-005 | Multi-level approval workflow | Approval chain: Tutor submits → Supervisor reviews → Admin approves. Each step changes session status | P0 | CB, PRD | Status progresses through workflow; each approval logged with approver ID and timestamp |
| FR-TH-006 | Reject session with reason | Supervisor or admin can reject a submitted session with mandatory reason text | P0 | PRD | Status changes to "rejected"; reason stored; tutor notified with reason |
| FR-TH-007 | Flag session as anomalous | Admin can flag sessions for review (duplicate detection, unusually high hours, outside posting period) | P0 | CB, PRD | Flagged sessions visually distinguished; appear in flagged items dashboard |
| FR-TH-008 | Automated anomaly detection | System automatically flags: duplicate sessions (same tutor + date + time), unusually high hours (configurable threshold), sessions outside posting period dates | P0 | CB, PRD | Auto-flags triggered correctly based on rules; flagged sessions require manual review |
| FR-TH-009 | Student-side hour confirmation | Students can optionally view and confirm their attendance at logged sessions | P1 | PRD | Student confirmation status visible on session detail; optional — not blocking |
| FR-TH-010 | Map hours to billable rates | Approved hours automatically mapped to tutor's billable rate for compensation calculation | P1 | CB, PRD | Billable hours = approved session minutes ÷ 60 × billable rate; calculation verified |
| FR-TH-011 | Teaching hours dashboard | Real-time dashboard showing approved, pending, and flagged hours by tutor, department, and discipline | P0 | CB, PRD | Dashboard data matches database aggregations; filters work correctly |
| FR-TH-012 | My Sessions view (Tutor) | Personal list of sessions with status tags (draft/submitted/approved/rejected) and hours summary | P0 | PRD | Tutor sees only own sessions; totals match sum of individual sessions |
| FR-TH-013 | Sessions admin view | All sessions across tutors; filter by status, department, tutor; bulk approve functionality; anomaly flag badges | P0 | PRD | Admin sees all sessions; bulk approve changes status for selected items |
| FR-TH-014 | Session detail view | Full session info with approval history, student list, and audit trail | P0 | PRD | Complete history displayed; audit trail shows all status changes |
| FR-TH-015 | Teaching hours bar charts | Bar charts showing hours by tutor/department; filterable by date/discipline; exportable | P0 | PRD | Charts render correctly; data matches underlying records; export produces image/PDF |
| FR-TH-016 | Export teaching hours summary | Export hours summary for billing and payroll in Excel/CSV format | P1 | CB, PRD | Export contains all approved hours with tutor, department, dates, billable amounts |

---

## 4. FUNCTIONAL REQUIREMENTS — Configurable Survey & Feedback Engine

| Req ID | Requirement | Description | Priority | Source | Acceptance Criteria |
|---|---|---|---|---|---|
| FR-SV-001 | Survey template builder | Create survey templates configurable by discipline, posting type, semester, or academic cycle | P0 | CB, PRD | Template created with all configuration options; saved and retrievable |
| FR-SV-002 | Question types support | Support question types: rating (Likert scale), free text, and multi-choice | P0 | PRD | All three question types render correctly in survey form; responses captured accurately |
| FR-SV-003 | 5-point Likert scoring matrix | Standard scoring matrix based out of 5 as required by challenge brief | P0 | CB | Rating questions display 1–5 scale; scores stored correctly |
| FR-SV-004 | Drag-and-drop question builder | Drag-and-drop interface for ordering and managing questions within templates | P1 | PRD | Questions reorderable via drag; order persisted on save |
| FR-SV-005 | Low-score threshold configuration | Set configurable threshold (default < 3/5) below which compulsory text comment is required | P0 | CB, PRD | Text field appears when rating ≤ threshold; submission blocked if text field empty |
| FR-SV-006 | Low-score auto-flagging | Auto-flag low-score submissions to programme admin and supervisor for follow-up | P0 | CB, PRD | Flagged submissions appear in admin dashboard; notification sent to relevant users |
| FR-SV-007 | Batched/consolidated surveys | Group multiple tutor interactions into a single daily or weekly survey per student (eliminating per-interaction fatigue) | P0 | CB, PRD | Student receives one consolidated survey covering all interactions in the batch period |
| FR-SV-008 | Configurable survey cadence | Support per-posting, midpoint check-in, and end-of-posting survey dispatch schedules | P0 | CB, PRD | Surveys dispatched at configured cadence; correct students and tutors linked |
| FR-SV-009 | Midpoint feedback form | Structured qualitative check-in form dispatched at posting midpoint | P1 | PRD | Midpoint survey dispatched halfway through posting period; distinct from end-of-posting |
| FR-SV-010 | Automated survey reminders | Configurable reminder intervals for incomplete survey submissions | P0 | CB, PRD | Reminders sent at configured intervals; stop after submission; escalation after threshold |
| FR-SV-011 | Survey submission by student | Clean form with progress bar, Likert scale ratings, conditional text fields on low scores, submit confirmation | P0 | PRD | Student completes and submits; responses stored with timestamp; status changes to "submitted" |
| FR-SV-012 | Pending surveys view (Student) | Student sees list of pending surveys with due dates and progress indicator | P0 | PRD | Only pending/incomplete surveys shown; progress accurate; one-click to start |
| FR-SV-013 | Real-time submission rate monitoring | Monitor submission rates by cohort, posting, and discipline in real-time | P0 | CB, PRD | Dashboard shows completion percentages; updates as submissions arrive |
| FR-SV-014 | Positive/negative feedback categorisation | Tools to filter and categorise feedback as positive or negative | P1 | CB, PRD | Feedback tagged by sentiment; filterable in admin view |
| FR-SV-015 | Feedback admin view | Completion rate progress bars by cohort, flagged submissions list, feedback comment browser with sentiment filter | P0 | PRD | Admin sees all feedback data; filters work; flagged items highlighted |
| FR-SV-016 | Feedback summary (Tutor) | Personal view of aggregated scores, comment excerpts, and trend over time for each tutor | P0 | PRD | Tutor sees own feedback only; scores aggregated correctly; trend chart renders |
| FR-SV-017 | Customisable feedback reports | Generate customisable reports for supervisors, tutors, institutions for awards or appraisal | P1 | CB | Reports filterable by tutor/institution/period; exportable to PDF/Excel |
| FR-SV-018 | Survey template clone/deactivate | Clone existing templates; deactivate templates no longer in use | P1 | PRD | Cloned template is independent copy; deactivated template hidden from dispatch |

---

## 5. FUNCTIONAL REQUIREMENTS — Reporting & Analytics

| Req ID | Requirement | Description | Priority | Source | Acceptance Criteria |
|---|---|---|---|---|---|
| FR-RPT-001 | Role-specific dashboards | Different dashboard views for Admin (KPI cards, pending items, activity feed), HOD (cross-discipline heatmap, trends), Tutor (my hours, my feedback), Student (my posting, my surveys) | P0 | CB, PRD | Each role sees appropriate dashboard; data scoped to role permissions |
| FR-RPT-002 | Dashboard drill-down | Click any aggregate metric to see individual-level detail | P0 | PRD | Clicking KPI navigates to filtered detail view; data matches aggregate |
| FR-RPT-003 | Faculty Appraisal report | Pre-built report template aggregating teaching hours, feedback scores, and student outcomes per tutor | P0 | CB, PRD | Report generates correctly; data verified against source records |
| FR-RPT-004 | Tutor Billing report | Pre-built report with approved hours × billable rates per tutor for compensation processing | P0 | CB, PRD | Billing totals match approved hours × rates; exportable to Excel |
| FR-RPT-005 | Teaching Award Nominations report | Pre-built report surfacing tutors with high positive feedback for award consideration | P1 | CB, PRD | Report filters by positive feedback threshold; includes supporting data |
| FR-RPT-006 | Programme Quality Review report | Pre-built report covering feedback trends, completion rates, and quality indicators across programmes | P1 | PRD | Report spans multiple programmes; comparative data accurate |
| FR-RPT-007 | Accreditation report | Pre-built report summarising compliance data, teaching hours, and feedback for accreditation review | P1 | CB, PRD | Report meets accreditation data requirements; exportable |
| FR-RPT-008 | Custom report builder | Admin selects fields, applies filters (date range, discipline, department), previews results, generates and downloads | P1 | PRD | Builder produces correct results; preview matches final export |
| FR-RPT-009 | Report export formats | Export reports in PDF, Excel (.xlsx), and CSV formats | P0 | CB, PRD | All three formats produce valid, readable files with correct data |
| FR-RPT-010 | Scheduled report delivery | Auto-generate and email reports on configurable schedule to specified recipients | P1 | PRD | Reports generated and emailed on schedule; recipients receive correct reports |
| FR-RPT-011 | Comparative analytics | Semester-on-semester, year-on-year teaching quality trend analysis | P2 | PRD | Trend charts show data across multiple periods; comparison calculations correct |
| FR-RPT-012 | Reports Centre | List of available report templates with generate + download buttons and recent exports history | P0 | PRD | All report types listed; generation triggers async job; download available on completion |
| FR-RPT-013 | Report generation target < 1 minute | All pre-built reports generate end-to-end in under 60 seconds | P0 | CB | Timing measured; P95 report generation < 60 seconds |

---

## 6. FUNCTIONAL REQUIREMENTS — Notifications & Alerts

| Req ID | Requirement | Description | Priority | Source | Acceptance Criteria |
|---|---|---|---|---|---|
| FR-NTF-001 | In-app notification centre | Full notification list with filter (unread, type, date), mark all read, click-through to relevant record | P0 | CB, PRD | Notifications render with correct type/date; click navigates to source record |
| FR-NTF-002 | Email notifications (configurable) | Email alerts for: pending feedback, approval required, low scores flagged, upcoming deadlines | P1 | CB, PRD | Emails sent via AWS SES; content accurate; configurable per user preference |
| FR-NTF-003 | Push reminders for surveys | Reminder notifications for students with incomplete survey submissions | P0 | CB, PRD | Reminders delivered at configured intervals; cease after submission |
| FR-NTF-004 | Escalation alerts | If feedback overdue past configurable threshold, escalate notification to supervisor | P1 | PRD | Escalation triggered after threshold; supervisor receives notification |
| FR-NTF-005 | Admin broadcast | Send announcements to student or tutor groups | P1 | PRD | Broadcast reaches all members of selected group; appears in their notification centre |
| FR-NTF-006 | Notification badge count | Header bar shows unread notification count badge | P0 | PRD | Badge count matches unread notifications; updates in real-time |

---

## 7. FUNCTIONAL REQUIREMENTS — Role-Based Access Control (RBAC)

| Req ID | Requirement | Description | Priority | Source | Acceptance Criteria |
|---|---|---|---|---|---|
| FR-RBAC-001 | Five core roles | System supports: Super Admin, Programme Admin, Supervisor, Tutor/Clinician, Student | P0 | CB, PRD | All five roles creatable; each has distinct default permissions |
| FR-RBAC-002 | Customisable permission sets | Super admin can modify default permissions per role | P1 | CB, PRD | Permissions editable via RBAC Configuration screen; changes effective immediately |
| FR-RBAC-003 | Approval hierarchy configuration | Define who approves what within each workflow (teaching hours, reports, etc.) | P1 | CB, PRD | Approval chains configurable; workflow respects configured hierarchy |
| FR-RBAC-004 | Discipline-scoped access | Programme admins see only their assigned discipline by default | P0 | CB, PRD | Data filtered by discipline; admin cannot access other discipline data |
| FR-RBAC-005 | Cross-discipline view | Department heads and above see data across all disciplines | P0 | PRD | HOD and Super Admin see all disciplines; dashboards show cross-discipline data |
| FR-RBAC-006 | Time-limited guest access | Temporary access for visiting educators or external accreditors with expiry | P2 | PRD | Guest account created with expiry date; access revoked automatically after expiry |
| FR-RBAC-007 | Role-based navigation | Sidebar menu items shown/hidden based on authenticated user role | P0 | PRD | Each role sees only permitted menu items; direct URL access blocked for unauthorized routes |
| FR-RBAC-008 | RBAC permission matrix editor | Visual editor for super admin to view and modify role-permission matrix | P1 | PRD | Matrix displays all roles × permissions; toggles work; changes persist |

---

## 8. FUNCTIONAL REQUIREMENTS — Audit Trail

| Req ID | Requirement | Description | Priority | Source | Acceptance Criteria |
|---|---|---|---|---|---|
| FR-AUD-001 | Immutable audit log | Log all create, update, delete, and approve actions with: actor (user ID + role), action type, timestamp, affected record, before/after values | P0 | CB, PRD | Every data mutation creates audit entry; entries cannot be modified or deleted |
| FR-AUD-002 | Filterable audit log viewer | Admin can search and filter audit log by actor, action type, resource type, date range | P0 | PRD | Filters reduce results correctly; search returns matching entries |
| FR-AUD-003 | Exportable audit log | Export audit log for compliance, PDPA audit, or accreditation review | P1 | CB, PRD | Export produces complete, accurate audit data in CSV/Excel format |
| FR-AUD-004 | Configurable retention policy | Audit log retention configurable; default 7 years per PDPA requirements | P1 | PRD | Retention policy enforced; data older than policy auto-archived or purged |
| FR-AUD-005 | IP address capture | Capture client IP address for each audit log entry | P1 | PRD | IP address stored with each entry; available in exported logs |

---

## 9. FUNCTIONAL REQUIREMENTS — Batch Import / Data Management

| Req ID | Requirement | Description | Priority | Source | Acceptance Criteria |
|---|---|---|---|---|---|
| FR-IMP-001 | Excel (.xlsx) and CSV import | Upload Excel and CSV files for student and tutor batch creation | P0 | CB, PRD | Both file formats accepted; data parsed correctly regardless of format |
| FR-IMP-002 | Field mapping interface | Map import file columns to ClinEdOps system fields via drag-drop or dropdown interface | P0 | PRD | All system fields available for mapping; unmapped columns skipped |
| FR-IMP-003 | Pre-import validation | Check for duplicates, missing required fields, and format errors before committing import | P0 | CB, PRD | Validation report shows all errors and warnings; user can review before proceeding |
| FR-IMP-004 | Import preview with error highlighting | Show preview table with row-level error highlighting (red rows = errors, yellow = warnings) | P0 | PRD | Errors visually highlighted; user can correct or skip problematic rows |
| FR-IMP-005 | Import history log | Track who imported what, when, file name, record count, and error count | P1 | PRD | History shows all past imports with metadata; viewable by admin |
| FR-IMP-006 | FormSG webhook ingestion | Accept FormSG form submission data via webhook for real-time data ingestion | P2 | PRD | Webhook endpoint receives and processes FormSG payloads; data appears in system |
| FR-IMP-007 | Duplicate detection on import | Detect and flag duplicate records based on student code or staff code during import | P0 | CB, PRD | Duplicates flagged in preview; user can choose to skip or update existing |

---

## 10. FUNCTIONAL REQUIREMENTS — Authentication & User Management

| Req ID | Requirement | Description | Priority | Source | Acceptance Criteria |
|---|---|---|---|---|---|
| FR-AUTH-001 | Email + password login | Login with email and password; returns access + refresh tokens | P0 | PRD | Valid credentials return tokens; invalid credentials show error message |
| FR-AUTH-002 | JWT RS256 authentication | Asymmetric JWT signing with RS256; private key in AWS Secrets Manager | P0 | PRD | Tokens verified with public key; tampered tokens rejected |
| FR-AUTH-003 | Access token (15-min TTL) | Short-lived access tokens stored in memory (not localStorage) | P0 | PRD | Token expires after 15 minutes; refresh flow triggered automatically |
| FR-AUTH-004 | Refresh token (7-day TTL) | HTTP-only secure cookie; server-side rotation on use | P0 | PRD | Refresh produces new access token; old refresh token invalidated |
| FR-AUTH-005 | Forgot password flow | Send password reset email with time-limited token; reset password via link | P1 | PRD | Email sent within 30 seconds; reset link expires after configured time |
| FR-AUTH-006 | First login onboarding | Forced password change + profile completion on first login | P1 | PRD | New users must change password and complete profile before accessing platform |
| FR-AUTH-007 | User management (Super Admin) | List all users; create/edit/deactivate accounts; assign roles | P0 | PRD | CRUD operations work; role changes effective immediately |
| FR-AUTH-008 | Session logout | Invalidate refresh token on logout | P0 | PRD | Logout clears tokens; subsequent API calls rejected |
| FR-AUTH-009 | Access logs | Log all login attempts (success/failure) with timestamps | P1 | CB | Login events recorded; viewable in audit log |

---

## 11. FUNCTIONAL REQUIREMENTS — Academic Cycle & Department Management

| Req ID | Requirement | Description | Priority | Source | Acceptance Criteria |
|---|---|---|---|---|---|
| FR-ACY-001 | Academic cycle management | Create/manage academic cycles (e.g., AY2025/26 Sem 1) with start date, end date, active status | P0 | PRD | Cycles created with date ranges; only one cycle active per discipline at a time |
| FR-ACY-002 | Activate/close cycles | Admin can activate and close academic cycles; closing triggers end-of-cycle workflows | P0 | PRD | Activation/closure enforced; downstream data (postings, surveys) respect cycle boundaries |
| FR-ACY-003 | Department management | Add/edit departments with: name, division, discipline, head (FK to user) | P0 | PRD | Departments created; head assigned; department available in posting creation |
| FR-ACY-004 | Assign department heads | Link department heads to departments for cross-discipline oversight | P1 | PRD | Department head sees their department data in dashboard |

---

## 12. FUNCTIONAL REQUIREMENTS — System Integrations

| Req ID | Requirement | Description | Priority | Source | Acceptance Criteria |
|---|---|---|---|---|---|
| FR-INT-001 | NUHS Jobplan Portal integration | Sync tutor schedules and job plan hours into ClinEdOps via REST API / DB sync | P2 | CB, PRD | Tutor schedule data flows into ClinEdOps; data matches source system |
| FR-INT-002 | NUS BLUE System integration | Import student records, academic calendar, and posting schedules via REST API | P2 | CB, PRD | Student data imported; calendar events synced; no duplicate records |
| FR-INT-003 | Teaching Activities System (TAS) integration | Bi-directional sync of teaching activity data via REST API / CSV export | P2 | CB, PRD | Data flows both directions; conflict resolution handled |
| FR-INT-004 | FormSG data ingestion | Import student/tutor data from FormSG via webhook or CSV export | P2 | CB, PRD | FormSG submissions appear in ClinEdOps; data mapped to correct fields |
| FR-INT-005 | AWS SES email integration | Transactional email delivery for notifications, reminders, and report distribution | P1 | PRD | Emails delivered via SES; SPF/DKIM/DMARC authenticated; production volume |
| FR-INT-006 | AWS S3 file storage | Store exports, attachments, and audit logs in S3 with server-side encryption | P1 | PRD | Files stored in ap-southeast-1; SSE-S3 encryption; pre-signed URLs for downloads |
| FR-INT-007 | Integration status dashboard | Admin view showing connection status of BLUE, TAS, Jobplan Portal; sync logs; manual re-sync trigger | P2 | PRD | Status indicators (connected/disconnected); logs show last sync time and result |

---

## 13. FUNCTIONAL REQUIREMENTS — UI / UX

| Req ID | Requirement | Description | Priority | Source | Acceptance Criteria |
|---|---|---|---|---|---|
| FR-UI-001 | Persistent left sidebar navigation | Collapsible sidebar with role-specific menu items | P0 | PRD | Sidebar renders with correct items per role; collapses/expands on toggle |
| FR-UI-002 | Top header bar | Breadcrumbs, notification bell (with badge count), user avatar + dropdown menu | P0 | PRD | All elements render; bell shows count; dropdown has profile/logout options |
| FR-UI-003 | Mobile-responsive layout | Sidebar collapses to bottom tab bar on mobile; full functionality on viewports ≥ 375px | P0 | CB, PRD | All features accessible on iPhone SE viewport; no horizontal scroll |
| FR-UI-004 | NUH branding on login | Login page with NUH branding, email/password fields, forgot password link | P0 | PRD | Login page renders with branding; all elements functional |
| FR-UI-005 | System settings page | Email configuration, notification defaults, PDPA data retention policy settings (Super Admin) | P1 | PRD | Settings editable; changes take effect system-wide |

---

## 14. NON-FUNCTIONAL REQUIREMENTS — Performance

| Req ID | Requirement | Description | Priority | Source | Acceptance Criteria |
|---|---|---|---|---|---|
| NFR-PERF-001 | API response time | P95 < 500ms for standard queries; < 2s for report generation triggers | P0 | PRD | Load test confirms P95 within threshold under expected concurrent load |
| NFR-PERF-002 | Report generation time | < 60 seconds end-to-end for all pre-built report types | P0 | CB, PRD | Stopwatch timing of report generation confirms < 60s for each report type |
| NFR-PERF-003 | Concurrent user support | Support 500+ concurrent users without degradation | P1 | PRD | Load test with 500 simulated users; no errors; response times within NFR-PERF-001 |
| NFR-PERF-004 | Database query optimisation | Proper indexing on frequently queried columns; cursor-based pagination for large datasets | P1 | PRD | EXPLAIN ANALYZE confirms index usage; pagination returns consistent results |
| NFR-PERF-005 | Frontend bundle optimisation | Code splitting, lazy loading for route-level components; initial load < 3 seconds on 4G | P1 | PROP | Lighthouse performance score ≥ 80; LCP < 3s on throttled connection |

---

## 15. NON-FUNCTIONAL REQUIREMENTS — Reliability & Availability

| Req ID | Requirement | Description | Priority | Source | Acceptance Criteria |
|---|---|---|---|---|---|
| NFR-REL-001 | Uptime SLA | 99.5% uptime during business hours (0800–2200 SGT) | P1 | PRD | Uptime monitoring confirms ≥ 99.5% over rolling 30-day period |
| NFR-REL-002 | Database backups | Daily automated PostgreSQL backups; 30-day retention; point-in-time recovery | P1 | PRD | Backup schedule verified; restoration tested successfully from backup |
| NFR-REL-003 | Multi-AZ database deployment | RDS PostgreSQL deployed in Multi-AZ configuration for failover | P1 | PRD | Failover tested; application recovers within RDS failover SLA |
| NFR-REL-004 | Data integrity (transactions) | All multi-step write operations wrapped in database transactions | P0 | PRD | Transaction rollback on failure; no partial writes in database |
| NFR-REL-005 | Error handling and recovery | Graceful error handling across API and frontend; no unhandled exceptions in production | P1 | PROP | Sentry captures all errors; user sees friendly error messages; no data loss |

---

## 16. NON-FUNCTIONAL REQUIREMENTS — Scalability

| Req ID | Requirement | Description | Priority | Source | Acceptance Criteria |
|---|---|---|---|---|---|
| NFR-SCL-001 | Horizontal auto-scaling | ECS Fargate auto-scaling: scale out at 70% CPU; scale in at 30% | P1 | PRD | Auto-scaling triggers tested; new containers spun up within 2 minutes |
| NFR-SCL-002 | Database read replicas | RDS read replica for reporting queries to separate read/write loads | P2 | PRD | Reporting queries routed to read replica; primary database load reduced |
| NFR-SCL-003 | Redis caching | Cache frequently accessed data (dashboard aggregations, user sessions) in Redis | P1 | PRD | Cache hit rate > 80% for dashboard queries; invalidation on data changes |
| NFR-SCL-004 | Multi-tenant-ready architecture | Database schema and RBAC model designed to support multiple institutions post-POC | P2 | CB, PROP | Schema supports institution-level data partitioning without migration |
| NFR-SCL-005 | Stateless API design | No server-side session state; any container can serve any request | P0 | PRD | Request routing round-robin across containers; no session affinity required |

---

## 17. NON-FUNCTIONAL REQUIREMENTS — Security

| Req ID | Requirement | Description | Priority | Source | Acceptance Criteria |
|---|---|---|---|---|---|
| NFR-SEC-001 | HTTPS enforcement | TLS 1.2+ enforced on all endpoints; no HTTP access | P0 | PRD | All connections over HTTPS; HTTP redirects to HTTPS |
| NFR-SEC-002 | Password hashing | bcrypt with cost factor 12 for all password storage | P0 | PRD | Passwords verified as bcrypt hashed in database; plaintext never stored |
| NFR-SEC-003 | SQL injection prevention | All inputs validated with Pydantic; queries via SQLAlchemy ORM (no raw SQL) | P0 | PRD | Penetration test confirms no SQL injection vulnerabilities |
| NFR-SEC-004 | XSS protection | Input sanitisation on frontend and backend; Content-Security-Policy headers | P0 | PRD | Penetration test confirms no XSS vulnerabilities |
| NFR-SEC-005 | AWS WAF | WAF rules on ALB for rate limiting, SQL injection, and XSS protection | P1 | PRD | WAF rules active; malicious requests blocked; legitimate traffic unaffected |
| NFR-SEC-006 | Rate limiting | 1000 req/min per authenticated user; 100 req/min for public endpoints | P1 | PRD | Rate limits enforced; 429 responses returned on breach |
| NFR-SEC-007 | Secrets management | All sensitive config (DB passwords, JWT keys, SES credentials) in AWS Secrets Manager; never in env vars or code | P1 | PRD | No secrets in codebase; Secrets Manager access verified |
| NFR-SEC-008 | S3 bucket security | Private bucket; SSE-S3 encryption; no public access; pre-signed URLs with 15-min expiry | P1 | PRD | Bucket policy blocks public access; pre-signed URLs expire correctly |
| NFR-SEC-009 | Database encryption in transit | All database connections via SSL/TLS; RDS in private subnet | P1 | PRD | Connection string uses SSL; RDS has no public endpoint |
| NFR-SEC-010 | Input validation | All API inputs validated server-side with Pydantic schemas; reject malformed requests | P0 | PRD | Invalid requests return 422 with validation error details |
| NFR-SEC-011 | Penetration testing | Third-party penetration test before production launch | P1 | PROP | Pentest completed; all critical/high findings remediated |
| NFR-SEC-012 | Vulnerability scanning | Automated dependency and container image vulnerability scanning in CI/CD | P1 | PROP | Scanning runs on every PR; critical vulnerabilities block deployment |

---

## 18. NON-FUNCTIONAL REQUIREMENTS — PDPA Compliance & Data Privacy

| Req ID | Requirement | Description | Priority | Source | Acceptance Criteria |
|---|---|---|---|---|---|
| NFR-PDPA-001 | Data residency — Singapore | All data stored exclusively in AWS ap-southeast-1 (Singapore) | P0 | CB, PRD | All AWS resources provisioned in ap-southeast-1; no cross-region data transfer |
| NFR-PDPA-002 | Access log retention | Access logs retained for 7 years (configurable) | P1 | PRD | Logs retained per policy; configurable by super admin; auto-archival working |
| NFR-PDPA-003 | Data export on request | Student/tutor data export available on request via admin function | P1 | PRD | Admin can export individual's data in machine-readable format |
| NFR-PDPA-004 | Data deletion workflow | Soft delete for departed staff/students; configurable hard delete schedule | P1 | PRD | Soft delete removes from active views; hard delete runs on schedule; data unrecoverable after hard delete |
| NFR-PDPA-005 | Privacy notice at first login | Privacy notice presented and acknowledged at first login | P1 | PRD | Notice displayed; user must acknowledge before proceeding; acknowledgement logged |
| NFR-PDPA-006 | NUH as primary data owner | NUH retains ownership of all data; access controls enforce NUH governance | P0 | CB | Platform confirms NUH as data owner; no data shared without NUH authorisation |

---

## 19. NON-FUNCTIONAL REQUIREMENTS — Hosting & Infrastructure

| Req ID | Requirement | Description | Priority | Source | Acceptance Criteria |
|---|---|---|---|---|---|
| NFR-INF-001 | Docker containerisation | All services containerised; Docker Compose for dev; multi-stage builds for production | P0 | PRD | docker-compose up starts all services; production images < 500MB each |
| NFR-INF-002 | AWS ECS Fargate deployment | Production containers orchestrated via ECS Fargate (serverless) | P1 | PRD | Services running on Fargate; health checks passing; auto-scaling configured |
| NFR-INF-003 | CloudFront CDN | React SPA served via CloudFront for low-latency static asset delivery | P1 | PRD | Static assets served from CDN edge locations; cache hit ratio > 90% |
| NFR-INF-004 | Route 53 DNS | Custom domain configured via Route 53 | P1 | PRD | Domain resolves to CloudFront distribution; SSL certificate valid |
| NFR-INF-005 | Infrastructure-as-Code | AWS CDK or Terraform for reproducible infrastructure provisioning | P1 | PROP | IaC scripts provision full stack; tear-down and re-create produces identical environment |
| NFR-INF-006 | CI/CD pipeline | GitHub Actions for automated test, lint, build, and deploy | P0 | PRD | Pipeline runs on PR; all checks must pass before merge; deploy gate on main branch |
| NFR-INF-007 | Environment separation | Separate staging and production environments | P1 | PROP | Staging mirrors production config; deployments tested in staging before production |

---

## 20. NON-FUNCTIONAL REQUIREMENTS — Observability & Operations

| Req ID | Requirement | Description | Priority | Source | Acceptance Criteria |
|---|---|---|---|---|---|
| NFR-OBS-001 | Application logging | Structured JSON logging for all backend services; log levels (DEBUG, INFO, WARN, ERROR) | P1 | PROP | Logs queryable in CloudWatch; structured format enables filtering |
| NFR-OBS-002 | CloudWatch dashboards | Infrastructure metrics: CPU, memory, request count, error rate, latency | P1 | PROP | Dashboard shows real-time metrics; alarms configured for thresholds |
| NFR-OBS-003 | Sentry error tracking | Frontend and backend error tracking with Sentry SDK | P1 | PRD | Errors captured with stack traces; alerts on new/regression errors |
| NFR-OBS-004 | Uptime monitoring | External uptime checks with alerting on downtime | P1 | PROP | Monitor checks every 1 minute; alert within 5 minutes of downtime |
| NFR-OBS-005 | Operational runbooks / SOPs | Documented procedures for: incident response, deployment, backup/restore, user onboarding, system administration | P1 | PROP | Runbooks cover all critical operations; tested via tabletop exercise |

---

## 21. NON-FUNCTIONAL REQUIREMENTS — Accessibility & Browser Support

| Req ID | Requirement | Description | Priority | Source | Acceptance Criteria |
|---|---|---|---|---|---|
| NFR-ACC-001 | WCAG 2.1 Level AA | Key user-facing screens comply with WCAG 2.1 AA accessibility standards | P1 | PRD | Automated accessibility audit (axe-core) passes on key screens |
| NFR-ACC-002 | Browser support | Chrome 110+, Firefox 110+, Safari 16+, Edge 110+ | P0 | PRD | Core features functional and visually correct on all supported browsers |
| NFR-ACC-003 | Mobile responsive | Full functionality on viewport width ≥ 375px (iPhone SE breakpoint) | P0 | PRD | All features accessible; no broken layouts; touch targets ≥ 44px |
| NFR-ACC-004 | Internationalisation-ready | English only for MVP; architecture must support i18n for future languages | P2 | PRD | All user-facing strings externalized; i18n framework integrated (not translated) |

---

## 22. NON-FUNCTIONAL REQUIREMENTS — Testing & Quality

| Req ID | Requirement | Description | Priority | Source | Acceptance Criteria |
|---|---|---|---|---|---|
| NFR-TST-001 | Backend unit tests | pytest coverage ≥ 80% on services/ and api/ directories | P0 | PRD | Coverage report confirms ≥ 80%; all tests pass |
| NFR-TST-002 | Backend integration tests | API endpoint tests against test database (PostgreSQL in Docker) | P0 | PRD | Integration tests pass with real database; cover all major endpoints |
| NFR-TST-003 | Auth tests | JWT generation/validation, role permission enforcement tests | P0 | PRD | All auth flows tested; unauthorized access correctly rejected |
| NFR-TST-004 | Async task tests | Celery task unit tests with mocked brokers | P1 | PRD | Task execution verified; email dispatch and report generation tested |
| NFR-TST-005 | Frontend unit tests | Vitest + React Testing Library for form components, table components, dashboard widgets | P1 | PRD | Component tests pass; key interactions tested |
| NFR-TST-006 | Frontend integration tests | Form submission flows, role-based rendering, navigation guards | P1 | PRD | Integration tests verify multi-component workflows |
| NFR-TST-007 | End-to-end tests | Playwright or Cypress E2E: login, log session, submit survey, generate report | P1 | PRD | E2E tests pass on staging environment; cover critical user journeys |
| NFR-TST-008 | CI/CD test gates | All PRs: lint (ESLint + Ruff), type check (tsc + mypy), unit tests must pass. Main: full suite including integration | P0 | PRD | Failed checks block merge; zero test failures required for deploy |
| NFR-TST-009 | Load testing | Simulate 500+ concurrent users; validate auto-scaling and response times | P1 | PROP | Load test report confirms NFR-PERF targets met under load |
| NFR-TST-010 | User Acceptance Testing | UAT with NUH Medical Affairs staff across all disciplines | P1 | PROP | UAT sign-off from NUH stakeholders on all critical workflows |

---

## 23. SUCCESS METRICS (Measurable KPIs from Challenge Brief)

| Req ID | Metric | Baseline | Target | Measurement Method | Priority | Source |
|---|---|---|---|---|---|---|
| KPI-001 | Manual data entry / tracking time | Benchmark via user survey | 50% reduction | Pre/post time-motion study comparing task duration | P0 | CB |
| KPI-002 | Data accuracy & completeness | Inconsistent across disciplines | ≥ 90% | Data quality audit: completeness checks on required fields across sample records | P0 | CB |
| KPI-003 | Report generation time | ~5 minutes per report | < 1 minute (80% reduction) | Stopwatch timing of report generation end-to-end | P0 | CB |
| KPI-004 | Survey completion rate | Baseline via audit | ≥ 30% increase | Compare completion rates before/after platform implementation per cohort | P0 | CB |
| KPI-005 | Staff and user satisfaction | Baseline via survey | Measurable improvement | Pre/post satisfaction survey of admins, tutors, clinicians, students | P1 | CB |

---

## 24. OUT OF SCOPE (MVP / POC)

| Req ID | Item | Rationale | Future Phase |
|---|---|---|---|
| OOS-001 | Student grading or summative academic assessment management | Not part of operational clinical education workflow | N/A |
| OOS-002 | Financial payment processing (payment gateway) | Billing data export in scope; actual payment processing is not | Phase B+ |
| OOS-003 | Patient records, clinical EHR, or EMR integration | ClinEdOps is an education operations tool, not a clinical system | N/A |
| OOS-004 | Native iOS / Android mobile app | Mobile-responsive web is in scope; native app is future roadmap | Phase D |
| OOS-005 | Full multi-tenancy rollout to other NUHS institutions | Single-tenant for POC; multi-tenant architecture designed for future | Phase E |
| OOS-006 | Live video or teleconferencing for virtual teaching sessions | Not part of core operations workflow | N/A |
| OOS-007 | SSO (NUH Azure AD / Singpass) integration | Email/password sufficient for POC; SSO as production enhancement | Phase A |
| OOS-008 | AI/ML sentiment analysis on feedback text | ML-ready pipeline designed; actual ML models post-production | Phase C |

---

## Summary Statistics

| Category | Count |
|---|---|
| Functional Requirements (Product Features) | 107 |
| Non-Functional Requirements (Performance) | 5 |
| Non-Functional Requirements (Reliability) | 5 |
| Non-Functional Requirements (Scalability) | 5 |
| Non-Functional Requirements (Security) | 12 |
| Non-Functional Requirements (PDPA / Privacy) | 6 |
| Non-Functional Requirements (Infrastructure) | 7 |
| Non-Functional Requirements (Observability) | 5 |
| Non-Functional Requirements (Accessibility) | 4 |
| Non-Functional Requirements (Testing & Quality) | 10 |
| Success Metrics (KPIs) | 5 |
| Out of Scope Items | 8 |
| **TOTAL** | **179** |

| Priority | Count | Description |
|---|---|---|
| P0 | ~75 | Must-have for MVP/POC demo |
| P1 | ~70 | Must-have for production launch |
| P2 | ~15 | Should-have post-production enhancement |
| P3 | ~5 | Nice-to-have future roadmap |

---

*ClinEdOps Master Requirements List v1.0 — Prepared by SlashLLM for NUH IMDA Challenge Call 28*
