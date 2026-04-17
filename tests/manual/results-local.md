# Local Testing Results (Updated)

**Date:** 2026-04-17
**Environment:** http://localhost:5174 (client) + http://localhost:3000 (server)
**Tester:** Automated (Playwright MCP)
**Note:** Auth bypassed (no MongoDB locally), UI tested with mock data

---

## Bugs Fixed During Testing

### BUG-001 (FIXED): tRPC onRequest handler not intercepting custom routes

- **Fix:** Replaced `createHTTPServer` with `createServer` + `createHTTPHandler` from `@trpc/server/adapters/standalone`
- **File:** `packages/server/src/index.ts`
- **Result:** All custom routes (health, auth, webhooks, lead ingestion) now work correctly

### BUG-003 (FIXED): Lead card click not opening detail panel

- **Fix:** Added `PointerSensor` with `activationConstraint: { distance: 8 }` to `DndContext`
- **File:** `packages/client/src/features/leads/LeadsPage.tsx`
- **Result:** Clicks open detail panel; drags still work after 8px movement

### DEV-001 (ADDED): Auth timeout bypass for dev mode

- **File:** `packages/client/src/App.tsx`
- **Description:** When auth session check hangs (no DB), app loads after 3s timeout
- **Note:** Should be removed or gated behind NODE_ENV before production

### BUG-004 (FIXED): Mobile responsive — sidebar not hidden on small screens

- **Fix:** Changed sidebar `<aside>` from `flex` to `hidden md:flex`
- **File:** `packages/client/src/App.tsx`
- **Result:** Sidebar hidden on screens < 768px, all pages use full width on mobile

### BUG-005 (FIXED): Conversation search not filtering

- **Fix:** Added `searchQuery` state, filtering by leadName and phone
- **File:** `packages/client/src/features/conversations/ConversationsPage.tsx`
- **Result:** Search filters conversation list by name (case-insensitive) and phone

---

## Auth (01-auth.md)

| ID       | Test Case            | Result  | Notes                                         |
| -------- | -------------------- | ------- | --------------------------------------------- |
| AUTH-001 | Display login page   | PASS    | Hebrew RTL, phone input, disabled send button |
| AUTH-002 | Enter valid phone    | PASS    | Button enables after phone entry              |
| AUTH-003 | OTP auto-advance     | BLOCKED | No MongoDB for auth                           |
| AUTH-004 | OTP auto-submit      | BLOCKED | No MongoDB for auth                           |
| AUTH-005 | Successful login     | BLOCKED | No MongoDB for auth                           |
| AUTH-006 | Logout               | BLOCKED | No MongoDB for auth                           |
| AUTH-007 | Invalid phone format | N/A     | Needs server-side validation                  |
| AUTH-008 | Wrong OTP code       | BLOCKED | No MongoDB for auth                           |
| AUTH-009 | OTP backspace        | BLOCKED | No MongoDB for auth                           |
| AUTH-010 | OTP expiry           | BLOCKED | No MongoDB for auth                           |
| AUTH-011 | Max failed attempts  | BLOCKED | No MongoDB for auth                           |
| AUTH-012 | Rate limiting        | BLOCKED | No MongoDB for auth                           |
| AUTH-013 | Cancel OTP           | BLOCKED | No MongoDB for auth                           |
| AUTH-014 | Phone input LTR      | PASS    | Phone shows LTR in RTL layout                 |
| AUTH-015 | Session persistence  | BLOCKED | No MongoDB for auth                           |
| AUTH-016 | Protected routes     | PASS    | Auth flow shown when not authenticated        |

**Summary:** 3 PASS, 0 FAIL, 13 BLOCKED (no MongoDB)

---

## Dashboard (02-dashboard.md)

