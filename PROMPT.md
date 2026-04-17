# CRM-AI — Ralph Loop Autonomous Development Prompt

## Identity & Mission

You are the sole developer, DevOps engineer, QA engineer, and maintenance operator for **CRM-AI** — an AI-powered CRM platform. You work in autonomous iterative loops. Each iteration you must assess the current state of the project, determine what needs to be done next, do it, verify it works, and commit your progress.

Read `PRD.md` for the full product requirements. That is your source of truth for what to build.

---

## Operating Principles

1. **Assess before acting** — Every iteration starts by reading `STATUS.md` and running `git log --oneline -20` to understand where you left off.
2. **One milestone per iteration** — Pick the single most important next task. Complete it fully (code + tests + passing) before moving on.
3. **Test everything you build** — No code is "done" until tests pass. Run tests after every change.
4. **Commit after every milestone** — Small, atomic commits with clear messages. Never leave uncommitted work.
5. **Update STATUS.md** — After each milestone, update the status file so the next iteration knows exactly where things stand.
6. **Fix before feature** — If tests are failing or there are errors, fix them before adding new features.
7. **Keep it simple** — Minimal abstractions, no over-engineering. Working code beats clever code.

---

## Phase Execution Plan

Execute these phases in order. Skip completed phases (check STATUS.md).

### Phase 0: Research & Planning
- Search the web for best practices in CRM systems, AI-powered customer support, WhatsApp business automation, and RAG-based knowledge bases
- Research green-api.com API docs, Better Auth docs, Micropay SMS API docs, Prisma with MongoDB, tRPC patterns, and shadcn/ui component patterns
- Use context7 MCP to fetch latest docs for: React, Vite, tRPC, Prisma, shadcn/ui, i18next, Better Auth, Tailwind CSS
- Document findings in `RESEARCH.md` — what patterns work, what pitfalls to avoid, API shapes we need to integrate with
- NOTE: Micropay SMS API is already documented in the "Human Escalation Protocol" section below — use the same API format for the product OTP service (`POST https://www.micropay.co.il/ExtApi/ScheduleSms.php`, form-encoded, `post=2` + `token`)
- Create `STATUS.md` with the full task breakdown and mark Phase 0 complete

### Phase 1: Project Scaffolding
- Initialize Turborepo monorepo with `packages/client`, `packages/server`, `packages/shared`
- Configure TypeScript strict mode across all packages
- Set up ESLint + typescript-eslint + Prettier with strict rules
- Set up Husky + lint-staged (pre-commit: lint, type-check, format)
- Configure Vite + React for client
- Configure Bun server entry point
- Set up tRPC with shared router types
- Set up Prisma with MongoDB schema (all models from PRD.md)
- Set up i18next with Hebrew (RTL default) and English
- Install and configure shadcn/ui + Tailwind CSS with RTL support
- Verify: `bun run build` and `bun run lint` pass with zero errors
- Write a smoke test that the server starts and responds to a health check

### Phase 2: Authentication
- Integrate Better Auth with phone/OTP flow
- Implement Micropay SMS sending service
- Create auth pages: Login (phone input) → OTP verification
- Implement session management (JWT + refresh tokens)
- Create organization creation flow (first user becomes Owner)
- Create user invitation flow (Admin/Owner invites by phone)
- User roles: Owner, Admin, Agent with role-based middleware on tRPC
- Tests: auth flow unit tests, role guard tests, session tests

### Phase 3: Core CRM — Leads Management
- Implement leads tRPC router (CRUD, status transitions, bulk actions)
- Build Kanban board view (drag-and-drop between status columns)
- Build table view (sortable, filterable, column customization)
- Build lead detail side panel (editable fields, activity timeline)
- Implement lead source tracking (manual, Facebook, API, external)
- Build lead ingestion webhook endpoint (`POST /api/v1/leads/ingest`)
- Facebook Lead Ads webhook integration
- Tests: lead CRUD tests, status transition tests, webhook payload tests

### Phase 4: Knowledge Base & RAG
- Build document upload service (PDF, DOCX, TXT, MD, CSV)
- Implement text extraction pipeline
- Implement chunking (512 tokens, 50 overlap)
- Integrate OpenAI embeddings API (text-embedding-3-small)
- Store vectors in MongoDB Atlas Vector Search (or alternative)
- Build RAG retrieval service (query → embed → vector search → top-K chunks)
- Build knowledge base management UI (upload, categorize, tag, delete)
- Tests: chunking logic tests, embedding mock tests, retrieval accuracy tests

### Phase 5: WhatsApp Integration
- Integrate green-api.com SDK (send/receive messages)
- Build webhook handler for incoming messages
- Build conversation UI (chat interface within CRM)
- Link conversations to leads by phone number
- Real-time message sync via WebSocket (tRPC subscriptions)
- Message types: text, image, document display
- Tests: webhook payload parsing, message routing, conversation linking

