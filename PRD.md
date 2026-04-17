# CRM-AI — Product Requirements Document

## 1. Product Overview

**CRM-AI** is an AI-powered Customer Relationship Management platform designed for small-to-medium businesses in Israel. It combines traditional CRM lead management with an intelligent WhatsApp-based communication layer, powered by a RAG (Retrieval-Augmented Generation) knowledge base. The system enables organizations to manage leads, automate customer interactions via WhatsApp, and leverage AI to provide accurate, context-aware responses based on the organization's own knowledge base.

### 1.1 Vision

Replace fragmented workflows (spreadsheets, manual WhatsApp messaging, disconnected knowledge bases) with a single, AI-driven CRM that automates lead nurturing and customer communication — while keeping a human in the loop when needed.

### 1.2 Target Users

- **Business Owners / Managers** — overview of leads, pipeline health, team performance
- **Sales Representatives / Agents** — day-to-day lead management and customer conversations
- **Organization Admins** — system configuration, user management, knowledge base curation

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Bun |
| Language | TypeScript (strict mode, end-to-end) |
| Client | React (Vite + React Router) |
| UI Components | shadcn/ui + Tailwind CSS |
| API Layer | tRPC (end-to-end type safety) |
| Database | MongoDB (via Prisma ORM) |
| Vector Database | MongoDB Atlas Vector Search (or Pinecone — TBD) |
| Authentication | Better Auth (phone/SMS-based) |
| SMS Provider | Micropay SMS API |
| WhatsApp Integration | green-api.com |
| AI / Embeddings | OpenAI API (GPT-4o + text-embedding-3-small) |
| I18N | i18next (with RTL support) |
| Linting | ESLint + typescript-eslint (pre-commit enforcement via Husky + lint-staged) |
| Monorepo | Turborepo (packages: `client`, `server`, `shared`) |

---

## 3. Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                    Client (React)                    │
│  shadcn/ui · i18next (RTL) · tRPC client            │
└──────────────────────┬──────────────────────────────┘
                       │ tRPC (HTTP + WebSocket)
┌──────────────────────▼──────────────────────────────┐
│                   Server (Bun)                       │
│  tRPC router · Better Auth · Business Logic          │
│  ┌────────────┐ ┌──────────────┐ ┌───────────────┐  │
│  │ Lead Mgmt  │ │ WhatsApp Svc │ │ AI / RAG Svc  │  │
│  └────────────┘ └──────────────┘ └───────────────┘  │
└───┬──────────────────┬───────────────┬──────────────┘
    │                  │               │
┌───▼───┐    ┌────────▼────────┐  ┌───▼──────────┐
│MongoDB│    │  green-api.com  │  │  OpenAI API  │
│(Prisma)│   │  (WhatsApp)     │  │  (LLM + Emb) │
└───┬───┘    └─────────────────┘  └──────────────┘
    │
┌───▼──────────────┐
│ Vector DB        │
│ (Atlas / Pinecone)│
└──────────────────┘
```

---

## 4. Authentication & User Management

### 4.1 Authentication Flow

- **Phone-based authentication** via Better Auth
- User enters phone number → system sends OTP via Micropay SMS API → user verifies OTP → session created
- JWT-based session management with refresh tokens
- No email/password flow (phone-only by design)

### 4.2 User Roles

| Role | Permissions |
|---|---|
| **Owner** | Full system access. Manage billing, organization settings, users. |
| **Admin** | Manage users, leads, knowledge base. Configure automations. |
| **Agent** | View/manage assigned leads. Send/receive WhatsApp messages. View knowledge base. |

### 4.3 User Management

- Owner/Admin can invite users by phone number
- Each user belongs to a single **Organization** (multi-tenant architecture)
- Users (agents) can be assigned to specific leads
- Activity log per user (messages sent, leads updated, etc.)

### 4.4 Data Model — Users & Org

```
Organization {
  id
  name
  slug
  plan
  settings (WhatsApp config, AI config, branding)
  createdAt
}