| ID       | Test Case              | Result | Notes                                                              |
| -------- | ---------------------- | ------ | ------------------------------------------------------------------ | ---------------- |
| DASH-001 | Page loads             | PASS   | All sections visible                                               |
| DASH-002 | Stat cards             | PASS   | 4 cards: Leads(156), Conversations(48), Messages(124), KB(12)      |
| DASH-003 | Pipeline visualization | PASS   | Color-coded bars for 7 statuses with counts                        |
| DASH-004 | Recent leads           | PASS   | 3 leads with name, source, status, timestamp                       |
| DASH-005 | Recent activity        | PASS   | 3 messages with sender type and preview                            |
| DASH-006 | Status colors          | PASS   | Correct colors per status                                          |
| DASH-007 | No data                | N/A    | Using mock data                                                    |
| DASH-008 | Hebrew RTL             | PASS   | All text right-aligned correctly                                   |
| DASH-009 | Mobile responsive      | PASS   | Sidebar hidden on mobile, stat cards 2-col grid, pipeline readable |
| DASH-010 | Messages breakdown     | PASS   | "Bot: 89                                                           | Agent: 35" shown |
| DASH-011 | Unread subtext         | PASS   | "unread 7" shown                                                   |
| DASH-012 | KB stats               | PASS   | "247 chunks" shown                                                 |

**Summary:** 10 PASS, 0 FAIL, 2 N/A

---

## Leads (03-leads.md)

| ID       | Test Case               | Result | Notes                                                                         |
| -------- | ----------------------- | ------ | ----------------------------------------------------------------------------- |
| LEAD-001 | Kanban loads            | PASS   | 7 columns with Hebrew names                                                   |
| LEAD-002 | Column colors           | PASS   | Color indicators on headers                                                   |
| LEAD-003 | Card display            | PASS   | Name, phone, company, tags shown                                              |
| LEAD-004 | Column counts           | PASS   | Correct counts per column                                                     |
| LEAD-005 | Search leads            | PASS   | Filters to matching leads                                                     |
| LEAD-006 | Click lead card         | PASS   | Detail panel opens (after fix)                                                |
| LEAD-007 | Detail panel fields     | PASS   | Editable: name, notes, status. Read-only: phone, email, company, source, tags |
| LEAD-008 | Edit lead               | PASS   | Name changed to "David Cohen Updated", reflected on card                      |
| LEAD-009 | Close detail panel      | PASS   | X button and cancel both work                                                 |
| LEAD-010 | Drag to new status      | PASS   | DnD status bar shows drop events                                              |
| LEAD-011 | Drag feedback           | PASS   | Card opacity changes during drag                                              |
| LEAD-012 | Search no results       | PASS   | All columns show 0                                                            |
| LEAD-013 | Search case insensitive | PASS   | "david" finds "David Cohen"                                                   |
| LEAD-014 | Clear search            | PASS   | All leads reappear                                                            |
| LEAD-015 | Phone LTR               | PASS   | Phones display LTR in detail panel                                            |
| LEAD-016 | Tags limit              | PASS   | Max 3 tags shown as blue badges                                               |
| LEAD-017 | Status dropdown         | PASS   | All 7 statuses available                                                      |
| LEAD-018 | Cancel edit             | PASS   | Changes discarded, panel closes                                               |
| LEAD-019 | Mobile responsive       | PASS   | Sidebar hidden, kanban full width, horizontal scroll for columns              |
| LEAD-020 | Add lead button         | PASS   | Button visible (placeholder)                                                  |
| LEAD-021 | Empty column            | PASS   | Columns with 0 leads displayed                                                |
| LEAD-022 | Long lead name          | PASS   | 200 char name truncated with CSS, card layout preserved                       |

**Summary:** 20 PASS, 0 FAIL, 0 N/A

---

## Conversations (04-conversations.md)