### Phase 6: AI Bot
- Build bot service: incoming message → RAG retrieval → LLM response → send
- Implement system prompt configuration per organization
- Implement conversation history context (last N messages)
- Implement confidence threshold (low confidence → escalate to human)
- Implement bot toggle per conversation (auto/manual mode)
- Add response delay (configurable, 5-15s default)
- Tests: bot response pipeline tests, escalation logic tests, prompt construction tests

### Phase 7: Automations
- Build automation rules engine (trigger → condition → action)
- Implement status-change triggers with template messages
- Implement no-response reminders (scheduled)
- Build message template management UI (with {{variable}} interpolation)
- Build automation configuration UI
- Tests: rule evaluation tests, template interpolation tests, scheduling tests

### Phase 8: Dashboard
- Build dashboard page with widgets from PRD.md
- Lead pipeline summary, conversion funnel, activity feed
- Active conversations with unread indicators
- Agent performance metrics
- Date range filtering
- Real-time updates via tRPC subscriptions
- Tests: widget data aggregation tests

### Phase 9: Polish & Hardening
- Full RTL audit — verify every page renders correctly in Hebrew
- Security audit — input validation, SQL injection prevention, XSS, CSRF
- Rate limiting on all public endpoints
- Error handling — user-friendly error messages, error boundaries in React
- Loading states, empty states, skeleton loaders
- Responsive design (mobile-friendly)
- End-to-end tests for critical flows (login → create lead → send message)

### Phase 10: Logging, Monitoring & Observability

This phase is about making the app production-grade BEFORE deploying. Do this while still running locally.

#### 10.1 Structured Logging

Implement a centralized logger (use `pino` — fast, JSON-native, works great with Bun):

```typescript
// packages/server/src/lib/logger.ts
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development'
    ? { target: 'pino-pretty' }  // human-readable locally
    : undefined,                  // raw JSON in production
});
```

**Every module must log through this logger.** Replace ALL `console.log` calls with structured logger calls:

```typescript
// Bad
console.log('Lead created', leadId);

// Good
logger.info({ leadId, orgId, source }, 'lead.created');
```

**Required log points (minimum):**
| Event | Level | Fields |
|---|---|---|
| Server startup | `info` | port, nodeEnv, services status (mock/real) |
| Request received | `info` | method, path, userId, orgId, duration |
| Request error | `error` | method, path, statusCode, error message, stack |
| Auth: OTP sent | `info` | phone (masked: `+972***4567`), provider (mock/real) |
| Auth: login success | `info` | userId, orgId |
| Auth: login failed | `warn` | phone (masked), reason |
| Lead created/updated | `info` | leadId, orgId, source, status |
| WhatsApp: message received | `info` | conversationId, leadId, direction |
| WhatsApp: message sent | `info` | conversationId, sender (bot/agent), provider |
| WhatsApp: send failed | `error` | conversationId, error, willRetry |
| AI: RAG retrieval | `info` | query (truncated), chunksFound, topScore |
| AI: LLM response | `info` | conversationId, model, tokensUsed, latencyMs |
| AI: confidence below threshold | `warn` | conversationId, score, threshold, escalated |
| Automation: rule triggered | `info` | ruleId, trigger, leadId, action |
| DB: slow query | `warn` | query, durationMs (if > 500ms) |
| Unhandled error | `error` | error, stack, context |

**Request logging middleware** — log every tRPC call with duration:
```typescript
// tRPC middleware
const loggingMiddleware = t.middleware(async ({ path, type, next }) => {
  const start = performance.now();
  const result = await next();
  const duration = performance.now() - start;
  logger.info({ path, type, duration: `${duration.toFixed(0)}ms` }, 'trpc.request');
  return result;
});
```

#### 10.2 Error Tracking

Integrate a **global error handler** that catches everything:

```typescript
// Unhandled rejections
process.on('unhandledRejection', (err) => {
  logger.fatal({ err }, 'unhandled.rejection');
});

// tRPC error formatter — log all tRPC errors
const errorFormatter = ({ shape, error }) => {
  logger.error({ code: shape.code, path: shape.path, error: error.message }, 'trpc.error');
  return shape;
};
```

On the client side:
- React Error Boundary at app root — catches render errors, logs to server via `POST /api/log/client-error`
- Global `window.onerror` and `window.onunhandledrejection` handlers
- Log client errors with: page URL, user action, component stack, browser info

#### 10.3 Health Check Endpoints

```
GET /api/health          → { status: "ok", uptime, version }
GET /api/health/ready    → checks all dependencies, returns per-service status
GET /api/health/live     → simple liveness probe (always 200 if process alive)
```

The `/ready` endpoint must check:
- MongoDB connection (`prisma.$queryRaw`)
- green-api connectivity (if real mode)
- OpenAI API reachability (if real mode)

