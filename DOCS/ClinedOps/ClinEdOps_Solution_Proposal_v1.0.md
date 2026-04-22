# Solution Proposal

## Enabling Unified Clinical Education Operations Through an Integrated Digital Platform

**IMDA Open Innovation Platform — Call 28, March 2026**

**Challenge Owner:** National University Hospital (NUH) — Medical Affairs (Education)

---

**Submitted by:** SlashLLM

**Date:** April 2026

**Document Version:** 1.0 — First Draft

**Contact:** Mridhul Pax, CEO & Chief Architect

---

## Executive Summary

NUH's Medical Affairs (Education) department coordinates clinical education across four disciplines — Medicine, Allied Health, Nursing, and Training Programmes — serving hundreds of students from partner institutions including NUS, SIT, Singapore Polytechnic, and PSB Academy each academic cycle. Today, this coordination relies on a patchwork of Excel spreadsheets, FormSG submissions, email threads, and disconnected systems. The result is duplicated effort, inconsistent data, delayed reporting, and administrative teams spending days on tasks that should take minutes.

**ClinEdOps** is our answer to this challenge: a unified, web-based platform purpose-built for NUH's clinical education operations. It replaces fragmented manual processes with a single source of truth for student and tutor lifecycle management, teaching hour tracking with multi-level approval, configurable survey and feedback collection, real-time dashboards, and automated report generation — all governed by role-based access control and a full audit trail.

What sets our proposal apart is that **ClinEdOps is not a concept — it is already built and fully demoable.** Our working prototype covers all nine core modules specified in the challenge brief, runs on a modern React + FastAPI + PostgreSQL stack, and is fully architected for production deployment on AWS Singapore (ap-southeast-1) — with all infrastructure design, security posture, and scaling strategies mapped out and ready for deployment. We have moved from problem understanding to a functional product in weeks, not months, demonstrating the speed, technical depth, and execution capability that SlashLLM brings to every engagement.

Our platform directly addresses every pain point identified in the challenge brief: from eliminating manual data consolidation and inaccurate teaching hour records, to solving survey fatigue through intelligent batched feedback collection, to delivering one-click report generation that reduces a five-minute manual process to under one minute. The architecture is designed to scale — from a single-institution POC to a multi-institution deployment across the NUHS network — without requiring heavy custom coding.

---

## 1. Understanding the Problem

### 1.1 The Challenge

NUH's Medical Affairs (Education) department faces a fundamental operational challenge: as clinical education has grown in scale and complexity across Medicine, Allied Health, Nursing, and Training programmes, the tools supporting it have not kept pace. Administrative teams are trapped in a cycle of manual data entry, fragmented record-keeping, and time-consuming report generation that limits their ability to scale, maintain data quality, and make timely decisions.

### 1.2 Current Pain Points We Address

**Fragmented student lifecycle management.** There is no integrated system to manage the end-to-end pre-boarding, onboarding, and offboarding process. Administrative staff toggle between Excel trackers, email chains, and FormSG submissions to manage students across disciplines and institutions. Each handoff introduces the risk of data loss, duplication, or inconsistency.

**Disconnected and manual data management.** Teaching and feedback data are stored across multiple unlinked platforms. A programme administrator like Sarah — who coordinates clinical postings for physiotherapy, occupational therapy, and speech therapy students — currently maintains multiple Excel spreadsheets to track students, tutors, and teaching hours. Feedback collected via FormSG must be manually downloaded, filtered, and reformatted into reports. During peak periods, she spends days consolidating data for tutor appraisals and awards.

**Inaccurate tracking of teaching hours.** Teaching hours are manually logged or optionally submitted by students, leading to low compliance and inaccurate records. Dr Aisha, a medical tutor supervising students across different rotations, currently logs hours through a cumbersome multi-screen system. Ad hoc hours must sometimes be submitted separately via email. She has limited visibility into whether her hours have been approved or accurately recorded.

**Inefficient feedback monitoring.** Feedback collection lacks automation and real-time visibility, resulting in missed submissions, compliance gaps, and delayed follow-ups. Administrators must manually track feedback completion and send individual reminders to students.

**Survey overload and fatigue.** Students currently receive a feedback survey for every single tutor interaction in a day, regardless of how many sessions they attend. This per-interaction approach results in survey fatigue and low participation rates, undermining the quality of feedback data that drives tutor appraisals and programme improvement.

**Reporting and analytics bottlenecks.** Bryan, the head of Medical Affairs, needs cross-disciplinary visibility into teaching contributions, feedback trends, and compliance rates to make strategic decisions. Today, he relies on manually compiled reports that may already be outdated by the time they reach his desk. Generating a single faculty appraisal report takes approximately five minutes of manual consolidation.

