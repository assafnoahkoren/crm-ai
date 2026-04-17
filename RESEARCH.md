# CRM-AI Research Findings

## 1. tRPC Setup with Bun

### Standalone HTTP Server

tRPC provides a standalone adapter that works with Node.js built-in HTTP server (also compatible with Bun):

```typescript
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import { z } from 'zod';

const t = initTRPC.context<Context>().create();

const appRouter = t.router({
  greet: t.procedure
    .input(z.object({ name: z.string() }))
    .query(({ input }) => ({ greeting: `Hello, ${input.name}!` })),
});

export type AppRouter = typeof appRouter;

createHTTPServer({
  router: appRouter,
  createContext,
  middleware: cors(),
}).listen(3000);
```

### WebSocket Server (for subscriptions)

Separate WebSocket server using `ws` library with `applyWSSHandler`:

```typescript
import { applyWSSHandler } from '@trpc/server/adapters/ws';
import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 3001 });
const handler = applyWSSHandler({
  wss,
  router: appRouter,
  createContext,
  keepAlive: { enabled: true, pingMs: 30000, pongWaitMs: 5000 },
});
```

### Key Patterns
- Export `AppRouter` type from server, import in client for end-to-end type safety
- Context function runs per-request — use it for auth, DB connections
- Middleware pattern for logging, auth guards, org scoping
- Zod for input validation on every procedure

---

## 2. Prisma with MongoDB

### Schema Configuration

```prisma
datasource db {
  provider = "mongodb"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}
```

### MongoDB-Specific Patterns

**ID fields** — must use `@map("_id")` and `@db.ObjectId`:
```prisma
model User {
  id    String @id @default(auto()) @map("_id") @db.ObjectId
  email String
}
```

**Embedded documents** — use `type` instead of `model`:
```prisma
type Address {
  street String
  city   String
  zip    String
}

model Organization {
  id       String  @id @default(auto()) @map("_id") @db.ObjectId
  name     String
  address  Address  // embedded document
}
```

**Relations** — use `@db.ObjectId` on foreign keys:
```prisma
model Lead {
  id             String @id @default(auto()) @map("_id") @db.ObjectId
  organizationId String @db.ObjectId
  organization   Organization @relation(fields: [organizationId], references: [id])
}
```

**Many-to-many** — requires explicit ID arrays on both sides:
```prisma
model Lead {
  id     String   @id @default(auto()) @map("_id") @db.ObjectId
  tagIDs String[] @db.ObjectId
  tags   Tag[]    @relation(fields: [tagIDs], references: [id])
}
model Tag {
  id      String   @id @default(auto()) @map("_id") @db.ObjectId
  leadIDs String[] @db.ObjectId
  leads   Lead[]   @relation(fields: [leadIDs], references: [id])
}
```

### Limitations with MongoDB
- No `autoincrement()` — use `@default(auto())` for ObjectId
- No `@unique` on composite types (embedded docs)
- No `@@unique` across relations
- Migrations work differently — use `prisma db push` instead of `prisma migrate`
- Full-text search available with `@@fulltext` index

---

## 3. RAG & Chunking Strategy

### Recommended Baseline
- **Chunk size:** 400–512 tokens with 10–20% overlap (50–100 tokens)
- **Splitter:** `RecursiveCharacterTextSplitter` as starting point
- **Embedding model:** OpenAI `text-embedding-3-small` (1536 dimensions)

### Strategy by Document Type
| Document Type | Strategy |
|---|---|
| FAQ / Knowledge articles | 256–512 tokens (factoid queries) |
| Long-form docs / PDFs | 512–1024 tokens (analytical queries) |
| Mixed content | Start at 512, measure and iterate |

### Advanced: Parent-Document Retrieval
- Embed small child chunks (256 tokens) for precise retrieval
- When a child matches, send the larger parent section (1024+ tokens) to LLM
- Delivers best of both worlds: precise matching + full context

### Key Findings
- Recursive chunking delivers 85–90% recall at 400 tokens
- Semantic chunking reaches 91–92% but costs significantly more
- **Recommendation:** Start with recursive character splitting, upgrade only if metrics demand it
- Top-K retrieval: start with K=5, adjust based on response quality

### Vector Storage with MongoDB Atlas
- MongoDB Atlas supports vector search natively
- Store embeddings as `Float[]` in Prisma schema
- Create vector search index via Atlas UI or API
- Query using `$vectorSearch` aggregation pipeline

---

## 4. CRM Lead Management — Kanban Best Practices

### Pipeline Design
- Default stages: `New → Contacted → Qualified → Proposal → Negotiation → Won → Lost`
- Allow organizations to customize stage names and order
- Color-code stages for quick visual scanning

### Kanban UX Patterns
- **Drag-and-drop** between columns to change status
- **WIP limits** (optional) — warn when a column has too many leads
- **Aggregate values** — show count and total deal value per column
- **Quick actions** — inline editing, assign agent, add note without opening detail
- **Filters** — by agent, source, tags, date range
- **Sort** — by created date, last activity, lead score

### Lead Qualification (BANT Framework)
- **B**udget — can the lead afford the product?
- **A**uthority — is this the decision maker?
- **N**eed — does the lead have a clear need?
- **T**iming — when does the lead plan to buy?

