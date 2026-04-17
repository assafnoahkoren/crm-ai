# Test Plan: Dashboard

## Feature Overview

Analytics overview page showing KPIs (total leads, conversations, messages today, knowledge base stats), lead pipeline visualization, recent leads, and recent activity.

## URLs

- **Local:** http://localhost:5173/dashboard
- **Production:** https://crm-ai-client.onrender.com/dashboard

## Prerequisites

- Authenticated user session
- Some leads/conversations/messages in the system (or mock data)

---

## Test Cases

### Happy Path

#### DASH-001: Dashboard page loads

- **Steps:** Click "Dashboard" in sidebar or navigate to /dashboard
- **Expected:** Page loads with stat cards, pipeline visualization, recent sections

#### DASH-002: Stat cards display

- **Steps:** View top section of dashboard
- **Expected:** 4 stat cards visible: Total Leads, Conversations, Messages Today, Knowledge Base

#### DASH-003: Lead pipeline visualization

- **Steps:** View pipeline section
- **Expected:** Color-coded progress bars for each status (new/contacted/qualified/proposal/negotiation/won/lost) with counts and percentages

#### DASH-004: Recent leads section

- **Steps:** View recent leads list
- **Expected:** Shows recent leads with name, source, status badge, timestamp

#### DASH-005: Recent activity section

- **Steps:** View recent activity list
- **Expected:** Shows recent messages with sender indicator, lead name, message preview, timestamp

#### DASH-006: Status colors match

- **Steps:** Compare pipeline status colors
- **Expected:** new=blue, contacted=yellow, qualified=purple, proposal=indigo, negotiation=orange, won=green, lost=red

### Edge Cases

#### DASH-007: Dashboard with no data

- **Steps:** Login as new org with no leads
- **Expected:** Stats show 0, pipeline bars empty, no recent items (no crash)

#### DASH-008: Hebrew RTL layout

- **Steps:** View dashboard in Hebrew locale
- **Expected:** All text right-aligned, layout mirrors correctly

#### DASH-009: Mobile responsive

- **Steps:** Resize browser to mobile width (375px)
- **Expected:** Stat cards stack vertically, pipeline readable, no horizontal scroll

#### DASH-010: Messages Today count

- **Steps:** Check "Messages Today" card
- **Expected:** Shows total with bot/agent breakdown (e.g., "89 Bot | 35 Agent")

#### DASH-011: Unread conversations subtext

- **Steps:** Check Conversations card
- **Expected:** Shows total conversations with unread count as subtext

#### DASH-012: Knowledge Base stats

- **Steps:** Check Knowledge Base card
- **Expected:** Shows document count with chunk count as subtext
