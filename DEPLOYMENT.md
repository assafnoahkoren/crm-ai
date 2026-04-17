# CRM-AI Deployment Runbook

## Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Client     │────▶│   Server     │────▶│  MongoDB     │
│ (Static Site)│     │ (Web Service)│     │  (Atlas)     │
│  Render      │     │  Render      │     └──────────────┘
└──────────────┘     └──────┬───────┘
                           │
                    ┌──────┴───────┐
                    │  External    │
                    │  Services    │
                    ├──────────────┤
                    │ green-api    │
                    │ Micropay SMS │
                    │ OpenAI API   │
                    │ Facebook API │
                    └──────────────┘
```

## Deployment

### Prerequisites

1. MongoDB Atlas cluster (free tier is fine)
2. Render account with workspace selected
3. API keys in `.env.production` (optional — mock mode works without them)

### Deploy Server

```bash
# Via Render MCP or Dashboard
# Service: Web Service
# Build: cd packages/server && bun install && bunx prisma generate && bun build src/index.ts --outdir dist --target bun
# Start: cd packages/server && bun dist/index.js
# Health check: /api/health/live
```

### Deploy Client

```bash
# Via Render MCP or Dashboard
# Service: Static Site
# Build: cd packages/client && bun install && bun run build
# Publish: packages/client/dist
```

### Environment Variables

**Server:**
| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | MongoDB connection string |
| `BETTER_AUTH_SECRET` | Yes | Auth secret (generate: `openssl rand -hex 32`) |
| `BETTER_AUTH_URL` | Yes | Server URL (e.g., `https://crm-ai-server.onrender.com`) |
| `APP_URL` | Yes | Client URL |
| `PORT` | No | Server port (default: 3000) |
| `NODE_ENV` | No | `production` |
| `LOG_LEVEL` | No | `info` |
| `OPENAI_API_KEY` | No | For real embeddings + LLM (mock without) |
| `GREEN_API_INSTANCE_ID` | No | For real WhatsApp (mock without) |
| `GREEN_API_TOKEN` | No | For real WhatsApp |
| `MICROPAY_SMS_HOST` | No | SMS API host |
| `MICROPAY_SMS_TOKEN` | No | For real SMS OTP (mock without) |

**Client:**
| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | Yes | Server URL |

## Health Checks

```bash
# Liveness (always 200 if process alive)
curl https://crm-ai-server.onrender.com/api/health/live

# Readiness (returns status + uptime)
curl https://crm-ai-server.onrender.com/api/health
```

## Logs

- **Render Dashboard**: Service → Logs
- **Render MCP**: `list_logs` tool
- Server uses structured JSON logging (Pino)
- Filter by level: `info`, `warn`, `error`, `fatal`

## Rollback

1. Go to Render Dashboard → Service → Deploys
2. Find the last working deploy
3. Click "Redeploy"

## Scaling

Update via Render Dashboard or MCP:

- `numInstances`: 1 (default), increase for higher load
- Health check path: `/api/health/live`

## Database

- **Migrations**: `cd packages/server && bunx prisma db push`
- **Seed data**: `cd packages/server && bun run src/db/seed.ts`
- **Studio**: `cd packages/server && bunx prisma studio`
- **Backups**: MongoDB Atlas handles automated daily backups

## Adding/Rotating API Keys

1. Update the key in `.env.production`
2. Use Render MCP `update_environment_variables` or Dashboard
3. Service auto-restarts with new key
4. Check startup banner in logs to verify service mode changed from MOCK to Connected

## Incident Response

1. Check `/api/health` — is the server responding?
2. Check Render logs for errors (`list_logs`)
3. Check MongoDB Atlas dashboard for connection issues
4. If deploy is broken, rollback to previous deploy
5. If stuck, SMS the owner (see PROMPT.md escalation protocol)