**Lack of unified oversight.** Data across disciplines is fragmented with no unified cross-discipline view, making it difficult for department heads to obtain a consolidated picture of teaching quality, compliance rates, and programme performance.

### 1.3 Why Previous Approaches Have Not Worked

NUH has trialled several solutions — QR code-based surveys for collecting teaching hours and feedback, Microsoft Power Apps for structured data capture, and upgrades to the NUS BLUE system. However, these approaches were piecemeal enhancements that did not sufficiently streamline and integrate workflows, standardise data, or provide a single, reliable source of truth across disciplines. ClinEdOps is designed from the ground up to be that single source of truth.

---

## 2. Our Solution — ClinEdOps Platform

### 2.1 Solution Overview

ClinEdOps is a unified, web-based SaaS platform that consolidates all clinical education operational workflows into a single, role-aware system. Built on React (frontend) and FastAPI (backend), deployed via Docker on AWS Singapore, it replaces fragmented manual processes with nine integrated modules that cover the full spectrum of NUH's clinical education operations.

The platform serves five distinct user types — Programme Administrators, Medical Tutors/Clinicians, Department Heads, Students, and Super Administrators — each with tailored dashboards, workflows, and permissions that match their operational reality.

### 2.2 Core Modules

**Module 1 — Student & Tutor Lifecycle Management**
A centralised record system for all students and tutors across all four disciplines. Student profiles capture name, institution, discipline, cohort, academic cycle, and current posting status. Tutor profiles include department, specialty, billable rate, and active/inactive status. The system supports assigning students to departments, postings, tutors, and academic cycles with clear status tracking from Pending Onboarding through Active Posting to Completed and Offboarded. Batch upload from Excel (.xlsx) and FormSG exports (CSV/JSON) is supported, with built-in duplicate detection, error highlighting, and anomaly flagging on imports. Historical records are retained for accreditation and audit purposes.

**Module 2 — Teaching Hours Tracking**
A standardised mechanism for tutors to log, submit, and get approval for teaching sessions. Tutors can log both scheduled sessions and ad hoc consultations with date, time, duration, type, linked students, and department. The system supports bulk session creation for recurring scheduled sessions and optional student-side hour confirmation. A multi-level approval workflow — Tutor submits, Supervisor reviews, Admin approves — ensures data integrity. Automated anomaly detection flags duplicate sessions, unusually high hours, and sessions outside posting periods. Approved hours are mapped to tutor billable rates for compensation processing, with a real-time dashboard showing approved, pending, and flagged hours by tutor, department, and discipline.

**Module 3 — Configurable Survey & Feedback Engine**
A flexible survey system that eliminates survey fatigue while ensuring quality data collection. Survey templates are configurable by discipline, posting type, semester, or academic cycle, with a 5-point Likert scoring matrix as standard. Compulsory text fields are auto-triggered when scores fall below a configurable threshold (e.g., < 3/5), and low scores are auto-flagged to the programme admin and supervisor for follow-up. Critically, the system supports batched/consolidated surveys — grouping multiple tutor interactions into a single daily or weekly survey — which directly addresses the survey fatigue problem identified in the challenge brief. Configurable survey cadence supports per-posting, midpoint check-in, and end-of-posting evaluations. Automated reminders at configurable intervals drive completion for incomplete submissions. Real-time submission rate monitoring by cohort, posting, and discipline gives administrators instant visibility into feedback compliance.

**Module 4 — Reporting & Analytics**
A comprehensive reporting engine with real-time dashboards and one-click export. Role-specific dashboards display teaching hours by tutor/department/discipline, survey completion rates, feedback quality indicators, and posting status overview. Drill-down capability allows clicking any aggregate metric to see individual-level detail. Pre-built report templates cover Faculty Appraisal, Tutor Billing, Teaching Award Nominations, Programme Quality Review, and Accreditation Reports. A custom report builder allows administrators to select fields, apply filters, choose date ranges, and generate reports across disciplines and departments. Report generation targets under one minute end-to-end — an 80% reduction from the current five-minute manual process. Export formats include PDF, Excel (.xlsx), and CSV. Scheduled report delivery auto-generates and emails reports on a configurable schedule. Comparative analytics support semester-on-semester and year-on-year teaching quality trend analysis.

