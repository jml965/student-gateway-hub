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
│   │       ├── users.ts         # users table (id, name, email, passwordHash, role, status)
│   │       ├── sessions.ts      # sessions table
│   │       ├── password-resets.ts
│   │       ├── universities.ts  # universities (name, country, type, rank, logo)
│   │       ├── specializations.ts
│   │       ├── applications.ts
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
- `GET /stats` — total users, sessions, messages, applications
- `GET /ai-settings` — get AI model config + hasApiKey status
- `PUT /ai-settings` — update model/systemPrompt/temperature/maxTokens/typingSpeedMs
- `GET /users` — list all users

## Frontend Features

- **Arabic/English** — full RTL/LTR support, Cairo (AR) + Inter (EN) fonts
- **Dark/Light mode** — toggle per-user preference
- **Desktop** — collapsible sidebar (260px), chat history, service cards 2×2 grid
- **Mobile** — hamburger drawer, carousel service cards, top stats bar
- **Real AI chat** — OpenAI SSE streaming at 20ms typing speed (configurable)
- **Auth flows** — login, signup (with terms checkbox), forgot password
- **Admin panel** — stats dashboard + AI settings (model, prompt, temp, speed)
- **Referral page** — landing page with testimonial, stats, badges

## Key Environment Variables

- `DATABASE_URL` — PostgreSQL connection (auto-provided by Replit)
- `OPENAI_API_KEY` — OpenAI API key for AI chat (set as Replit secret)
- `JWT_SECRET` — JWT signing secret (defaults to dev secret; set in production)

## DB Commands

```bash
pnpm --filter @workspace/db run push        # Apply schema changes (development)
pnpm --filter @workspace/db run push-force  # Force push (destructive)
```

## Rate Limiting

- Auth endpoints: 20 req / 15 min per IP
- General API: 300 req / min per IP

## Completed Tasks

- ✅ Task #2 — DB schema (11 tables), Express backend (auth/chat/admin), React frontend (all pages)

## Upcoming Tasks

- Task #3 — 150 university profiles, document upload, CRM
- Task #4 — Application workflow, notifications, preliminary acceptance
- Task #5 — Bank & electronic payment system
- Task #6 — Advanced AI chat, integrated student services
- Task #7 — Referral program with commissions and account statements
