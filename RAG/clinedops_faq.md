# ClinEdOps — Comprehensive FAQ & Knowledge Base

> This document is the primary knowledge source for the ClinEdOps AI Help assistant.
> It is structured so that each section and question can be retrieved independently.
> Keep it up to date when features, roles, or workflows change.

---

## Section 1: What is ClinEdOps?

### Q: What is ClinEdOps?
ClinEdOps (Clinical Education Operations) is a unified digital platform developed for the National University Health System (NUHS) to manage all aspects of undergraduate and postgraduate clinical education. It replaces disconnected spreadsheets and manual processes with a single integrated system.

### Q: What problems does ClinEdOps solve?
ClinEdOps solves several core problems faced by large healthcare institutions running clinical education programs:
- Fragmented data: Teaching hours, student attendance, and feedback lived in separate spreadsheets.
- No real-time oversight: Department heads and supervisors had no live dashboard for student progress.
- Manual approval workflows: Session approvals and survey assignments were handled over email.
- Billing inaccuracy: Tutor payment claims were error-prone due to lack of session verification.
- No student voice: Students lacked a structured, trackable way to submit feedback on their clinical education.

### Q: Who built ClinEdOps and why?
ClinEdOps was built for the NUH Medical Affairs challenge to create an Integrated Digital Platform for Unified Clinical Education Operations. The platform covers teaching hour tracking, student lifecycle management, shadowing, assessments, reporting, and AI-assisted help.

---

## Section 2: User Roles & Access

### Q: What roles exist in ClinEdOps?
ClinEdOps uses strict Role-Based Access Control (RBAC). There are five roles:

1. **Super Admin (SAAS Admin)** — Full system access. Manages roles, system settings, user accounts, and has visibility into all data across all disciplines and departments.
2. **Programme Admin** — Discipline-specific management. Can manage students, tutors, postings, academic cycles, and survey templates for their discipline (e.g., Medicine, Nursing).
3. **Supervisor (Department Head)** — High-level oversight role. Reviews aggregated teaching hours and student progress. Can approve or reject session records for their department.
4. **Tutor (Medical Tutor / Clinician)** — Logs teaching sessions, submits session records for approval, and views their own teaching statistics and student feedback summaries.
5. **Student (Medical Student)** — Views their own posted sessions, confirms attendance, submits clinical feedback surveys, and tracks their education history.

### Q: What can a Super Admin do?
Super Admins have unrestricted access to every part of the platform:
- Create, edit, and deactivate users of any role.
- Configure system-wide Role-Based Access Control (RBAC).
- View all dashboards including strategic feedback and financial billing.
- Send broadcast notifications to all or selected users.
- Access and download all reports.

### Q: What can a Programme Admin do?
Programme Admins manage education operations within their assigned discipline:
- Create and manage student profiles, including bulk CSV import.
- Onboard tutors and manage tutor profiles and billable rates.
- Create and manage academic cycles, departments, and postings.
- Create and assign feedback survey templates.
- View discipline-specific teaching hours reports and dashboards.
- Manually assign surveys to students.

### Q: What can a Supervisor (Department Head) do?
Supervisors have a strategic oversight role:
- View a high-level dashboard of teaching hours and student completion rates.
- Approve or reject session records submitted by tutors.
- View aggregated survey feedback for tutors in their department.
- Access strategic insights and anomaly detection reports.

### Q: What can a Tutor do?
Tutors are clinical educators who interact with students directly:
- Log individual or bulk teaching sessions.
- Submit session records for supervisor approval.
- View a personal dashboard of their teaching hours and billable amounts.
- View anonymized feedback submitted by their students.
- Track their posting assignments and student progress.

### Q: What can a Student do?
Students have a focused, personal view of their clinical education:
- View all teaching sessions they have attended, including the tutor's name and session date.
- Filter and search sessions by tutor name.
- Confirm attendance for sessions.
- View and complete assigned feedback surveys.
- Track pending and completed assessments in a tabbed interface.

### Q: How do I know which role I have?
Your role is assigned by your Programme Admin or Super Admin when your account is created. You can see your role in your **Profile Settings** (top-right avatar → Profile). Role changes must be requested through your administrator.

---

## Section 3: Getting Started & Login

### Q: How do I log in to ClinEdOps?
Navigate to your institution's ClinEdOps URL and enter your registered email address and password. After a successful login, you will be automatically redirected to the dashboard appropriate for your role.

### Q: I forgot my password. What should I do?
Contact your Programme Admin or Super Admin to have your password reset. Self-service password reset may be available depending on your institution's configuration.