**Module 5 — Notifications & Alerts**
An in-app notification centre with read/unread status, supplemented by configurable email notifications for pending feedback, approval requests, low scores flagged, and upcoming deadlines. Push reminders drive completion for incomplete survey submissions. Escalation alerts automatically notify supervisors when feedback is overdue past a configurable threshold. Admin broadcast capability enables sending announcements to student or tutor groups.

**Module 6 — Role-Based Access Control (RBAC)**
Robust governance with five defined roles — Super Admin, Programme Admin, Supervisor, Tutor/Clinician, and Student — each with customisable permission sets. Approval hierarchy configuration defines who approves what within each workflow. Discipline-scoped access ensures programme admins see only their assigned discipline by default, while cross-discipline views are available for department heads and above. Time-limited guest access supports visiting educators or external accreditors.

**Module 7 — Audit Trail**
An immutable audit log of all create, update, delete, and approve actions. Each entry captures the actor (user ID + role), action type, timestamp, affected record, and before/after values. The log is filterable, searchable, and exportable for compliance, PDPA audit, or accreditation review. Retention policy is configurable with a default of seven years.

**Module 8 — Batch Import / Data Management**
Excel (.xlsx) and CSV import for student and tutor data at the start of each academic cycle. A field mapping interface allows mapping import columns to system fields. Pre-import validation checks for duplicates, missing required fields, and format errors. An import preview with row-level error highlighting allows review before committing. Import history logs track who imported what, when, and how many records. FormSG webhook/export ingestion supports real-time form submission data flow.

**Module 9 — System Integrations**
Architecture designed for integration with existing hospital systems including NUHS Jobplan Portal (tutor schedules, job plan hours via REST API / DB sync), NUS BLUE System (student records, academic calendar, posting schedules via REST API), Teaching Activities System / TAS (teaching activity data bi-directional sync via REST API / CSV export), and FormSG (student/tutor data import, form submission ingestion via Webhook / CSV). AWS SES provides outbound email notifications and report delivery, while AWS S3 handles file storage for exports, attachments, and audit logs.

### 2.3 How ClinEdOps Transforms Each User's Experience

**For Sarah (Programme Administrator):** Instead of toggling between Excel spreadsheets, FormSG downloads, and emails to reconcile data, Sarah opens a single dashboard that shows all student postings, tutor assignments, teaching hours, and feedback submissions. Teaching hours logged by tutors are automatically validated with anomaly flags. Feedback data is aggregated and report-ready. She generates customised reports for appraisals, billing, and awards with one click — reducing days of manual consolidation to minutes.

**For Dr Aisha (Medical Tutor):** Through a clean, user-friendly interface, Dr Aisha logs both scheduled and ad hoc sessions within minutes. She sees her accumulated teaching hours in real time and can track approval status at a glance. Feedback summaries are automatically compiled into a dashboard view, allowing her to quickly identify strengths and areas for improvement — without navigating multiple screens or systems.

**For Bryan (Department Head):** The platform gives Bryan cross-disciplinary dashboards and standardised reporting. He gains real-time visibility into teaching hours, feedback completion rates, and quality indicators across all four disciplines. With reliable data at his fingertips, he can make informed decisions about faculty recognition, programme quality improvement, and resource allocation — based on current data, not manually compiled reports that may already be outdated.

**For Students:** Students see a personal dashboard with their active posting, assigned tutors, pending surveys, and feedback completion status. Batched surveys mean they receive one consolidated feedback request per day or per week — not one per tutor interaction — dramatically reducing survey fatigue and increasing participation quality.

---

## 3. Technical Architecture & Innovation

### 3.1 Architecture Overview

ClinEdOps follows a modern three-tier architecture designed for performance, security, and scalability:

**Frontend:** React 18 with TypeScript, using Ant Design (antd) or Shadcn/UI with Tailwind CSS for a professional, accessible interface. React Query (TanStack Query) and Zustand handle server-state caching and lightweight client-state management respectively. React Router v6 provides client-side routing with protected routes and role guards. Recharts or Apache ECharts power the rich, configurable dashboards and analytics visualisations.

**Backend:** FastAPI (Python 3.12) provides an async, high-performance API layer with automatic OpenAPI documentation and native type hints. SQLAlchemy 2.0 with Alembic manages the PostgreSQL 16 relational database with robust ORM capabilities, migrations, and async support via asyncpg. Celery with Redis handles background jobs including report generation, email dispatch, and scheduled reminders.

