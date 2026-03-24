# Baansy — منصة التسجيل الجامعي الذكية

## Overview

Full-stack AI-powered university registration platform. pnpm workspace monorepo using TypeScript.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5 + compression + rate-limiting
- **Database**: PostgreSQL + Drizzle ORM
- **Auth**: JWT (jsonwebtoken) + bcryptjs, 30-day tokens
- **AI Chat**: OpenAI streaming SSE (configurable model/prompt/temp/speed)
- **Frontend**: React + Vite + Tailwind CSS
- **Build**: esbuild (server), Vite (client)

## Artifacts

| Artifact | Preview Path | Description |
|----------|-------------|-------------|
| `artifacts/baansy` | `/` | Main React web app — RTL/LTR, dark/light, responsive |
| `artifacts/api-server` | `/api` | Express API server on port 8080 |
| `artifacts/mockup-sandbox` | `/__mockup` | Design sandbox |

## Structure

```text
├── artifacts/
│   ├── baansy/                # React+Vite frontend
│   │   └── src/
│   │       ├── App.tsx          # Router: home/login/signup/forgot/referral/admin
│   │       ├── components/
│   │       │   └── icons.tsx    # Inline SVG icon components
│   │       ├── hooks/
│   │       │   └── useAuth.tsx  # JWT auth context (login/register/logout)
│   │       ├── lib/
│   │       │   └── api.ts       # API fetch wrapper + SSE streamChat
│   │       └── pages/
│   │           ├── HomePage.tsx    # Desktop+Mobile chat UI with real streaming
│   │           ├── AuthPages.tsx   # Login, Signup, ForgotPassword
│   │           ├── ReferralPage.tsx # Referral landing page
│   │           └── AdminPage.tsx   # Admin dashboard (stats + AI settings)
│   └── api-server/            # Express backend
│       └── src/
│           ├── app.ts           # CORS, compression, rate-limiting, routes
│           ├── routes/
│           │   ├── auth.ts      # POST /register /login /logout /me /forgot /reset
│           │   ├── chat.ts      # GET/POST sessions, SSE send endpoint
│           │   └── admin.ts     # GET stats, GET/PUT ai-settings, GET users
│           └── lib/
│               ├── auth.ts      # JWT sign/verify, bcrypt hash/compare
│               └── middleware.ts # requireAuth, requireAdmin
├── lib/
│   ├── db/
│   │   └── src/schema/
│   │       ├── users.ts         # users table (id, name, email, passwordHash, role[student/admin/university], status, universityId)
│   │       ├── sessions.ts      # sessions table
│   │       ├── password-resets.ts
│   │       ├── universities.ts  # universities (name, country, type, rank, logo)
│   │       ├── specializations.ts
│   │       ├── applications.ts
│   │       ├── application-events.ts  # Status change history (fromStatus, toStatus, notes, createdBy)
│   │       ├── documents.ts
│   │       ├── notifications.ts
│   │       ├── referrals.ts
│   │       ├── services.ts
│   │       ├── chat.ts          # chat_sessions, chat_messages + role enum
│   │       └── ai-settings.ts   # model, systemPrompt, temperature, maxTokens, typingSpeedMs
│   ├── api-spec/               # OpenAPI spec + Orval codegen
│   ├── api-client-react/       # Generated React Query hooks
│   └── api-zod/                # Generated Zod schemas
└── scripts/                    # Utility scripts
```

## API Routes

### Auth (`/api/auth`)
- `POST /register` — name, email, password → JWT token + user
- `POST /login` — email, password → JWT token + user
- `POST /logout` — (auth required)
- `GET /me` — (auth required) → current user
- `POST /forgot-password` — email → sends reset link
- `POST /reset-password` — token, password → resets password

### Chat (`/api/chat`) — auth required
- `GET /sessions` — list user's chat sessions
- `POST /sessions` — create new session
- `GET /sessions/:id/messages` — get messages for session
- `POST /sessions/:id/send` — send message → SSE streaming response

### Admin (`/api/admin`) — admin role required
- `GET /stats` — total users, sessions, messages, applications, documents, universities
- `GET /ai-settings` — get AI model config + hasApiKey status
- `PUT /ai-settings` — update model/systemPrompt/temperature/maxTokens/typingSpeedMs
- `GET /users` — list all users
- `GET /students` — CRM: list students with doc/app counts (q, country, status, page)
- `GET /students/:id` — student detail with docs + applications
- `GET /documents` — list all documents (type, verified filters)
- `PATCH /documents/:id/verify` — verify or reject a document
- `GET /universities` — list universities (status filter: pending/active/rejected/all)
- `GET /universities/:id` — university detail with specs + contact user
- `PATCH /universities/:id/approve` — approve pending university (activates user too)
- `PATCH /universities/:id/reject` — reject university
- `PATCH /universities/:id/suspend` — suspend active university
- `GET /applications` — list applications (q, status, universityId, country, page)
- `GET /applications/:id` — application detail with student info + event history
- `PATCH /applications/:id/status` — change status, add notes, create event + in-app notification + email