### Q: What should I see after logging in for the first time?
After first login:
- **Admins** see the Admin Overview dashboard with system statistics.
- **Supervisors** see the Strategic Oversight (HOD) dashboard.
- **Tutors** see the Tutor dashboard with their teaching summary.
- **Students** see the Student dashboard with pending surveys and session summaries.

---

## Section 4: Teaching Sessions

### Q: How does a tutor log a teaching session?
Tutors can log a session from the **Teaching Sessions** section in the sidebar:
1. Click **"New Session"**.
2. Fill in the date, start time, duration, session type, discipline, and linked students.
3. Save as a **Draft** or directly **Submit** for approval.

### Q: What is the difference between Draft and Submitted sessions?
- **Draft**: The session is saved but not yet submitted for review. The tutor can still edit it.
- **Submitted**: The session record is locked and sent to the Supervisor queue for approval.

### Q: How does a supervisor approve a session?
Supervisors see a queue of submitted sessions in their dashboard. They can:
1. Click **"Approve"** to confirm the session is accurate and billable.
2. Click **"Reject"** with a reason, which returns the session to the tutor for correction.

### Q: What is the status "Pending Review"?
Sessions seeded as demo data or submitted via bulk upload may have the status `pending_review`. These are treated the same as `submitted` and will appear in the Supervisor's approval queue.

### Q: Can a tutor log multiple sessions at once?
Yes. Tutors can use the **Bulk Session Upload** feature to log several sessions at once by filling in a structured form or importing a file.

### Q: As a student, how do I view my sessions?
Students can go to **My Sessions** in the sidebar. The table shows:
- Date and time of the session.
- **Tutor Name** and Tutor Code (e.g., Dr. Aisha Tan — TUT-001).
- Duration, discipline, and session status.
You can filter sessions by tutor name using the search icon in the Tutor column header.

### Q: Can students confirm attendance?
Yes. Students see a **"Confirm Attendance"** button for sessions they were enrolled in. This must be done within the confirmation window specified by the administrator.

---

## Section 5: Surveys & Feedback Assessments

### Q: What are surveys in ClinEdOps?
Surveys are structured feedback forms assigned to students after clinical interactions. They are used to evaluate the quality of teaching and are a mandatory component of a student's posting requirements.

### Q: How are surveys assigned to students?
Surveys can be assigned in two ways:
1. **Automatic (Batch)**: The system automatically creates survey assignments weekly by grouping approved teaching sessions by student and posting.
2. **Manual**: Programme Admins or Super Admins can manually assign a specific survey template to one or more students from the Admin panel.

### Q: Where do I find my pending surveys as a student?
Go to **Clinical Assessments** (or Surveys → Pending) in the sidebar. You will see two tabs:
- **Pending Tasks**: Surveys you need to complete. Click **"Start Survey"** to begin.
- **Completed**: Surveys you have successfully submitted.

### Q: What happens after I submit a survey?
After clicking **"Submit Assessment"**:
1. Your responses are recorded against the teaching session and tutor.
2. The assignment status changes to **Completed** and the survey moves to your **Completed** tab.
3. Aggregated (anonymized) feedback is made available to the relevant Tutor and Supervisors.

### Q: What is a "low score alert"?
When a student rates a question at or below the configured Low Score Threshold (default: 3 out of 5), the system requires a mandatory written comment and flags the submission for review. Supervisors receive an escalation alert.

### Q: Can I view a survey I already submitted?
Yes. Completed surveys appear in the **Completed** tab on the Clinical Assessments page. You can see the status but cannot re-edit a submitted response.

---

## Section 6: Student Lifecycle & Postings

### Q: What is a "Posting" in ClinEdOps?
A posting is a rotation or placement of a student in a specific department for a defined period. For example, a medical student may be posted to the Cardiology department for 6 weeks. Postings determine which tutors, sessions, and surveys are relevant to a student.

### Q: How are students added to the system?
Students can be added in two ways:
1. **Manually**: Admins create an individual student profile via the Students form.
2. **Bulk Import**: Admins upload a CSV file with student data. The system validates and imports all valid rows, reporting any errors.

### Q: What is the student lifecycle status?
Each student has a lifecycle status:
- **Pending Onboarding**: Account created, but posting not yet active.
- **Active Posting**: Student is currently in an active clinical rotation.
- **Completed**: Student has finished their rotation requirements.
- **Offboarded**: Student has left the program.

---

## Section 7: Shadowing Applications

### Q: What is the shadowing feature?
The Shadowing module allows students to apply to shadow senior clinicians (Mentors) outside of their formal posting. Students submit an application, which is reviewed and approved by an administrator, who then assigns a Mentor.