**Infrastructure:** All services are containerised via Docker and orchestrated with Docker Compose for local development and prototype demonstration. The production architecture has been fully designed and validated for AWS Singapore (ap-southeast-1), targeting AWS ECS Fargate for serverless container orchestration with auto-scaling. The planned production topology includes Route 53 DNS, CloudFront CDN for the React SPA, AWS ALB for API routing with WAF protection, ECS Fargate containers in private subnets, RDS PostgreSQL (Multi-AZ) in private subnets, ElastiCache Redis for Celery broker and caching, and separate Celery worker ECS tasks connecting to AWS SES and S3. AWS deployment is scoped as a defined phase in our development timeline, with all infrastructure-as-code and deployment strategies ready for execution.

### 3.2 Key Technical Decisions and Rationale

| Decision | Rationale |
|---|---|
| React + TypeScript frontend | Component-based SPA architecture with strong ecosystem, type safety for maintainability at scale |
| FastAPI (Python) backend | Async high-performance framework; auto-generated OpenAPI docs; type hints reduce bugs; large talent pool |
| PostgreSQL 16 | Relational integrity critical for complex role/student/tutor/posting relationships; JSONB for flexible survey responses; read replicas for reporting scale |
| JWT RS256 asymmetric auth | Secure stateless authentication with refresh token rotation; 15-min access tokens minimise exposure window |
| Celery + Redis task queue | Decouples long-running operations (report generation, email dispatch) from API response times |
| Docker + ECS Fargate | Reproducible builds; serverless container orchestration eliminates server management; auto-scaling based on demand |
| AWS Singapore (ap-southeast-1) | Mandatory for PDPA compliance and data residency; low-latency access for NUH users |

### 3.3 Innovation Highlights

**Batched Survey Engine — Eliminating Survey Fatigue by Design.** Unlike conventional feedback systems that send a survey per tutor interaction, ClinEdOps groups multiple interactions into consolidated daily or weekly surveys. This is a direct, purpose-built solution to the survey fatigue problem identified in the challenge brief. The configurable cadence system supports per-posting, midpoint, and end-of-posting evaluations — ensuring quality feedback without overwhelming students.

**Automated Anomaly Detection on Teaching Hours.** The system automatically flags duplicate sessions, unusually high reported hours, and sessions logged outside posting periods. This intelligent validation layer catches errors and potential discrepancies before they propagate into billing and appraisal data — replacing a manual verification process that currently has no easy way to ensure accuracy.

**Configurable Without Heavy Custom Coding.** Survey templates, report definitions, RBAC permissions, notification rules, and approval hierarchies are all configurable through the admin interface — not hardcoded. When NUH's operational needs evolve, or when the platform extends to new disciplines or institutions, administrators can adapt workflows without requiring developer intervention. This is a fundamental design principle, not an afterthought.

**One-Click Report Generation Pipeline.** Pre-built report templates for Faculty Appraisal, Tutor Billing, Teaching Award Nominations, Programme Quality Review, and Accreditation are generated asynchronously via Celery workers. The target is under one minute end-to-end for all pre-built report types — compared to the current five-minute manual process — representing an 80% reduction in report generation time.

**Architecture-Ready for Multi-Institution Expansion.** While the POC operates as a single-tenant deployment for NUH, the architecture is designed with multi-tenancy in mind. Database schema, RBAC model, and API design all support the eventual expansion to other NUHS-affiliated institutions (NUH, NTFGH, AH, JCH) without fundamental re-architecture.

### 3.4 Security & Compliance

Security and PDPA compliance are embedded throughout the platform design, not bolted on as an afterthought:

**Authentication & Authorisation:** JWT RS256 asymmetric signing with private key in AWS Secrets Manager. Access tokens with 15-minute TTL stored in memory (not localStorage). Refresh tokens with 7-day TTL via HTTP-only secure cookies with server-side rotation. Every API endpoint decorated with role permission checks via FastAPI dependency injection. RBAC enforced at the service layer — data queries filtered by actor's role and discipline scope.

**Data Security:** All database connections via SSL/TLS with RDS in private subnets (no public endpoint). Passwords hashed with bcrypt (cost factor 12). Sensitive configuration in AWS Secrets Manager — never in environment variables or code. S3 bucket private with server-side encryption (SSE-S3) and pre-signed URLs with 15-minute expiry for downloads. All API inputs validated with Pydantic; SQL injection prevention via SQLAlchemy ORM (no raw SQL). AWS WAF on ALB for rate limiting, SQL injection, and XSS protection.

**PDPA Compliance:** All data stored exclusively in AWS Singapore (ap-southeast-1). Access logs retained for 7 years (configurable). Student/tutor data export available on request via admin function. Data deletion workflow for departed staff/students with soft delete and configurable hard delete schedule. Privacy notice presented at first login.

### 3.5 Performance & Reliability Targets