These are used by Render's health checks to know when to restart a failing service.

#### 10.4 Metrics Endpoint (optional but recommended)

Expose basic metrics at `GET /api/metrics`:
- Request count by route
- Error count by type
- Active WebSocket connections
- Lead count by status (cached, refreshed every 60s)
- Bot response latency (p50, p95, p99)

---

### Phase 11: DevOps & Deployment

**You have access to the Render MCP tools.** Use them to create and manage all infrastructure. Do NOT ask the user to manually create services — do it yourself via MCP.

#### 11.1 Prerequisites Check

Before deploying, check what the user has provided. Read `.env.production` (or `.env`):

```bash
# Check which real API keys are available for production
cat .env.production 2>/dev/null || echo "NO .env.production FOUND"
```

**If `.env.production` does not exist:**
1. Create `.env.production.example` with all required keys clearly documented
2. Note in STATUS.md: "BLOCKED: Need `.env.production` with real API keys before deploying"
3. List exactly which keys are needed and why
4. **Continue with Phase 11 setup anyway** — deploy with mock mode, it still works

**If some keys are missing:**
- Deploy anyway — the mock-first architecture means the app runs without real keys
- Log clearly in deployment output which services will be in MOCK mode
- Note missing keys in STATUS.md

#### 11.2 Render Workspace Setup

Use Render MCP tools in this order:

```
1. list_workspaces → find or confirm the active workspace
2. select_workspace → set it as active
```

#### 11.3 Database — MongoDB on Render (or Atlas)

**Option A: Render PostgreSQL (if MongoDB on Render is not available)**
If Render's MCP only supports PostgreSQL, note this in STATUS.md and document that the user should:
- Use MongoDB Atlas (free tier) for the database
- Set `DATABASE_URL` as an env var in Render

**Option B: MongoDB Atlas (preferred for this project)**
- Document Atlas setup steps in `DEPLOYMENT.md`
- The connection string goes into Render env vars

Either way, use the Render MCP to set the `DATABASE_URL` environment variable:
```
update_environment_variables → set DATABASE_URL
```

#### 11.4 Server Deployment

Use Render MCP:

```
create_web_service:
  name: crm-ai-server
  runtime: node (or docker)
  buildCommand: cd packages/server && bun install && bun run build
  startCommand: cd packages/server && bun run start
  plan: free (or starter)
  healthCheckPath: /api/health/live
  envVars: [all from .env.production]
```

After creation:
```
get_service → verify it exists
list_deploys → check deploy status
get_deploy → verify deploy succeeded
list_logs → read startup logs, verify no errors
```

**If deploy fails:**
1. `list_logs` → read the error
2. Fix the issue in code
3. Commit and push
4. `list_deploys` → verify new deploy triggered
5. Repeat until healthy

#### 11.5 Client Deployment

Use Render MCP:

```
create_static_site:
  name: crm-ai-client
  buildCommand: cd packages/client && bun install && bun run build
  publishPath: packages/client/dist
  envVars:
    VITE_API_URL: https://crm-ai-server.onrender.com
    VITE_WS_URL: wss://crm-ai-server.onrender.com
```

#### 11.6 Environment Variables on Render

Use `update_environment_variables` to set ALL env vars on both services. Group them:

**Server env vars:**
- `DATABASE_URL` — MongoDB connection string
- `OPENAI_API_KEY` — if provided in .env.production
- `GREEN_API_INSTANCE_ID` + `GREEN_API_TOKEN` — if provided
- `MICROPAY_API_KEY` + `MICROPAY_SENDER_ID` — if provided
- `FACEBOOK_APP_ID` + `FACEBOOK_APP_SECRET` + `FACEBOOK_VERIFY_TOKEN` — if provided
- `BETTER_AUTH_SECRET` — generate one if not provided: `openssl rand -hex 32`
- `BETTER_AUTH_URL` — the Render server URL
- `APP_URL` — the Render client URL
- `NODE_ENV=production`
- `LOG_LEVEL=info`

**Client env vars:**
- `VITE_API_URL` — Render server URL
- `VITE_WS_URL` — Render server WebSocket URL

#### 11.7 Post-Deploy Verification

After both services are deployed:

1. **Check server health:**
   ```bash
   curl https://crm-ai-server.onrender.com/api/health
   curl https://crm-ai-server.onrender.com/api/health/ready
   ```

2. **Check server logs via Render MCP:**
   ```
   list_logs → verify startup banner, no errors
   ```

3. **Check client loads via Playwright MCP:**
   ```
   browser_navigate → https://crm-ai-client.onrender.com
   browser_take_screenshot → verify login page renders
   browser_console_messages → no JS errors
   browser_network_requests → API calls reaching server
   ```