### Data Model Insights
- Track lead **source** (Facebook, Website, Manual, API) for attribution
- Store **sourceMetadata** (campaign ID, UTM params) for analytics
- **Activity timeline** is critical — every status change, message, note logged with timestamp and actor
- **Lead scoring** (AI-computed, 0–100) helps prioritize

---

## 5. Micropay SMS API (Verified & Tested)

**Endpoint:** `POST https://www.micropay.co.il/ExtApi/ScheduleSms.php`
**Content-Type:** `application/x-www-form-urlencoded`

### Parameters
| Param | Required | Description |
|---|---|---|
| `post` | Yes | `2` for token auth |
| `token` | Yes | API token |
| `msg` | Yes | Message text (URL-encoded) |
| `list` | Yes | Recipient phone(s), comma-separated |
| `from` | Yes | Sender phone number |
| `type` | No | `sms` |
| `charset` | No | `iso-8859-8` for Hebrew |

### Response
- Success: `OK <message_id>`
- Error: `ERROR --> Description: ...`

### Verified curl
```bash
curl -s -X POST "https://www.micropay.co.il/ExtApi/ScheduleSms.php" \
  --data-urlencode "msg=Your OTP is: 123456" \
  --data-urlencode "post=2" \
  --data-urlencode "token=${MICROPAY_SMS_TOKEN}" \
  --data-urlencode "list=0521234567" \
  --data-urlencode "from=0501234567" \
  --data-urlencode "type=sms"
```

---

## 6. green-api.com WhatsApp API

*Research in progress — agent collecting API docs.*

### Known from website
- REST API for sending/receiving WhatsApp messages
- Instance-based model (each org gets an instance ID + token)
- Webhook-based message receiving
- Supports: text, image, document, location messages
- Official Node.js SDK: `@green-api/whatsapp-api-client`

**TODO:** Document exact endpoints, webhook payload format, and SDK usage once research completes.

---

## 7. Better Auth

*Research in progress — agent collecting docs.*

### Known from docs
- Auth library for TypeScript applications
- Supports phone/OTP authentication
- Plugin-based architecture (phone, organization, etc.)
- Session management with JWT
- Custom adapter support for SMS providers

**TODO:** Document phone auth setup, custom SMS provider integration, and tRPC middleware once research completes.

---

## 8. Turborepo Monorepo Structure

### Recommended turbo.json
```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {},
    "typecheck": {
      "dependsOn": ["^build"]
    },
    "test": {
      "dependsOn": ["^build"]
    }
  }
}
```

### Package Structure
- `packages/shared` — Zod schemas, TypeScript types, constants (built first)
- `packages/server` — depends on shared, exports tRPC AppRouter type
- `packages/client` — depends on shared, imports AppRouter type from server

### Key Practices
- Shared package exports Zod validators used by both client and server
- tRPC input schemas defined in shared package
- Use `workspace:*` protocol for internal dependencies
- TypeScript project references for fast incremental builds

---

## 9. shadcn/ui + Tailwind CSS + RTL

### shadcn/ui Setup with Vite
- Use `npx shadcn-ui@latest init` to initialize
- Configure `components.json` with aliases
- Components are copied into your project (not installed as dependency)
- Customize via Tailwind CSS classes

### RTL Support
```html
<html dir="rtl" lang="he">
```

Tailwind CSS RTL utilities:
```css
/* Use logical properties */
.ms-4 { margin-inline-start: 1rem; }  /* margin-left in LTR, margin-right in RTL */
.me-4 { margin-inline-end: 1rem; }
.ps-4 { padding-inline-start: 1rem; }
.pe-4 { padding-inline-end: 1rem; }
.text-start { text-align: start; }     /* left in LTR, right in RTL */
.text-end { text-align: end; }
```

### i18next Configuration
```typescript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

i18n.use(initReactI18next).init({
  resources: {
    he: { translation: require('./locales/he.json') },
    en: { translation: require('./locales/en.json') },
  },
  lng: 'he',  // default Hebrew
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});
```

### RTL Auto-Switching
```typescript
i18n.on('languageChanged', (lng) => {
  const dir = ['he', 'ar'].includes(lng) ? 'rtl' : 'ltr';
  document.documentElement.dir = dir;
  document.documentElement.lang = lng;
});
```

---

## 10. Key Architectural Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Monorepo tool | Turborepo | Fast, simple, good DX with Bun |
| API layer | tRPC | End-to-end type safety, no codegen needed |
| Database ORM | Prisma | Best TypeScript DX, MongoDB support |
| UI components | shadcn/ui | Customizable, not a dependency, Tailwind-based |
| Auth | Better Auth | Modern, plugin-based, phone auth support |
| Chunking | Recursive 512 tokens / 50 overlap | Best cost/performance ratio per benchmarks |
| Vector DB | MongoDB Atlas Vector Search | Same DB, no extra infrastructure |
| State management | React Query (via tRPC) | Server state cached and synced automatically |
| Form validation | Zod | Shared with tRPC input validation |
| Styling | Tailwind CSS with logical properties | Native RTL support |