### Q: How does a student apply for shadowing?
Students go to **Shadowing** in the sidebar, click **"Apply for Shadowing"**, fill in their area of interest and availability, and submit the application.

### Q: How are shadowing mentors assigned?
After a student's application is submitted, a Programme Admin or Super Admin reviews it. In the application detail view, they can select a Tutor from a dropdown (which shows the tutor's name and code) to assign as the student's mentor.

---

## Section 8: Reports & Analytics

### Q: What kinds of reports are available?
ClinEdOps offers several types of reports:
- **Teaching Hours Summary**: Breakdown of teaching hours by tutor, department, or discipline.
- **Billing Hours**: Detailed report for financial reconciliation of tutor payments.
- **Survey Completion Rates**: How many students have completed their assigned surveys.
- **Strategic Feedback Dashboard**: Aggregated tutor feedback scores and trends for supervisors and admins.
- **Anomaly Detection**: Flags unusual patterns like duplicate sessions or hours that exceed daily limits.

### Q: How do I export a report?
From the **Reports** section, select the report type, apply any date or discipline filters, and click **"Export"**. Reports are downloaded as Excel (.xlsx) files.

---

## Section 9: Notifications

### Q: What notifications does ClinEdOps send?
The system sends in-app and (if configured) email notifications for:
- New pending surveys assigned to a student.
- Teaching session approved or rejected (for tutors).
- Low score alert escalation (for supervisors).
- Upcoming survey deadlines.
- Broadcast announcements from administrators.

### Q: How do I manage my notification preferences?
Go to **Settings → Notification Settings** to toggle which types of notifications you receive.

---

## Section 10: Profile & Settings

### Q: How do I update my profile photo and name?
Click on your avatar or name in the **top-right corner** of any page, then select **"Profile Settings"** (or navigate to Settings → Profile). You can:
- Upload a new profile photo directly from the browser.
- Update your display name and title.
Changes are saved immediately and visible across the platform.

### Q: Why is my profile photo not persisting after logout?
Profile data including photos are stored in the backend database. If you uploaded a photo and it disappears after login, it may mean the backend was not configured for file storage (S3 or local). Contact your System Administrator to verify the upload configuration (`s3_bucket` and AWS credentials in backend settings).

---

## Section 11: AI Help

### Q: What is the AI Help feature?
AI Help is a built-in intelligent assistant powered by Groq (Llama-3.3-70b-versatile) and a local Retrieval-Augmented Generation (RAG) pipeline. It answers questions about the ClinEdOps platform, workflows, and any custom documentation added to the knowledge base.

### Q: What sources does AI Help use to answer questions?
AI Help only answers from documents placed in the `RAG/` folder at the project root. This folder is processed at system build time. It does NOT have access to the internet or to live database records.

### Q: How do I add new context for the AI Help to know about?
1. Create a `.md` (Markdown) or `.pdf` file with the information you want the AI to know.
2. Place the file in the `RAG/` folder in the project root.
3. Rebuild the RAG index by running: `cd backend && python -m app.scripts.build_rag_index`
4. Restart the backend service: `docker compose restart backend`

### Q: Why is the AI saying it does not have information about something?
The AI strictly answers from its indexed knowledge base. If a topic is not covered in the documents in the `RAG/` folder, the assistant will say it does not have that information. Add a relevant document to `RAG/` and rebuild the index to fix this.

### Q: Is the AI Help storing my conversations?
No. AI Help conversations are not persisted anywhere. Each session starts fresh. The AI has no memory of previous conversations.

---

## Section 12: Troubleshooting Common Issues

### Q: The page is showing a blank white screen. What do I do?
This is usually a JavaScript runtime error. Open your browser's Developer Console (F12 → Console tab) and look for a red error message. Common causes:
- A missing import in the frontend code (contact your developer).
- An API server that is unreachable (check that the backend is running).

### Q: I am getting a "500 Internal Server Error" when submitting a form.
A 500 error means the backend encountered an unexpected issue. Check the backend logs (`docker compose logs backend`) for the full error traceback. Common causes include database constraint violations or missing configuration.

### Q: The survey submission is failing with a foreign key error.
This was a known issue where the student's User ID was incorrectly sent as the Student ID. Ensure you are running the latest version of the backend, which resolves this by automatically looking up the correct Student profile for the logged-in user.

### Q: Sessions are showing a tutor ID (like `0127f69b...`) instead of a name.
This was a known UI issue in older versions. The current version displays the full tutor name (e.g., Dr. Aisha Tan) and tutor code in the My Sessions table.