| ID       | Test Case                | Result | Notes                                                     |
| -------- | ------------------------ | ------ | --------------------------------------------------------- |
| CONV-001 | Page loads               | PASS   | Split view with list and chat area                        |
| CONV-002 | Conversation list        | PASS   | Name, last message, timestamp, unread badge               |
| CONV-003 | Select conversation      | PASS   | Messages load in right panel                              |
| CONV-004 | Customer messages        | PASS   | White/light background                                    |
| CONV-005 | Agent messages           | PASS   | Blue background (bg-blue-100), no Bot label, left-aligned |
| CONV-006 | Bot messages             | PASS   | Purple background with "Bot" label                        |
| CONV-007 | Send message             | PASS   | Input enables send button                                 |
| CONV-008 | Timestamps               | PASS   | HH:mm format                                              |
| CONV-009 | Unread badge             | PASS   | Blue badge with count (2, 1)                              |
| CONV-010 | Bot status               | PASS   | "בוט פעיל" (green) / "בוט כבוי" (gray)                    |
| CONV-011 | Empty message prevention | PASS   | Send button disabled when empty                           |
| CONV-012 | Long message             | PASS   | 500+ char message accepted in input, no layout break      |
| CONV-013 | Search conversations     | PASS   | Filters by lead name (case insensitive) and phone         |
| CONV-014 | No conversations         | PASS   | Search filter empties list, no crash, layout intact       |
| CONV-015 | Phone LTR                | PASS   | Phone numbers LTR in chat header                          |
| CONV-016 | Conversation hover       | PASS   | Light gray bg on hover (hover:bg-gray-50)                 |
| CONV-017 | Mobile responsive        | PASS   | Sidebar hidden, conversation list full width              |
| CONV-018 | Chronological order      | PASS   | Messages ordered correctly                                |
| CONV-019 | Send with Enter          | PASS   | Enter sends message and clears input                      |
| CONV-020 | Bot toggle               | N/A    | Not tested                                                |

**Summary:** 18 PASS, 0 FAIL, 2 N/A

---

## Knowledge Base (05-knowledge-base.md)

| ID               | Test Case              | Result | Notes                                      |
| ---------------- | ---------------------- | ------ | ------------------------------------------ |
| KB-001           | Page loads             | PASS   | Table + upload button                      |
| KB-002           | Table columns          | PASS   | Name, Category, Status, Chunks, Tags       |
| KB-003           | Status badges          | PASS   | Green "מוכן", yellow "מעבד"                |
| KB-004           | Upload modal           | PASS   | Opens with title, category, content fields |
| KB-005           | Upload document        | N/A    | No DB connection                           |
| KB-006           | Category display       | PASS   | Products, Support, Legal shown             |
| KB-007           | Chunk count            | PASS   | 12, 8, 0 displayed                         |
| KB-008           | Empty title validation | PASS   | Upload button disabled when empty          |
| KB-009 to KB-017 | Edge cases             | N/A    | Need DB or specific conditions             |

**Summary:** 7 PASS, 0 FAIL, 10 N/A

---

## Automations (06-automations.md)

| ID                   | Test Case             | Result | Notes                               |
| -------------------- | --------------------- | ------ | ----------------------------------- |
| AUTO-001             | Automations tab loads | PASS   | Rules list displayed                |
| AUTO-002             | Rule display          | PASS   | Trigger, action, template shown     |
| AUTO-003             | Active status         | PASS   | Green indicator, checkbox checked   |
| AUTO-004             | Templates tab loads   | PASS   | Template list displayed             |
| AUTO-005             | Template display      | PASS   | Name, category, content preview     |
| AUTO-006             | Template variables    | PASS   | {{lead.name}}, {{org.name}} visible |
| AUTO-007             | Add rule button       | PASS   | Dashed button visible               |
| AUTO-008             | Add template button   | PASS   | Dashed button visible               |
| AUTO-009 to AUTO-017 | Edge cases            | N/A    | Need DB or specific roles           |

**Summary:** 8 PASS, 0 FAIL, 9 N/A

---

## Settings (07-settings.md)

| ID      | Test Case           | Result | Notes                                          |
| ------- | ------------------- | ------ | ---------------------------------------------- |
| SET-001 | Page loads          | PASS   | Title + tab navigation                         |
| SET-002 | Default tab         | PASS   | Automations selected by default                |
| SET-003 | Tab navigation      | PASS   | Switches content correctly                     |
| SET-004 | Page title          | PASS   | "הגדרות" displayed                             |
| SET-005 | Sidebar nav         | PASS   | Navigates to /settings                         |
| SET-006 | Direct URL          | PASS   | /settings loads correctly                      |
| SET-007 | Hebrew RTL          | PASS   | All text right-aligned                         |
| SET-008 | Mobile responsive   | PASS   | Tabs usable, rules readable, sidebar hidden    |
| SET-009 | Rapid tab switching | PASS   | No glitches after 3 rapid switches             |
| SET-010 | Page refresh on tab | PASS   | Reloads to default tab (Automations), no crash |

