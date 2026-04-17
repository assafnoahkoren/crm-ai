# Production Testing Results

**Date:** 2026-04-17
**Environment:**

- Client: https://crm-ai-client.onrender.com
- Server: https://crm-ai-server-s5zj.onrender.com
  **Tester:** Automated (Playwright MCP)

---

## CRITICAL ISSUES FOUND

### BUG-001 (PROD): tRPC onRequest handler not intercepting custom routes

- **Same as local** — all custom HTTP routes (`/api/auth/*`, `/api/health`, `/api/v1/leads/ingest`, `/api/webhooks/whatsapp`) return tRPC 404 errors
- **Evidence:** `curl https://crm-ai-server-s5zj.onrender.com/api/health` → `{"error":{"message":"No procedure found on path \"api/health\""}}`

### BUG-002 (PROD): Client static site returns 404

- **Severity:** CRITICAL
- **Description:** The production client at `https://crm-ai-client.onrender.com` returns HTTP 404 with empty body
- **Response Header:** `x-render-routing: static-no-asset` — indicates Render found no static assets to serve
- **Impact:** The entire frontend is inaccessible in production
- **Likely Cause:** Static site build artifacts not deployed or build output directory misconfigured on Render

---

## Test Results

All tests BLOCKED due to:

1. Client returns 404 (no frontend available)
2. Server custom routes broken (tRPC bug)

| Category       | Pass  | Fail  | Blocked |
| -------------- | ----- | ----- | ------- |
| Auth           | 0     | 0     | 16      |
| Dashboard      | 0     | 0     | 12      |
| Leads          | 0     | 0     | 22      |
| Conversations  | 0     | 0     | 20      |
| Knowledge Base | 0     | 0     | 17      |
| Automations    | 0     | 0     | 17      |
| Settings       | 0     | 0     | 10      |
| Webhooks       | 0     | 2     | 21      |
| **TOTAL**      | **0** | **2** | **135** |

### Webhook Tests Executed

| ID               | Test Case       | Result  | Notes                     |
| ---------------- | --------------- | ------- | ------------------------- |
| WH-001           | Health endpoint | FAIL    | Returns tRPC 404          |
| WH-002           | Liveness probe  | FAIL    | Returns tRPC 404          |
| WH-003 to WH-023 | All other       | BLOCKED | Custom routes unreachable |

---

## Comparison: Local vs Production

| Issue                       | Local                     | Production            |
| --------------------------- | ------------------------- | --------------------- |
| tRPC route interception bug | YES                       | YES                   |
| Client loads                | YES (login page renders)  | NO (404)              |
| Auth flow                   | BLOCKED (CORS + tRPC bug) | BLOCKED (no frontend) |
| Custom HTTP routes          | BROKEN                    | BROKEN                |

---

## Recommendations

### Immediate Fixes Required

1. **FIX BUG-001: tRPC onRequest handler**
   - The `createHTTPServer` from `@trpc/server/adapters/standalone` does not support `onRequest` returning early to prevent tRPC from processing
   - **Fix Option A:** Use `@trpc/server/adapters/node-http` with Express/Fastify and register custom routes separately
   - **Fix Option B:** Use a middleware-based approach (e.g., `express` + `createExpressMiddleware`) where custom routes are registered BEFORE the tRPC middleware
   - **Fix Option C:** Check if the tRPC standalone adapter version supports a return value from `onRequest` to skip tRPC processing

2. **FIX BUG-002: Deploy client static site**
   - Verify Render static site configuration: publish directory should point to `packages/client/dist`
   - Ensure build command runs: `cd packages/client && npm run build`
   - Check if the build artifacts are being generated correctly

3. **After fixes, re-run all 137 test cases**