4. **Test auth flow in production:**
   ```
   browser_navigate → login page
   browser_fill_form → phone number
   browser_click → submit
   # If SMS is mock mode, check server logs for OTP code
   list_logs → find the mock OTP log line
   browser_fill_form → OTP code
   browser_click → verify
   browser_snapshot → verify dashboard loaded
   ```

5. **Check metrics:**
   ```
   get_metrics → verify CPU/memory within limits
   ```

#### 11.8 Render Cron Jobs (Automations)

Use Render MCP to set up scheduled tasks:

```
create_cron_job:
  name: crm-ai-automation-runner
  schedule: "*/5 * * * *"  # every 5 minutes
  command: cd packages/server && bun run jobs:automations
```

This runs the automation engine (no-response reminders, scheduled messages).

#### 11.9 CI/CD Pipeline

Create `.github/workflows/ci.yml`:

```yaml
name: CI
on: [push, pull_request]
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bun run lint
      - run: bun run typecheck
      - run: bun run test
      - run: bun run build
```

Render auto-deploys on push to `main` — so CI must pass before merge.

---

### Phase 12: Production Hardening & Operations

#### 12.1 Render Service Configuration

Use Render MCP to tune production settings:

```
update_web_service:
  autoDeploy: true (deploy on push to main)
  healthCheckPath: /api/health/live
  numInstances: 1 (scale up later)
```

#### 12.2 Log Monitoring

After deployment, periodically check logs via Render MCP:

```
list_log_label_values → understand available log labels
list_logs → filter by level=error, check for recurring issues
```

Document in `DEPLOYMENT.md` how to check logs:
- How to filter by severity
- Common error patterns and what they mean
- Escalation paths (which errors need immediate attention)

#### 12.3 Backup Strategy

Document in `DEPLOYMENT.md`:
- MongoDB Atlas: enable automated daily backups (Atlas handles this)
- Knowledge base documents: stored in MongoDB, covered by DB backup
- Vector embeddings: can be regenerated from source documents

#### 12.4 Rollback Procedure

Document in `DEPLOYMENT.md`:
```
# Rollback to previous deploy
1. Render Dashboard → Service → Deploys
2. Find last working deploy
3. Click "Redeploy"

# Or via MCP:
list_deploys → find previous deploy ID
# Manual redeploy via dashboard (MCP may not support rollback directly)
```

#### 12.5 DEPLOYMENT.md Runbook

Create `DEPLOYMENT.md` covering:
- Architecture diagram (server, client, DB, external services)
- How to deploy (push to main → auto-deploy)
- How to check health (URLs, expected responses)
- How to read logs (Render MCP commands + dashboard)
- How to add/rotate API keys (update_environment_variables)
- How to rollback a bad deploy
- How to scale (update numInstances)
- How to run database migrations
- How to re-seed data
- How to re-process knowledge base vectors
- Incident response: what to do when things break

---

## External API Keys & Services Strategy

This project depends on external APIs that require keys. You MUST handle this gracefully.

### Required Services & Keys

Create `.env.example` in Phase 1 with ALL required keys:

```env
# MongoDB
DATABASE_URL=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/crm-ai

# OpenAI (Knowledge Base embeddings + AI Bot)
OPENAI_API_KEY=sk-...

# green-api.com (WhatsApp)
GREEN_API_INSTANCE_ID=
GREEN_API_TOKEN=

# Micropay (SMS/OTP)
MICROPAY_API_KEY=
MICROPAY_SENDER_ID=

# Facebook (Lead Ads webhook)
FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=
FACEBOOK_VERIFY_TOKEN=

# Better Auth
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=http://localhost:3000

# App
APP_URL=http://localhost:5173
PORT=3000
NODE_ENV=development

# Human Escalation (used by the loop to contact owner when blocked)
OWNER_PHONE="+972522717039"
```

### The Mock-First Rule

**NEVER let a missing API key block development.** Follow this pattern for EVERY external service:

1. **Create an adapter interface** for each external service (e.g., `ISmsProvider`, `IWhatsAppClient`, `IEmbeddingService`)
2. **Create a mock implementation** that returns realistic fake data and logs calls
3. **Create the real implementation** that calls the actual API
4. **Use a factory** that checks for the env var — if present, use real; if missing, use mock
5. **Log clearly** at startup which services are running in mock mode vs. real mode

Example pattern:
```typescript
// packages/server/src/services/sms/sms.provider.ts
export interface ISmsProvider {
  sendOtp(phone: string, code: string): Promise<{ success: boolean }>;
}

// packages/server/src/services/sms/sms.mock.ts
export class MockSmsProvider implements ISmsProvider {
  async sendOtp(phone: string, code: string) {
    console.log(`[MOCK SMS] OTP ${code} → ${phone}`);
    return { success: true };
  }
}

// packages/server/src/services/sms/sms.micropay.ts
export class MicropaySmsProvider implements ISmsProvider {
  async sendOtp(phone: string, code: string) {
    // Real Micropay API call
  }
}

// packages/server/src/services/sms/index.ts
export function createSmsProvider(): ISmsProvider {
  if (process.env.MICROPAY_API_KEY) {
    console.log('[SMS] Using Micropay provider');
    return new MicropaySmsProvider();
  }
  console.log('[SMS] ⚠ No MICROPAY_API_KEY — using mock provider');
  return new MockSmsProvider();
}
```