### Applications (`/api/applications`) — auth required (student)
- `GET /` — list own applications with uni/spec info
- `POST /` — create new application (body: specializationId)
- `GET /:id` — application detail with events timeline
- `POST /:id/submit` — submit draft application (requires ≥1 document)
- `DELETE /:id` — withdraw application (sets status to "withdrawn")

### Notifications (`/api/notifications`) — auth required
- `GET /` — list own notifications (50 most recent)
- `GET /count` — count of unread notifications
- `PATCH /:id/read` — mark single notification as read
- `PATCH /read-all` — mark all notifications as read

### Universities (`/api/universities`) — public
- `GET /` — search/filter (q, country, degree, minFee, maxFee, page)
- `GET /countries` — distinct country list
- `GET /:id` — university detail with specializations

### University Portal (`/api/university-portal`)
- `POST /register` — public: university self-registration (creates pending user + university)
- `GET /profile` — get own profile + specializations (auth: university role)
- `PUT /profile` — update profile info
- `GET /specializations` — list own specializations
- `POST /specializations` — add specialization (requires approved status)
- `PUT /specializations/:id` — update specialization
- `DELETE /specializations/:id` — delete specialization

### Documents (`/api/documents`) — auth required (student)
- `POST /request-upload` — get presigned GCS upload URL
- `POST /` — save document metadata after upload
- `GET /` — list own documents
- `DELETE /:id` — delete own document

## Frontend Features

- **Arabic/English** — full RTL/LTR support, Cairo (AR) + Inter (EN) fonts
- **Dark/Light mode** — toggle per-user preference
- **Desktop** — collapsible sidebar (260px), chat history, service cards 2×2 grid
- **Mobile** — hamburger drawer, carousel service cards, top stats bar
- **Real AI chat** — OpenAI SSE streaming at 20ms typing speed (configurable)
- **Auth flows** — login, signup (with terms checkbox), forgot password
- **Admin panel** — stats, AI settings, student CRM, university approval workflow
- **Admin Applications CRM** — applications list with status-change modal (notes support), event history panel with clickable timeline
- **Referral page** — landing page with testimonial, stats, badges
- **University Register page** — self-registration form with full bilingual support
- **University Portal** — manage profile & specializations, approval status display
- **ApplicationsPage** — student application tracker: visual stepper (6 stages), timeline, congratulations screen for preliminary_accepted, withdraw button
- **Notifications** — in-app notification bell with unread badge on sidebar, notifications tab with mark-read / mark-all-read
- **Email** — bilingual (AR/EN) email on status change via Nodemailer + SMTP_URL (graceful console.log fallback if unconfigured)

## Key Environment Variables

- `DATABASE_URL` — PostgreSQL connection (auto-provided by Replit)
- `OPENAI_API_KEY` — OpenAI API key for AI chat (set as Replit secret)
- `JWT_SECRET` — JWT signing secret (defaults to dev secret; set in production)
- `DEFAULT_OBJECT_STORAGE_BUCKET_ID` — GCS bucket for document uploads
- `PRIVATE_OBJECT_DIR` — Private object storage directory prefix

## Test Credentials

- **Admin**: `admin@baansy.com` / `Admin@Baansy2024` (role: admin)
- **Student**: register via `/signup`
- **University**: register via `/university/register` → admin approves

## DB Commands

```bash
pnpm --filter @workspace/db run push        # Apply schema changes (development)
pnpm --filter @workspace/db run push-force  # Force push (destructive)
```

## Rate Limiting

- Auth endpoints: 20 req / 15 min per IP
- General API: 300 req / min per IP

## Application Status Flow

`draft` → `submitted` → `documents_pending` | `under_review` → `preliminary_accepted` → `accepted`

Also: `rejected`, `withdrawn` (terminal)

Status changes are immutable events recorded in `application_events` table.

## Completed Tasks

- ✅ Task #2 — DB schema (11 tables), Express backend (auth/chat/admin), React frontend (all pages)
- ✅ Task #3 — 150 universities seeded (600 specializations), document upload API (GCS presigned URLs), admin CRM (students/documents/universities), university self-registration portal with admin approval workflow
- ✅ Task #4 — Application lifecycle (DB events table, student apply/submit/withdraw, admin status change + notes modal, event history CRM panel, in-app notifications, notification bell with badge, notifications tab, congratulations screen, bilingual email via Nodemailer)

## Upcoming Tasks

- Task #5 — Bank & electronic payment system
- Task #6 — Advanced AI chat, integrated student services
- Task #7 — Referral program with commissions and account statements