| Requirement | Target |
|---|---|
| API response time (P95) | < 500ms standard queries; < 2s report triggers |
| Report generation | < 60 seconds end-to-end for all pre-built types |
| Concurrent users | 500+ without degradation |
| Uptime SLA | 99.5% during business hours (0800–2200 SGT) |
| Backup | Daily automated PostgreSQL backups; 30-day retention; point-in-time recovery |
| Horizontal scaling | ECS Fargate auto-scaling: scale out at 70% CPU; scale in at 30% |

---

## 4. Addressing the Success Metrics

The challenge brief defines four key metrics of success. Here is how ClinEdOps delivers on each:

### 4.1 Improved Operation Efficiency — Target: 50% Reduction in Manual Data Entry and Tracking Time

ClinEdOps eliminates the core manual workflows that consume administrative time today. Batch import replaces manual data entry for student and tutor onboarding each academic cycle. Teaching hours are logged directly by tutors through a streamlined interface — not consolidated from emails and spreadsheets by administrators. Feedback is collected, aggregated, and categorised automatically. The single-dashboard approach means administrators no longer toggle between Excel files, CSV downloads, and emails to reconcile data.

### 4.2 Improved Data Accuracy — Target: ≥ 90% Data Accuracy and Completeness

A centralised PostgreSQL database with enforced relational integrity, input validation via Pydantic schemas, and pre-import anomaly detection ensures consistent, high-quality data across all disciplines. Automated anomaly flags on teaching hours catch duplicates, outliers, and out-of-period entries before they enter the record. Standardised survey templates with required fields and mandatory text comments for low scores ensure feedback completeness. The elimination of manual data transfer between disconnected systems removes the primary source of data errors.

### 4.3 Faster Report Generation — Target: 80% Reduction (From ~5 Minutes to < 1 Minute)

Pre-built report templates for Faculty Appraisal, Tutor Billing, Teaching Awards, Programme Quality Review, and Accreditation are generated asynchronously. The custom report builder allows administrators to define ad hoc reports with selected fields, filters, and date ranges. All reports export to PDF, Excel, and CSV. Scheduled report delivery automates recurring reporting needs entirely.

### 4.4 Improved Staff and User Satisfaction — Target: ≥ 30% Increase in Survey Completion Rates

The batched survey engine is specifically designed to increase participation by reducing survey fatigue. Instead of receiving a survey for every tutor interaction in a day, students receive one consolidated survey per configured cadence (daily, weekly, or per-posting). Automated reminders at configurable intervals drive completion. The clean, mobile-responsive survey form with progress bars and Likert scales makes the feedback process quick and intuitive.

---

## 5. Solution Readiness & Maturity

### 5.1 Current State — Fully Demoable Prototype

ClinEdOps is not a wireframe, a set of mockups, or a concept document. **The platform is fully built and in a demoable state.** The working prototype includes:

- Authenticated login with role-based access (Admin, Supervisor, Tutor, Student roles)
- Complete student and tutor record management with batch import from Excel/CSV
- Posting creation, assignment, and lifecycle management
- Teaching session logging with multi-level approval workflow
- Configurable survey template builder with batched survey dispatch and submission
- Real-time dashboards with live data visualisations
- Report generation (appraisal, billing) with export to PDF/Excel/CSV
- In-app notification system
- Full audit trail visible to administrators
- Seed demo data covering realistic scenarios across disciplines

This level of readiness demonstrates that our team has already executed on the challenge requirements — not just designed them.

### 5.2 Technology Maturity

The technology stack powering ClinEdOps is battle-tested and production-grade:

- **React 18** is the most widely adopted frontend framework, with a mature ecosystem of libraries, developer tools, and community support.
- **FastAPI** is the fastest-growing Python web framework, used in production by companies including Microsoft, Netflix, and Uber.
- **PostgreSQL 16** is the world's most advanced open-source relational database, trusted by healthcare, finance, and government organisations globally.
- **Docker + AWS ECS Fargate** is a proven containerisation and orchestration stack that powers production workloads for organisations of every scale. Our prototype runs on Docker Compose today; the AWS ECS Fargate production deployment is fully designed and scoped as a defined milestone in our delivery timeline.

There is no experimental or unproven technology in our stack. Every component has been chosen for production reliability, strong community support, and alignment with NUH's operational requirements.

---

## 6. Scalability Considerations

### 6.1 Scaling Within NUH

The platform is designed to handle growth across multiple dimensions:

**Student volume growth:** PostgreSQL with proper indexing and read replicas handles large cohorts efficiently. Cursor-based pagination on list endpoints ensures consistent performance as data volumes grow.