User {
  id
  organizationId
  phone
  name
  role: Owner | Admin | Agent
  avatar
  isActive
  lastLoginAt
  createdAt
}
```

---

## 5. Core Features

### 5.1 Dashboard

The main landing page after login. Provides a high-level overview of business health.

**Widgets:**

| Widget | Description |
|---|---|
| Lead Pipeline Summary | Count of leads per status (New → Contacted → Qualified → Proposal → Won/Lost) |
| Leads Over Time | Line chart — new leads per day/week/month |
| Conversion Funnel | Funnel visualization of lead progression |
| Active Conversations | Count of ongoing WhatsApp threads (with unread indicator) |
| Agent Performance | Table — messages sent, leads converted per agent |
| Recent Activity | Timeline feed of latest actions across the org |
| AI Bot Stats | Messages handled by bot vs. escalated to human |

**Requirements:**
- All widgets respect the current user's role (agents see only their own data)
- Date range filter (7d / 30d / 90d / custom)
- Real-time updates via tRPC subscriptions (WebSocket)

---

### 5.2 Leads Management (Monday-style Board)

A Kanban-style board for managing leads through the sales pipeline, inspired by Monday.com's UX.

#### 5.2.1 Board View

- **Kanban columns** representing lead statuses (customizable per org)
- Default statuses: `New` → `Contacted` → `Qualified` → `Proposal` → `Negotiation` → `Won` → `Lost`
- Drag-and-drop to change lead status
- Color-coded labels / tags
- Inline editing of lead fields directly on the card

#### 5.2.2 Table View

- Spreadsheet-style view (alternative to Kanban)
- Sortable, filterable columns
- Bulk actions (assign agent, change status, delete)
- Column customization (show/hide, reorder)

#### 5.2.3 Lead Card

```
Lead {
  id
  organizationId
  source: Facebook | Website | Manual | API
  sourceMetadata (campaign ID, form ID, UTM params, etc.)
  status
  name
  phone
  email (optional)
  company (optional)
  notes
  tags: string[]
  assignedToUserId
  customFields: Record<string, any>
  score (AI-computed lead quality score, 0-100)
  conversationId (link to WhatsApp thread)
  createdAt
  updatedAt
}
```

#### 5.2.4 Lead Detail Panel

Side panel that opens on card click:
- Full lead information (editable)
- Activity timeline (status changes, messages, notes)
- WhatsApp conversation preview (with "open full conversation" link)
- Attached files / documents
- AI-generated lead summary

#### 5.2.5 External Lead Ingestion

**Facebook Lead Ads:**
- Integration via Facebook Marketing API (webhook)
- Map Facebook form fields → Lead fields
- Auto-create lead on form submission
- Store campaign/ad metadata for attribution

**External Website / API:**
- Provide a REST endpoint: `POST /api/v1/leads/ingest`
- API key authentication per organization
- Webhook URL for third-party form builders (Typeform, Jotform, etc.)
- Embeddable HTML form snippet (optional)

---

### 5.3 Knowledge Base

A document management system that powers the AI bot's responses through RAG.

#### 5.3.1 Upload & Management

- Upload documents: PDF, DOCX, TXT, Markdown, CSV
- Add content manually (rich text editor)
- Organize by categories / folders
- Tag documents for targeted retrieval
- Version history per document

#### 5.3.2 Processing Pipeline

```
Upload → Extract Text → Chunk (512 tokens, 50 overlap)
  → Generate Embeddings (OpenAI text-embedding-3-small)
  → Store in Vector DB with metadata
