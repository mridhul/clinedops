CLAUDE.md — ClinEdOps Project Rules

Project Identity
ClinEdOps: Unified Clinical Education Operations Platform for NUH Medical Affairs (Education).
Manages student/tutor lifecycle, teaching hours, feedback surveys, and reporting across four
disciplines: Medicine, Allied Health, Nursing, and Training Programmes.


Tech Stack (Non-Negotiable)
• Frontend: React 18 + TypeScript + Vite
• UI: Ant Design (antd) — do NOT use Shadcn, Material UI, or Chakra
• State: TanStack React Query for server state + Zustand for client state
• Routing: React Router v6 with protected route guards
• Charts: Recharts
• Backend: FastAPI (Python 3.12) with async endpoints
• ORM: SQLAlchemy 2.0 (async via asyncpg) + Alembic for migrations
• Database: PostgreSQL 16
• Auth: JWT RS256 — access tokens (15 min TTL, in-memory) + refresh tokens (7 day,
HTTP-only cookie)
• Task queue: Celery + Redis 7
• File storage: AWS S3 (ap-southeast-1)
• Email: AWS SES
• Containers: Docker + Docker Compose
• CI/CD: GitHub Actions

Repository Structure
clinedops/
├── frontend/src/ → components/, pages/, hooks/, store/, api/, types/, utils/
├── backend/app/ →
api/v1/{auth,students,tutors,postings,teaching_hours,surveys,feedback,reports,notif
ications,admin}/
│ ├── models/, schemas/, services/, tasks/, integrations/, core/, db/
├── docker-compose.yml, docker-compose.prod.yml
└── CLAUDE.md, STATUS.md




Coding Conventions
Backend (Python / FastAPI)
• All API routes under /api/v1/ with versioned routers
• All responses use standard envelope: { data, meta, errors }
• Pydantic v2 for all request/response schemas (schemas/ directory)
• Business logic in services/ layer — route handlers are thin (validate, call service, return)
• Async everywhere: use async def for all endpoints and DB queries
• Every endpoint has a role permission dependency injection decorator
• All multi-step writes wrapped in DB transactions
• No raw SQL — all queries via SQLAlchemy ORM with parameterised filters
• Audit log: every CREATE, UPDATE, DELETE, APPROVE action writes to audit_logs table
(before/after state as JSONB)
• UUIDs for all primary keys (gen_random_uuid)
• Timestamps: always TIMESTAMPTZ, never naive datetime
• Passwords: bcrypt with cost factor 12
• Linting: Ruff. Type checking: mypy
Frontend (React / TypeScript)
• Functional components only — no class components
• All API calls through React Query custom hooks in api/ directory
• TypeScript strict mode — no any types allowed
• Ant Design components for all UI — do not build custom versions of existing antd
components
• Forms: antd Form component with validation rules
• Tables: antd Table with server-side pagination, sorting, filtering
• Role-based rendering: use useAuth() hook to conditionally render menu items and actions
• Responsive: must work at 375px viewport width minimum
• Linting: ESLint with typescript-eslint. Formatting: Prettier

Database Conventions
• All tables: id (UUID PK), created_at (TIMESTAMPTZ), updated_at (TIMESTAMPTZ),
created_by (FK to users)
• Soft deletes via is_active boolean — never hard delete in application code
• ENUMs for: role (super_admin, programme_admin, supervisor, tutor, student), discipline
(medicine, allied_health, nursing, training), status fields
• Junction tables for many-to-many: posting_tutors, session_students
• JSONB for: survey questions, survey responses, audit before/after state, report config
• Every Alembic migration must be reversible (include downgrade)

API Design Rules
• Pagination: cursor-based for large datasets; limit/offset for simple lists
• Rate limiting: 1000 req/min per authenticated user; 100 req/min public


• Error format: { code, message, field (if validation), trace_id }
• All list endpoints support: ?discipline=, ?status=, ?department=, ?date_from=, ?date_to=
filters
• Batch endpoints (students/batch, tutors/batch) accept Excel (.xlsx) and CSV uploads with
field mapping

Security Rules
• Access tokens: 15 min TTL, stored in memory (NOT localStorage)
• Refresh tokens: 7 day TTL, HTTP-only secure cookie, server-side rotation
• RBAC enforced at service layer: data queries filtered by actor role and discipline scope
• Programme admins see only their assigned discipline
• Students see only their own data
• Tutors see only their own sessions, students, and feedback
• All inputs validated server-side with Pydantic before touching the DB

Testing Standards
• Backend: pytest with async test client. Coverage target: &gt;= 80% on services/ and api/
• Frontend: Vitest + React Testing Library for components
• E2E: Playwright for critical user journeys
• CI: all PRs must pass lint + type check + unit tests

What NOT to Do
• Do NOT add any npm packages without justification — prefer antd built-in components
• Do NOT use localStorage for tokens or sensitive data
• Do NOT write raw SQL queries
• Do NOT create new database tables without an Alembic migration
• Do NOT skip audit logging on any write operation
• Do NOT hardcode credentials, API keys, or secrets — use environment variables
• Do NOT modify working features when building new ones unless explicitly asked