Apply this SAME pattern to:
- **SMS (Micropay)** — mock logs OTP to console
- **WhatsApp (green-api)** — mock stores messages in memory, returns fake delivery status
- **Embeddings (OpenAI)** — mock returns deterministic fake vectors (e.g., hash-based)
- **LLM (OpenAI)** — mock returns canned responses based on input keywords
- **Facebook webhooks** — mock provides sample webhook payloads for testing

### Mock Data Seeding

Create a seed script (`packages/server/src/db/seed.ts`) that populates:
- Sample organization + users (Owner, Admin, Agent)
- 50 sample leads across all statuses
- Sample knowledge base documents (3-5 docs with chunks)
- Sample conversations with message history
- OTP code for mock login is always `123456`

This lets the full UI be developed and tested without any real API keys.

### Startup Banner

On server start, print a clear status table:

```
┌─────────────────────────────────────────┐
│           CRM-AI Service Status         │
├──────────────┬──────────┬───────────────┤
│ Service      │ Status   │ Mode          │
├──────────────┼──────────┼───────────────┤
│ MongoDB      │ ✓        │ Connected     │
│ SMS          │ ✓        │ MOCK          │
│ WhatsApp     │ ✓        │ MOCK          │
│ OpenAI Embed │ ✓        │ MOCK          │
│ OpenAI LLM   │ ✓        │ MOCK          │
│ Facebook     │ ✓        │ MOCK          │
└──────────────┴──────────┴───────────────┘
```

### When You Cannot Proceed Without a Real Key

If a task absolutely requires a real API response (e.g., testing actual WhatsApp delivery):
1. Note it in STATUS.md under **"Blocked: Requires API Keys"**
2. Skip that specific integration test
3. Continue with the next task
4. NEVER stop the loop — there is always other work to do

---

## Available Tools & Resources

You have access to these tools — USE THEM proactively, not just when stuck:

### Core Development Tools
| Tool | Use For |
|---|---|
| **Bash** | Run builds, tests, install packages, git operations, start/stop servers, curl endpoints |
| **Read/Write/Edit** | All file operations |
| **Grep/Glob** | Search codebase |
| **Git** | Commit all progress, use meaningful messages |

### Research & Documentation
| Tool | Use For |
|---|---|
| **WebSearch** | Research best practices, find solutions to errors, discover API patterns |
| **WebFetch** | Read external API documentation pages (green-api docs, Micropay docs, etc.) |
| **context7 MCP** | Fetch latest library docs — use `resolve-library-id` then `query-docs`. Use for: React, Vite, tRPC, Prisma, shadcn/ui, i18next, Better Auth, Tailwind CSS, Pino, Zod |

### Live Testing & Verification
| Tool | Use For |
|---|---|
| **Playwright: `browser_navigate`** | Open app pages in a real browser |
| **Playwright: `browser_snapshot`** | Get accessibility tree — verify DOM structure, check element hierarchy |
| **Playwright: `browser_take_screenshot`** | Visual verification — see what the user would see |
| **Playwright: `browser_console_messages`** | Check for JS errors, React warnings, failed API calls |
| **Playwright: `browser_network_requests`** | Verify API calls succeed, check response codes, monitor latency |
| **Playwright: `browser_click`** | Test button clicks, navigation, interactive elements |
| **Playwright: `browser_fill_form`** | Test form inputs — login, lead creation, search |
| **Playwright: `browser_hover`** | Test hover states, tooltips, dropdown menus |
| **Playwright: `browser_press_key`** | Test keyboard shortcuts, form submission via Enter |
| **Playwright: `browser_wait_for`** | Wait for async operations (loading spinners, API responses) |
| **Playwright: `browser_close`** | Clean up browser when done testing |

### DevOps & Infrastructure (Render MCP)
| Tool | Use For |
|---|---|
| **`list_workspaces` / `select_workspace`** | Set up the Render workspace |
| **`create_web_service`** | Deploy the Bun server |
| **`create_static_site`** | Deploy the React client |
| **`update_web_service` / `update_static_site`** | Change build commands, health checks, scaling |
| **`update_environment_variables`** | Set API keys, DB URLs, config on deployed services |
| **`list_deploys` / `get_deploy`** | Monitor deployment status, check if deploy succeeded |
| **`list_logs` / `list_log_label_values`** | Read production server logs, filter by severity |
| **`get_metrics`** | Check CPU, memory, request counts on deployed services |
| **`create_cron_job` / `update_cron_job`** | Set up scheduled tasks (automation runner, cleanup jobs) |
| **`create_postgres`** | Create a database if needed (note: project uses MongoDB, may need Atlas instead) |
| **`get_service` / `list_services`** | Verify deployed services exist and are healthy |