```

- Chunking strategy: sliding window (512 tokens, 50-token overlap)
- Metadata stored per chunk: documentId, category, tags, position
- Re-process on document update (delete old vectors, re-embed)

#### 5.3.3 RAG Retrieval

- On incoming WhatsApp message, generate embedding of the query
- Retrieve top-K relevant chunks (K=5, configurable)
- Pass chunks as context to LLM along with conversation history
- Confidence threshold — if similarity score < threshold, escalate to human

#### 5.3.4 Data Model

```
KnowledgeDocument {
  id
  organizationId
  title
  content (original text)
  fileUrl (if uploaded file)
  mimeType
  category
  tags: string[]
  chunkCount
  status: Processing | Ready | Error
  uploadedByUserId
  createdAt
  updatedAt
}

KnowledgeChunk {
  id
  documentId
  organizationId
  content (chunk text)
  embedding: float[] (vector)
  position (chunk index within document)
  metadata
}
```

---

### 5.4 WhatsApp Integration (green-api.com)

#### 5.4.1 Conversation Interface

- **Chat UI** within the CRM — agents can read and send WhatsApp messages without leaving the platform
- Real-time message sync via green-api webhooks
- Message types supported: text, image, document, voice (display only), location
- Conversation list with unread badges, last message preview, timestamp
- Link each conversation to a Lead record

#### 5.4.2 Bot (AI Auto-Responder)

- For each incoming message, the bot:
  1. Identifies the lead by phone number
  2. Checks lead status → determines if bot should respond or stay silent
  3. Retrieves relevant knowledge base chunks via RAG
  4. Generates response using LLM (GPT-4o) with:
     - System prompt (configurable per org)
     - Knowledge base context
     - Conversation history (last N messages)
     - Lead metadata (name, status, custom fields)
  5. Sends response via green-api
- **Handoff to human**: bot can flag a conversation for human attention and stop auto-responding
- **Response delay**: configurable delay (e.g., 5-15 seconds) to feel natural

#### 5.4.3 Status-Based Automation

Configurable automation rules per lead status:

| Trigger | Action |
|---|---|
| Lead created (status = New) | Send welcome message template |
| Status changed to Contacted | Send follow-up message after X hours |
| Status changed to Qualified | Send pricing/proposal template |
| No response for X days | Send reminder message |
| Lead marked as Won | Send thank-you / onboarding message |
| Lead marked as Lost | Send "we're here if you change your mind" message |

- Templates support variable interpolation: `{{lead.name}}`, `{{agent.name}}`, `{{org.name}}`
- Automations can be enabled/disabled per status
- Scheduling: support delayed sends (e.g., "send 2 hours after status change")

#### 5.4.4 Data Model

```
Conversation {
  id
  organizationId
  leadId
  whatsappChatId (green-api identifier)
  phone
  isBot: boolean (bot is active on this conversation)
  lastMessageAt
  unreadCount
  createdAt
}

Message {
  id
  conversationId
  direction: Inbound | Outbound
  sender: Bot | Agent | Customer
  senderUserId (if agent)
  type: Text | Image | Document | Voice | Location
  content
  mediaUrl
  metadata (green-api message metadata)
  status: Sent | Delivered | Read | Failed
  createdAt
}

AutomationRule {
  id
  organizationId
  trigger: StatusChange | NoResponse | Schedule
  triggerConfig (status, delay, etc.)
  action: SendTemplate | AssignAgent | ChangeStatus
  actionConfig (templateId, userId, etc.)
  isActive
  createdAt
}