**Additional disciplines and programmes:** The configurable architecture — survey templates, RBAC permissions, department structures, and academic cycles — all support adding new programmes without code changes.

**Concurrent user scaling:** ECS Fargate auto-scaling provisions additional container instances based on CPU utilisation thresholds. The stateless API design ensures any container can serve any request.

### 6.2 Multi-Institution Expansion

The post-POC roadmap includes expansion to other NUHS-affiliated institutions. The database schema, RBAC model, and API design are architecturally prepared for this transition:

- Institution-scoped data partitioning
- Multi-tenant RBAC with institution-level isolation
- Shared configuration templates with institution-specific overrides
- Centralised cross-institution reporting for NUHS-level oversight

### 6.3 Post-POC Roadmap

The path from prototype to production is clearly defined with four phases bridging the gap — Client Feedback & Customisation, AWS Cloud Deployment, Email/SES Integration, and Production Readiness (security hardening, load testing, observability, and SOP creation). These are detailed in Section 7.2. Beyond production launch, the longer-term roadmap includes:

| Phase | Scope | Timeline |
|---|---|---|
| Phase A | System integrations — NUHS Jobplan Portal, NUS BLUE, TAS | Post-production + 4 weeks |
| Phase B | Advanced analytics — trend analysis, benchmarking, sentiment analysis on open-text feedback | Post-production + 8 weeks |
| Phase C | Mobile-first PWA optimisation; optional native mobile app | Post-production + 12 weeks |
| Phase D | Multi-institution expansion to other NUHS-affiliated hospitals | Post-production + 16 weeks |

---

## 7. Prototype Development Timeline

Given that our prototype is already built and demoable, the development timeline below covers two stages: the completed prototype build (Phases 0–5) and the forward-looking production roadmap (Phases 6–9) that takes ClinEdOps from a working prototype to a production-grade deployment within NUH.

### 7.1 Completed — Prototype Build

| Phase | Duration | Scope | Deliverable |
|---|---|---|---|
| 0 — Foundations | Week 1 | Repo setup, Docker Compose, DB schema, auth system, RBAC skeleton, CI/CD pipeline | Running app skeleton with login |
| 1 — Core Data | Week 1–2 | Student/tutor CRUD, batch import, posting management, academic cycle management, admin panel | Working data management layer |
| 2 — Teaching Hours | Week 2 | Session logging, approval workflow, anomaly detection, tutor dashboard, hours summary | Full teaching hours module |
| 3 — Surveys & Feedback | Week 3 | Template builder, survey engine, batched survey dispatch, reminder system, feedback analytics | Feedback collection working |
| 4 — Reporting & Dashboards | Week 3–4 | Dashboard KPIs, report generation (PDF/Excel/CSV), scheduled reports | Report centre complete |
| 5 — Polish & Demo | Week 4 | UI polish, seed demo data, end-to-end testing, performance review, demo script preparation | Challenge submission ready |

**Current status: Phases 0–5 are complete. The prototype is demo-ready.**

### 7.2 Forward Roadmap — From Prototype to Production

| Phase | Duration | Scope | Deliverable |
|---|---|---|---|
| 6 — Customisations & Client Feedback | Week 5–6 | Incorporate NUH stakeholder feedback from demo sessions; refine UI/UX based on real user input; adjust workflows, survey templates, and report formats to match NUH-specific operational requirements; add discipline-specific configurations as identified during feedback sessions | Platform tailored to NUH operational reality, validated by end-user stakeholders |
| 7 — AWS Cloud Deployment | Week 7–8 | Provision AWS infrastructure on ap-southeast-1: ECS Fargate cluster, RDS PostgreSQL (Multi-AZ), ElastiCache Redis, S3 buckets, CloudFront CDN, Route 53 DNS, ALB with WAF rules; configure VPC with private/public subnets; set up infrastructure-as-code (AWS CDK / Terraform); establish staging and production environments | ClinEdOps running on AWS Singapore with full cloud infrastructure |
| 8 — Email & Notification Integration (AWS SES) | Week 8–9 | Configure AWS SES for transactional email delivery; implement email notification templates (feedback reminders, approval requests, low-score alerts, deadline warnings); set up scheduled report email delivery; verify SES domain authentication (SPF, DKIM, DMARC); move SES out of sandbox mode for production email volume | Fully operational email notification and report delivery system |
| 9 — Production Readiness | Week 9–11 | **Security hardening:** Penetration testing, vulnerability scanning, PDPA compliance audit, secrets rotation policy, WAF rule tuning. **Load testing:** Simulate 500+ concurrent users, stress-test report generation, validate auto-scaling thresholds. **Observability:** Configure CloudWatch dashboards, Sentry error tracking, application-level logging, uptime monitoring, and alerting. **SOP creation:** Develop operational runbooks for incident response, deployment procedures, backup/restore, user onboarding, and system administration. **UAT coordination:** Facilitate user acceptance testing with NUH Medical Affairs staff across all disciplines | Production-grade deployment with security certification, performance benchmarks, monitoring stack, and operational documentation |