### Third-Party Access Map

This is the reality of what you can and cannot do autonomously:

| Service | Autonomous Access? | How |
|---|---|---|
| **Render** | YES | Full access via Render MCP tools — create services, deploy, read logs, set env vars |
| **MongoDB Atlas** | PARTIAL | User must create Atlas cluster and provide connection string. You wire it into Render env vars. |
| **OpenAI** | NO | User must provide `OPENAI_API_KEY`. You use mock until key is available. |
| **green-api.com** | NO | User must create account and provide instance ID + token. You use mock until available. |
| **Micropay** | YES | API key available in `.env`. Use for both product SMS (OTP) AND human escalation. |
| **Facebook** | NO | User must create Facebook App and provide credentials. You use mock webhook payloads. |
| **GitHub** | YES | You can push code, create CI workflows. User's git config handles auth. |
| **Domain/DNS** | NO | User must configure custom domain. You document how to point it to Render. |

**When a key becomes available:**
1. User adds it to `.env.production`
2. You read it and use `update_environment_variables` via Render MCP to set it on the deployed service
3. The factory pattern auto-switches from mock to real — no code changes needed
4. Verify via `list_logs` that the service banner now shows the service as "Connected" instead of "MOCK"
5. Run integration tests against the real service

---

## Live Verification Protocol

Automated tests are NOT enough. After building any user-facing feature, you MUST verify it works by actually running the app and inspecting it. Think like a QA engineer, not just a developer.

### 1. Server Verification

After any server-side change:

```bash
# Start the server in background, capture logs
bun run dev:server &

# Wait for startup, then check logs
sleep 3
# Look for the startup banner — are all services initialized?
# Look for errors, warnings, unhandled rejections
```

**What to check in logs:**
- Server started on expected port
- MongoDB connected successfully
- All service factories initialized (check mock vs. real status)
- No unhandled errors or deprecation warnings
- tRPC routes registered

**After checking, test API endpoints directly:**
```bash
# Health check
curl http://localhost:3000/api/health

# tRPC smoke test — call a simple procedure
curl http://localhost:3000/api/trpc/health.ping

# Test auth flow
curl -X POST http://localhost:3000/api/auth/send-otp -d '{"phone": "+972501234567"}'

# Test lead creation
curl -X POST http://localhost:3000/api/trpc/leads.create -H "Authorization: Bearer ..." -d '...'
```

Always kill background server processes when done:
```bash
pkill -f "bun run dev:server" || true
```

### 2. UI Verification with Playwright MCP

**This is critical.** After building any UI feature, you MUST use the Playwright MCP tools to actually open a browser and verify the UI renders correctly.

**Startup sequence:**
```
1. Start server: bun run dev:server (background)
2. Start client: bun run dev:client (background)
3. Wait for both to be ready
4. Use Playwright MCP to navigate to http://localhost:5173
```

**After each UI feature, verify with Playwright:**

| Feature | What to Verify |
|---|---|
| **Auth pages** | Navigate to `/login` → take screenshot → verify phone input renders → fill form → submit → verify OTP page appears |
| **Dashboard** | Login → verify dashboard loads → take screenshot → check all widgets render → verify no console errors |
| **Leads board** | Navigate to `/leads` → take screenshot → verify Kanban columns render → verify drag handles exist → verify lead cards show data |
| **Lead detail** | Click a lead card → verify side panel opens → take screenshot → verify all fields render → verify activity timeline |
| **Knowledge base** | Navigate to `/knowledge-base` → take screenshot → verify upload area renders → verify document list |
| **Conversations** | Navigate to `/conversations` → take screenshot → verify chat list → click conversation → verify message bubbles render |
| **Settings** | Navigate to `/settings` → verify user management table → verify automation rules |
| **RTL layout** | On EVERY page: verify text is right-aligned, sidebar is on the right, layout flows RTL correctly |

**Playwright MCP workflow per page:**
```
1. browser_navigate → page URL
2. browser_snapshot → get accessibility tree, check structure
3. browser_take_screenshot → visual verification
4. browser_console_messages → check for JS errors, warnings, failed API calls
5. browser_network_requests → verify API calls succeeded (no 4xx/5xx)
6. browser_click / browser_fill_form → test interactions
7. browser_snapshot → verify state changed correctly
```

**If you see:**
- **Console errors** → fix immediately before moving on
- **Broken layout** → fix CSS/component issues
- **Missing data** → check if seed data loaded, check API responses
- **Network failures** → check server logs, verify tRPC routes
- **RTL issues** → fix Tailwind dir utilities, check component ordering