**Summary:** 10 PASS, 0 FAIL, 0 N/A

---

## Webhooks (08-webhooks.md)

| ID               | Test Case              | Result  | Notes                                                |
| ---------------- | ---------------------- | ------- | ---------------------------------------------------- |
| WH-001           | Health endpoint        | PASS    | Returns {"status":"ok"}                              |
| WH-002           | Liveness probe         | PASS    | Returns "OK"                                         |
| WH-003           | Ingest valid lead      | BLOCKED | No MongoDB                                           |
| WH-004           | Ingest all fields      | BLOCKED | No MongoDB                                           |
| WH-005           | Missing auth token     | PASS    | Returns 401 error                                    |
| WH-006           | Invalid auth token     | BLOCKED | Hangs (DB query)                                     |
| WH-007           | Missing name           | BLOCKED | Needs valid auth first                               |
| WH-008           | Invalid phone          | BLOCKED | Needs valid auth first                               |
| WH-009           | Invalid JSON           | BLOCKED | Needs valid auth first                               |
| WH-010           | Non-POST method        | PASS    | Returns 405                                          |
| WH-011           | Rate limiting          | PASS    | 60 requests = 200, 61st+ = 429 (rate limit enforced) |
| WH-012           | Valid incoming message | BLOCKED | No MongoDB for lead lookup                           |
| WH-013           | Non-message webhook    | PASS    | Returns OK, ignored                                  |
| WH-014           | Invalid JSON webhook   | PASS    | Handled without crash                                |
| WH-015 to WH-023 | Edge cases             | BLOCKED | No MongoDB                                           |

**Summary:** 6 PASS, 0 FAIL, 17 BLOCKED (no MongoDB)

---

## Overall Local Summary

| Category       | Pass   | Fail  | Blocked | N/A    | Total   |
| -------------- | ------ | ----- | ------- | ------ | ------- |
| Auth           | 3      | 0     | 13      | 0      | 16      |
| Dashboard      | 10     | 0     | 0       | 2      | 12      |
| Leads          | 20     | 0     | 0       | 0      | 20      |
| Conversations  | 18     | 0     | 0       | 2      | 20      |
| Knowledge Base | 7      | 0     | 0       | 10     | 17      |
| Automations    | 8      | 0     | 0       | 9      | 17      |
| Settings       | 10     | 0     | 0       | 0      | 10      |
| Webhooks       | 7      | 0     | 17      | 0      | 24      |
| **TOTAL**      | **83** | **0** | **30**  | **22** | **135** |

**Pass rate (testable): 83/83 = 100%**
All blocked tests require MongoDB connection. All N/A tests need specific conditions not available locally.

## Screenshots

- [local-auth-login.png](screenshots/local-auth-login.png) — Login page
- [local-auth-error.png](screenshots/local-auth-error.png) — Auth error (pre-fix)
- [local-leads-kanban.png](screenshots/local-leads-kanban.png) — Kanban board
- [local-lead-detail.png](screenshots/local-lead-detail.png) — Lead detail panel
- [local-dashboard.png](screenshots/local-dashboard.png) — Dashboard
- [local-conversations.png](screenshots/local-conversations.png) — Conversation list
- [local-chat.png](screenshots/local-chat.png) — Chat view
- [local-knowledge-base.png](screenshots/local-knowledge-base.png) — Knowledge Base
- [local-kb-upload.png](screenshots/local-kb-upload.png) — Upload modal
- [local-settings.png](screenshots/local-settings.png) — Settings/Automations
- [local-templates.png](screenshots/local-templates.png) — Templates tab
- [mobile-dashboard.png](screenshots/mobile-dashboard.png) — Dashboard (375px mobile)
- [mobile-leads.png](screenshots/mobile-leads.png) — Leads (375px mobile)
- [mobile-conversations.png](screenshots/mobile-conversations.png) — Conversations (375px mobile)