### 7.3 Post-Production Enhancements

| Phase | Scope | Timeline |
|---|---|---|
| Phase A | System integrations — NUHS Jobplan Portal, NUS BLUE, TAS (dependent on NUH providing API access and test credentials) | Post-production + 4 weeks |
| Phase B | Advanced analytics — trend analysis, benchmarking, sentiment analysis on open-text feedback | Post-production + 8 weeks |
| Phase C | Mobile-first PWA optimisation; optional native mobile app | Post-production + 12 weeks |
| Phase D | Multi-institution expansion to other NUHS-affiliated hospitals | Post-production + 16 weeks |

---

## 8. Company Profile — SlashLLM

### 8.1 About Us

SlashLLM is a technology company specialising in building intelligent, production-grade software platforms. We combine deep technical expertise in modern web development, cloud infrastructure, and AI/ML with a proven track record of delivering end-to-end solutions across healthcare, compliance, finance, and enterprise sectors.

Our approach is defined by speed without compromise — we move fast because our engineering practices are disciplined, not because we cut corners. We build on battle-tested technology stacks, implement robust security and compliance from day one, and deliver products that are ready for real-world deployment, not just demonstrations.

### 8.2 Relevant Past Projects

**AI-Powered Care Home Management Platform (Healthcare / Europe)**
Built an end-to-end care home management application with AI-powered operational capabilities. This project demonstrates our direct experience in healthcare operations software — managing complex workflows involving multiple user roles, compliance requirements, and sensitive personal data. The parallels to ClinEdOps are significant: multi-role access control, lifecycle management, compliance reporting, and data privacy requirements.

**AI Agent for Video Interview Analysis (AWS / Microservices)**
Designed and built a live video interview analysis platform on AWS using a microservices architecture. The system performs real-time analysis and generates detailed interview reports. This project showcases our proficiency with the exact infrastructure stack underpinning ClinEdOps — AWS services, containerised microservices, asynchronous processing, and automated report generation.

**Food AI Compliance Platform (Regulatory / Compliance)**
Developed an AI-powered food compliance application that automates nutrition label generation, HACCP 2 plan creation, and SOP management for food entrepreneurs. This demonstrates our ability to build configurable, regulation-aware platforms — a directly transferable skill to building PDPA-compliant clinical education systems with audit trails and data governance.

**Production-Grade AI Infrastructure Layer (Platform Engineering)**
Built an infrastructure layer for making AI applications production-ready, implementing guardrails, AI gateway, observability, red teaming, and governance. This showcases our expertise in building robust, secure, observable production systems — the same engineering rigour applied to ClinEdOps.

**End-to-End DevOps & Platform Engineering (Singapore / HR Tech)**
Maintained the development lifecycle and DevOps platform for a Singapore-based HR tech company. This engagement demonstrates our operational experience within the Singapore technology ecosystem and our ability to manage production infrastructure with high reliability requirements.

**Finance Tracker & Estate Planning Software (Fintech)**
Built a financial asset tracking and estate planning application with a "dead man's toggle" feature that automatically notifies dependents in case of a personal disaster. This project demonstrates our ability to handle sensitive personal data with appropriate security measures, automated notification systems, and complex business logic — all capabilities directly applied in ClinEdOps.

### 8.3 Our Team

| Name | Role | Contribution to ClinEdOps |
|---|---|---|
| **Mridhul Pax** | CEO & Chief Architect | Solution architecture, system design, technical strategy, stakeholder engagement |
| **Dinesh K** | Project Manager | Delivery planning, milestone tracking, NUH coordination, risk management |
| **Anandhu** | Lead Engineer | Full-stack development, API design, database architecture, core module implementation |
| **Ashik J** | Senior Engineer | Frontend development, UI/UX implementation, dashboard and reporting interfaces |
| **Annie** | Lead QA | Test strategy, end-to-end testing, quality assurance, UAT coordination |
| **Shyam** | DevOps Engineer | AWS infrastructure, Docker containerisation, CI/CD pipeline, production deployment |