MessageTemplate {
  id
  organizationId
  name
  content (with {{variable}} placeholders)
  category
  language
  createdAt
}
```

---

## 6. I18N & RTL

- **Default language**: Hebrew (RTL)
- **Supported languages**: Hebrew, English, Arabic (future)
- All UI text externalized via i18next translation files
- RTL layout handled via Tailwind CSS `dir` utilities and `rtl:` variants
- Date/time formatting: locale-aware (Day.js or date-fns)
- Phone number formatting: international format with libphonenumber

---

## 7. Code Quality & DX

### 7.1 Linting & Formatting

- **ESLint** with `typescript-eslint` (strict config)
- **Prettier** for formatting
- Pre-commit enforcement via **Husky** + **lint-staged**
- Pre-commit hooks: lint, type-check, format-check
- CI pipeline runs the same checks

### 7.2 Project Structure

```
crm-ai/
├── packages/
│   ├── client/           # React app (Vite)
│   │   ├── src/
│   │   │   ├── components/    # Shared UI components
│   │   │   ├── features/      # Feature modules
│   │   │   │   ├── auth/
│   │   │   │   ├── dashboard/
│   │   │   │   ├── leads/
│   │   │   │   ├── conversations/
│   │   │   │   ├── knowledge-base/
│   │   │   │   └── settings/
│   │   │   ├── hooks/
│   │   │   ├── lib/           # tRPC client, i18n setup
│   │   │   ├── locales/       # Translation files
│   │   │   └── styles/
│   │   └── package.json
│   ├── server/           # Bun server
│   │   ├── src/
│   │   │   ├── routers/       # tRPC routers
│   │   │   ├── services/      # Business logic
│   │   │   │   ├── ai/        # RAG, embeddings, LLM
│   │   │   │   ├── whatsapp/  # green-api integration
│   │   │   │   ├── sms/       # Micropay integration
│   │   │   │   └── leads/     # Lead ingestion, scoring
│   │   │   ├── db/            # Prisma client, seeds
│   │   │   ├── auth/          # Better Auth config
│   │   │   ├── jobs/          # Background jobs (automation, reminders)
│   │   │   └── webhooks/      # Facebook, green-api webhooks
│   │   └── package.json
│   └── shared/           # Shared types, validators (Zod schemas)
│       └── package.json
├── prisma/
│   └── schema.prisma
├── turbo.json
├── package.json
├── .husky/
└── .eslintrc.cjs
```

---

## 8. Non-Functional Requirements

| Requirement | Target |
|---|---|
| **Response Time** | API responses < 200ms (p95), AI responses < 5s |
| **Availability** | 99.5% uptime |
| **Security** | All data encrypted at rest and in transit. Phone numbers hashed in logs. OWASP top-10 compliance. |
| **Multi-tenancy** | Full data isolation between organizations. All queries scoped by organizationId. |
| **Scalability** | Support 50 concurrent organizations, 10K leads per org, 100K messages per org |
| **Audit Log** | All state-changing operations logged with actor, timestamp, and diff |
| **Rate Limiting** | Per-org rate limits on API, WhatsApp sends, and AI calls |
| **Backup** | Daily automated MongoDB backups with 30-day retention |

---

## 9. MVP Scope (Phase 1)

The first release focuses on core CRM + WhatsApp bot functionality:

1. **Auth** — Phone/OTP login, organization creation, user invites
2. **Leads Board** — Kanban view with drag-and-drop, basic filters, lead detail panel
3. **Manual Lead Creation** — Add leads via UI
4. **Facebook Lead Ingestion** — Webhook integration for Facebook Lead Ads
5. **Knowledge Base** — Upload documents, process into vector DB
6. **WhatsApp Chat** — Send/receive messages via green-api, linked to leads
7. **AI Bot** — Auto-respond using RAG knowledge base
8. **Status Automations** — Basic template messages on status change
9. **Dashboard** — Pipeline summary, active conversations, recent activity
10. **I18N** — Hebrew (RTL) as default, English as secondary

### Out of Scope for MVP

- Custom fields builder for leads
- Advanced reporting / analytics export
- API for external website lead ingestion (simple webhook only)
- Arabic language support
- Mobile app
- Billing / subscription management
- AI lead scoring

---

## 10. Future Phases

| Phase | Features |
|---|---|
| **Phase 2** | External API for lead ingestion, custom fields, advanced filters, AI lead scoring |
| **Phase 3** | Multi-channel (SMS, Email), advanced analytics, embeddable forms |
| **Phase 4** | Mobile app (React Native), workflow builder (visual automation editor) |
| **Phase 5** | Marketplace integrations (Google Ads, CRM imports), billing system |