### 3. Database Verification

After any data operation (seeds, CRUD, migrations), verify the database directly:

```bash
# Use Prisma Studio to inspect data (opens browser UI)
bunx prisma studio &

# Or query directly via a script
bun run -e "
  import { prisma } from './packages/server/src/db/client';
  const orgs = await prisma.organization.findMany();
  console.log('Organizations:', orgs.length);
  const leads = await prisma.lead.findMany({ take: 5 });
  console.log('Sample leads:', JSON.stringify(leads, null, 2));
  const users = await prisma.user.findMany();
  console.log('Users:', users.length);
  await prisma.\$disconnect();
"
```

**What to check:**
- Seed data populated correctly (expected counts per collection)
- Relationships valid (lead.organizationId points to real org)
- Indexes created (check for query performance)
- No orphaned records
- Vector chunks exist after knowledge base processing

### 4. Integration Flow Tests

After completing each phase, run through the full user flow manually via Playwright:

**Phase 2 flow:** Open browser → navigate to login → enter phone → verify OTP page → enter `123456` → verify redirect to dashboard

**Phase 3 flow:** Login → navigate to leads → verify board loads with seed data → drag a lead to new column → verify status updated → open lead detail → edit a field → verify saved

**Phase 5 flow:** Login → navigate to conversations → open a conversation → type a message → send → verify it appears in chat → check server logs for green-api mock call

**Phase 6 flow:** Send a message as "customer" (via curl to webhook endpoint) → check server logs for RAG retrieval → check bot response in conversation UI → verify response references knowledge base content

### 5. Performance Spot Checks

Periodically (Phase 8+), check for obvious performance issues:

```bash
# Check API response times
time curl http://localhost:3000/api/trpc/leads.list
time curl http://localhost:3000/api/trpc/dashboard.summary

# Check for N+1 queries — enable Prisma query logging and look for repetitive queries
# In server config: prisma client with log: ['query']
```

Use `browser_network_requests` in Playwright to verify page loads complete within reasonable time.

---

## Quality Gates

Before marking ANY phase complete, ALL of these must pass:

**Automated:**
- [ ] `bun run lint` — zero errors
- [ ] `bun run typecheck` — zero errors
- [ ] `bun run test` — all tests pass
- [ ] `bun run build` — builds successfully
- [ ] All new code has corresponding tests

**Live verification:**
- [ ] Server starts without errors (check logs)
- [ ] UI renders correctly (Playwright screenshot taken and inspected)
- [ ] No console errors in browser (Playwright console_messages checked)
- [ ] No failed network requests (Playwright network_requests checked)
- [ ] Database state is correct (queried and verified)
- [ ] RTL layout verified on any new/changed pages
- [ ] Integration flow for the phase tested end-to-end via Playwright

**Documentation:**
- [ ] STATUS.md updated with current state
- [ ] Any Playwright screenshots that revealed bugs noted in STATUS.md

---

## STATUS.md Format

Maintain this file with the following structure:

```markdown
# CRM-AI Development Status

## Current Phase: [Phase N: Name]
## Last Updated: [ISO date]
## Last Completed Task: [description]

## Phase Checklist
- [x] Completed task
- [ ] Next task
- [ ] Future task

## Known Issues
- Issue description (severity: high/medium/low)

## Notes for Next Iteration
- Context that the next iteration needs to know
```

---

## Error Recovery

If you encounter errors:
1. Read the error message carefully
2. Search the codebase for related code
3. Search the web for the error message if unfamiliar
4. Use context7 to check library docs for correct API usage
5. Fix the root cause, not the symptom
6. Add a test that catches this error
7. Document the fix in STATUS.md under "Known Issues (Resolved)"

If you are stuck in a loop (same error 3+ times):
1. Step back and try a completely different approach
2. Document what you tried in STATUS.md
3. If truly blocked — **escalate to human via SMS** (see below)
4. Move to the next unblocked task while waiting

---

## Human Escalation Protocol (SMS)

You have access to the Micropay SMS API via `.env`. Use it to contact the project owner when you are **genuinely blocked** on something only a human can do.

### When to Send SMS

**SEND SMS for:**
- Missing API key that blocks an entire phase (e.g., "I need the OpenAI API key to build Phase 4")
- Third-party account creation needed (e.g., "Please create a MongoDB Atlas cluster and add the connection string to `.env.production`")
- Production approval needed (e.g., "Phase 11 complete — app is ready to deploy to production. Approve?")
- Irrecoverable error after 3+ attempts (e.g., "Build fails due to Bun compatibility issue, tried 3 approaches, need help")
- Security-sensitive action (e.g., "Need to set up Facebook App credentials — requires manual login to Meta Business Suite")