Our team combines architectural vision, engineering execution, project delivery discipline, quality assurance rigour, and infrastructure expertise — covering the full lifecycle from design through deployment and operations.

---

## 9. Evaluation Criteria Alignment

The following maps our solution directly to the IMDA evaluation criteria:

### Solution Fit — Relevance (30%)

ClinEdOps directly addresses every pain point identified in the challenge brief. The nine core modules map one-to-one to the solution criteria specified by NUH: student and tutor lifecycle management, teaching hours tracking with approval workflows, configurable survey templates with batched dispatch, structured feedback collection with automated reminders and low-score flagging, notifications for pending and incomplete tasks, batch upload with anomaly detection, role-based access control with approval hierarchies, real-time dashboards and reporting, audit trail maintenance, data exportability, and integration readiness with existing hospital systems. The platform was designed by reading the challenge brief and PRD requirements as a specification — every requirement has a corresponding feature.

### Solution Readiness — Maturity (15%)

ClinEdOps is built on React + FastAPI + PostgreSQL + Docker — a proven, production-grade stack with extensive industry adoption. Every technology choice is mature, well-documented, and supported by large open-source communities. The prototype is fully functional and demoable today, demonstrating a level of maturity that goes well beyond concept or wireframe stage.

### Solution Readiness — Scalability (15%)

The architecture is explicitly designed for scale. ECS Fargate provides serverless auto-scaling. RDS PostgreSQL with read replicas handles reporting load independently from transactional queries. Redis caching accelerates frequently accessed data. The multi-tenant-ready database schema and RBAC model support expansion to additional NUHS-affiliated institutions post-POC without re-architecture.

### Solution Advantage — Quality of Innovation (20%)

ClinEdOps introduces several innovations that differentiate it from conventional approaches: the batched survey engine that eliminates survey fatigue by design (not just by policy), automated anomaly detection on teaching hours that catches errors before they propagate, a fully configurable platform that adapts to new disciplines and workflows without custom coding, and an ML-ready feedback analytics pipeline that can evolve to include sentiment analysis and trend benchmarking. These are not incremental improvements over existing tools — they represent a fundamentally different approach to clinical education operations.

### Company Profile — Business Traction (10%)

SlashLLM has delivered production software across healthcare (care home management), compliance (food AI), fintech (estate planning), and enterprise (HR tech DevOps) — demonstrating both breadth and depth of delivery capability. Our Singapore-based DevOps engagement provides direct operational context in the local technology ecosystem.

### Company Profile — Team Experience (10%)

Our six-person team covers the complete delivery lifecycle: architecture, engineering, project management, quality assurance, and DevOps. The team has collectively delivered AI-powered platforms, healthcare management systems, compliance applications, and production infrastructure — a combination of experiences that maps directly to the ClinEdOps challenge requirements.

---

## 10. Demo Availability

The ClinEdOps prototype is ready for live demonstration. The demo covers the following end-to-end workflows:

1. **Role-based login** — Demonstrating Admin, Supervisor, Tutor, and Student experiences with appropriate dashboard views and navigation
2. **Student & tutor management** — Creating records, batch importing from Excel, viewing profiles and posting histories
3. **Posting lifecycle** — Creating postings, assigning students and tutors, tracking status progression
4. **Teaching hour logging & approval** — Tutor logs a session, supervisor reviews and approves, admin views aggregated hours with anomaly flags
5. **Survey creation & feedback collection** — Building a survey template, dispatching batched surveys, student submission with low-score flagging
6. **Dashboard & reporting** — Real-time KPI dashboards, generating a faculty appraisal report with one-click export
7. **Audit trail** — Viewing the immutable log of all system actions
8. **Notification system** — In-app alerts for pending approvals, incomplete surveys, and flagged items

We welcome the opportunity to demonstrate the platform to the evaluation panel at NUH's convenience.

---

## 11. Conclusion

ClinEdOps is a purpose-built answer to NUH's challenge of unifying clinical education operations. It is not a generic tool being repurposed — it was designed from the ground up to address the specific pain points, workflows, user personas, and success metrics outlined in the challenge brief.

What we bring to this challenge is simple: **a working product, a proven team, and a clear path from prototype to production.**

The platform is built. The demo is ready. We are ready to partner with NUH to transform clinical education operations.

---

*Submitted by SlashLLM for the IMDA Open Innovation Platform — Call 28, March 2026*

*Challenge: Enabling Unified Clinical Education Operations Through an Integrated Digital Platform*

*Challenge Owner: National University Hospital (NUH) — Medical Affairs (Education)*
