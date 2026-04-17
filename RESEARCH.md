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

### Authentication
- Each instance has: `idInstance` (unique number) + `apiTokenInstance` (access key)
- Get these from the GREEN-API console after creating an instance
- Must scan QR code from WhatsApp mobile app to authorize

### API URL Pattern
```
POST {{apiUrl}}/waInstance{{idInstance}}/{{method}}/{{apiTokenInstance}}
```

Example: `POST https://api.green-api.com/waInstance1234/sendMessage/abc123token`

### Key Endpoints

**Sending Messages:**
| Method | Endpoint | Description |
|---|---|---|
| POST | `/sendMessage` | Send text message |
| POST | `/sendFileByUrl` | Send file via external URL |
| POST | `/sendFileByUpload` | Upload and send file |
| POST | `/sendLocation` | Send location |
| POST | `/sendContact` | Send contact card |
| POST | `/forwardMessages` | Forward existing messages |

**Send Text Example:**
```typescript
// POST {{apiUrl}}/waInstance{{idInstance}}/sendMessage/{{apiTokenInstance}}
{
  "chatId": "972521234567@c.us",  // phone@c.us for private, @g.us for groups
  "message": "Hello from CRM-AI!"
}
```

**Receiving Messages — Two Methods:**

1. **HTTP API (polling):** Call `ReceiveNotification` → process → call `DeleteNotification`
2. **Webhook Endpoint:** Set a public URL via `SetSettings` → GREEN-API pushes events to it

**Webhook Events:**
- `incomingMessageReceived` — new message from contact
- `outgoingMessageStatus` — sent/delivered/read status updates
- `stateInstanceChanged` — instance connection status
- `incomingCall` — incoming WhatsApp call

**Instance Management:**
| Method | Endpoint | Description |
|---|---|---|
| POST | `/getSettings` | Get instance config |
| POST | `/setSettings` | Set webhook URL, enable event types |
| POST | `/getStateInstance` | Check if connected to WhatsApp |
| POST | `/reboot` | Restart instance |
| POST | `/logout` | Disconnect WhatsApp |
| POST | `/qr` | Get QR code for scanning |

### Chat ID Format
- Private chat: `{phoneNumber}@c.us` (e.g., `972521234567@c.us`)
- Group chat: `{groupId}@g.us`
- Phone number without `+` prefix, include country code

### Node.js SDK
```bash
npm install @green-api/whatsapp-api-client
```

```typescript
import whatsAppClient from '@green-api/whatsapp-api-client';

const restAPI = whatsAppClient.restAPI({
  idInstance: process.env.GREEN_API_INSTANCE_ID,
  apiTokenInstance: process.env.GREEN_API_TOKEN,
});

// Send message
await restAPI.message.sendMessage('972521234567@c.us', null, 'Hello!');

// Get instance state
const state = await restAPI.instance.getStateInstance();
```

### Setup Steps
1. Create account at green-api.com
2. Create an instance in the console
3. Scan QR code from WhatsApp app on phone
4. Get `idInstance` + `apiTokenInstance` from console
5. Configure webhook URL via `setSettings`

### Pricing
- Free tier available (limited messages)
- Paid plans based on message volume

---

## 7. Better Auth — Phone/OTP Authentication

### Installation
```bash
bun add better-auth
```

### Server Configuration
```typescript
import { betterAuth } from "better-auth";
import { phoneNumber } from "better-auth/plugins";

export const auth = betterAuth({
  database: prismaAdapter(prisma),  // or MongoDB adapter
  plugins: [
    phoneNumber({
      sendOTP: async ({ phoneNumber, code }, ctx) => {
        // Send OTP via Micropay
        await micropayProvider.sendOtp(phoneNumber, code);
      },
      otpLength: 6,           // OTP code length
      expiresIn: 300,          // 5 minutes expiry
      allowedAttempts: 3,      // max verification tries
      signUpOnVerification: {  // auto-create user on first verify
        getTempEmail: (phone) => `${phone}@crm-ai.app`,
        getTempName: (phone) => phone,
      },
    }),
  ],
});
```

### Configuration Options
| Option | Type | Default | Description |
|---|---|---|---|
| `otpLength` | number | 6 | Characters in OTP code |
| `expiresIn` | number | 300 | Seconds until OTP expires |
| `allowedAttempts` | number | 3 | Max verification tries before code invalidated |
| `sendOTP` | function | required | Callback to send OTP via SMS provider |
| `verifyOTP` | function | optional | External verification service (e.g., Twilio Verify) |
| `signUpOnVerification` | object | optional | Auto-create account on first verification |
| `phoneNumberValidator` | function | optional | Custom phone format validation |
| `callbackOnVerification` | function | optional | Post-verification hook |
| `requireVerification` | boolean | optional | Enforce verification before signin |

### Client Setup
```typescript
import { createAuthClient } from "better-auth/client";
import { phoneNumberClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: "http://localhost:3000",
  plugins: [phoneNumberClient()],
});
```

### Client API Methods

**Send OTP:**
```typescript
await authClient.phoneNumber.sendOtp({
  phoneNumber: "+972521234567",
});
```

**Verify OTP (creates session):**
```typescript
const { data, error } = await authClient.phoneNumber.verify({
  phoneNumber: "+972521234567",
  code: "123456",
  disableSession: false,    // set true to prevent auto-login
  updatePhoneNumber: false, // set true to update existing user's phone
});
```

**Sign in with phone + password (if using password flow):**
```typescript
await authClient.signIn.phoneNumber({
  phoneNumber: "+972521234567",
  password: "user-password",
  rememberMe: true,
});
```

### Database Fields Added
Run `npx auth migrate` to add:
- `phoneNumber` (string, optional) on User table
- `phoneNumberVerified` (boolean, optional) on User table

### Auth Flow for CRM-AI
1. User enters phone number on login page
2. Client calls `authClient.phoneNumber.sendOtp({ phoneNumber })`
3. Server generates 6-digit OTP, calls `sendOTP` → Micropay sends SMS
4. User enters OTP on verification page
5. Client calls `authClient.phoneNumber.verify({ phoneNumber, code })`
6. If `signUpOnVerification` is set, new user auto-created on first verify
7. Session created automatically (JWT cookie)
8. Redirect to dashboard

### Integration with Micropay
```typescript
phoneNumber({
  sendOTP: async ({ phoneNumber, code }) => {
    const response = await fetch(
      "https://www.micropay.co.il/ExtApi/ScheduleSms.php",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          post: "2",
          token: process.env.MICROPAY_SMS_TOKEN!,
          msg: `Your CRM-AI verification code: ${code}`,
          list: phoneNumber.replace("+", ""),
          from: "0501234567",
          type: "sms",
        }),
      }
    );
    const text = await response.text();
    if (text.includes("ERROR")) {
      throw new Error(`SMS failed: ${text}`);
    }
  },
}),
```

### Brute Force Protection
- After 3 failed attempts, OTP is invalidated (returns 403)
- User must request a new code
- Built-in, no configuration needed

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