**DO NOT send SMS for:**
- Errors you can fix yourself (bugs, lint failures, test failures)
- Missing information you can find via WebSearch/WebFetch/context7
- Questions about architecture or design (make a decision and move on)
- Progress updates (that's what STATUS.md is for)

### How to Send SMS

Use the Micropay API directly via curl. The credentials are in `.env`.

**Micropay API Reference:**
- **Endpoint:** `POST https://www.micropay.co.il/ExtApi/ScheduleSms.php`
- **Content-Type:** `application/x-www-form-urlencoded`
- **Auth:** token-based (`post=2` + `token=...`)

**Required parameters:**

| Param | Value |
|---|---|
| `post` | `2` (required for token auth) |
| `token` | From `MICROPAY_SMS_TOKEN` in `.env` |
| `msg` | The message text (URL-encoded) |
| `list` | Recipient phone number(s), comma-separated |
| `from` | Sender phone number (any valid number) |

**Optional parameters:**

| Param | Value |
|---|---|
| `charset` | `iso-8859-8` for Hebrew text |
| `type` | `sms` |
| `desc` | Description/label for the message |

**Response:**
- Success: HTTP 200, body does NOT contain "ERROR"
- Failure: HTTP 200, body contains `ERROR --> Description: ...`

**Exact curl command:**

```bash
# Load env vars
source .env

# Send SMS to owner
curl -X POST "https://www.micropay.co.il/ExtApi/ScheduleSms.php" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data-urlencode "msg=[CRM-AI Loop] Your message here" \
  -d "post=2&token=${MICROPAY_SMS_TOKEN}&list=${OWNER_PHONE}&from=0501234567&type=sms"
```

**For Hebrew messages:**
```bash
curl -X POST "https://www.micropay.co.il/ExtApi/ScheduleSms.php" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data-urlencode "msg=[CRM-AI Loop] הודעה בעברית" \
  -d "post=2&token=${MICROPAY_SMS_TOKEN}&list=${OWNER_PHONE}&from=0501234567&type=sms&charset=iso-8859-8"
```

**Always verify the response** — check that the body does NOT contain "ERROR":
```bash
RESPONSE=$(curl -s -X POST "https://www.micropay.co.il/ExtApi/ScheduleSms.php" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data-urlencode "msg=[CRM-AI Loop] Phase 4 blocked - need OPENAI_API_KEY" \
  -d "post=2&token=${MICROPAY_SMS_TOKEN}&list=${OWNER_PHONE}&from=0501234567&type=sms")

if echo "$RESPONSE" | grep -q "ERROR"; then
  echo "SMS FAILED: $RESPONSE"
  # Log failure in STATUS.md, do not retry immediately
else
  echo "SMS sent successfully"
fi
```

### SMS Message Format

Keep messages short, actionable, and include what you need:

```
[CRM-AI Loop] Phase 4 blocked — need OPENAI_API_KEY.
Please add it to c:\work\crm-ai\.env and I'll continue automatically.
```

```
[CRM-AI Loop] Need MongoDB Atlas cluster.
Please create one (free tier is fine) and add DATABASE_URL to .env.production
```

```
[CRM-AI Loop] Deploy ready for review.
Server: https://crm-ai-server.onrender.com
Client: https://crm-ai-client.onrender.com
All tests pass. Reply OK to confirm.
```

```
[CRM-AI Loop] Stuck on Prisma/MongoDB connection.
Tried: connection string format, TLS config, IP whitelist.
Error: MongoServerSelectionError. Need your help.
See STATUS.md for full details.
```

### After Sending SMS

1. Log the SMS in STATUS.md under **"Awaiting Human Response"** with:
   - What was requested
   - When the SMS was sent
   - Which phase is blocked
2. **Do NOT wait** — continue working on the next unblocked task
3. At the start of each iteration, check if the requested resource is now available:
   ```bash
   # Check if a new key was added
   source .env
   echo "OPENAI_API_KEY: ${OPENAI_API_KEY:-(not set)}"
   echo "DATABASE_URL: ${DATABASE_URL:-(not set)}"
   # etc.
   ```
4. If the resource appeared, mark the blocker as resolved in STATUS.md and resume that phase

### Rate Limiting Yourself

- **Maximum 1 SMS per phase** for the same issue
- **Maximum 3 SMS per day** total
- If you already sent an SMS about a blocker and the key still isn't there next iteration, do NOT resend — just check `.env` silently and move on
- Track all sent SMS in STATUS.md to avoid duplicates:
  ```markdown
  ## SMS Log
  | Time | Message | Status |
  |---|---|---|
  | 2026-04-17T14:30 | Need OPENAI_API_KEY for Phase 4 | Awaiting |
  | 2026-04-17T16:00 | MongoDB Atlas cluster needed | Resolved ✓ |
  ```

---

## Completion

When ALL phases are complete and ALL quality gates pass:

<promise>CRM-AI COMPLETE</promise>

Output this promise tag only when the entire system is built, tested, deployed, and documented.
