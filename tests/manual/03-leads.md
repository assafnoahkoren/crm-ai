# Test Plan: Leads (Kanban Board)

## Feature Overview

Visual lead management with drag-and-drop Kanban board. 7 status columns, lead cards with details, search/filter, lead detail panel, CRUD operations.

## URLs

- **Local:** http://localhost:5173/leads
- **Production:** https://crm-ai-client.onrender.com/leads

## Prerequisites

- Authenticated user session
- Leads in the system (mock data available)

---

## Test Cases

### Happy Path

#### LEAD-001: Kanban board loads

- **Steps:** Navigate to /leads
- **Expected:** 7 columns visible (new, contacted, qualified, proposal, negotiation, won, lost) with lead cards

#### LEAD-002: Column status colors

- **Steps:** View column headers
- **Expected:** Each column has correct color coding (new=blue, contacted=yellow, etc.)

#### LEAD-003: Lead card display

- **Steps:** View any lead card on the board
- **Expected:** Shows lead name, phone, company (if set), source, tags (max 3 badges)

#### LEAD-004: Lead count per column

- **Steps:** View column headers
- **Expected:** Each column shows count of leads in parentheses

#### LEAD-005: Search leads

- **Steps:** Type a lead name in search box
- **Expected:** Board filters to show only matching leads (by name, phone, or company)

#### LEAD-006: Click lead card

- **Steps:** Click on any lead card
- **Expected:** Detail panel slides in from right with full lead info

#### LEAD-007: Lead detail panel fields

- **Steps:** Open lead detail panel
- **Expected:** Shows editable: name, notes, status dropdown. Read-only: phone, email, company, source, tags

#### LEAD-008: Edit lead in detail panel

- **Steps:** Change name in detail panel, click Save
- **Expected:** Lead updates, panel closes, card reflects changes

#### LEAD-009: Close detail panel

- **Steps:** Click X button or backdrop
- **Expected:** Panel closes, board visible

#### LEAD-010: Drag lead to new status

- **Steps:** Drag a lead card from "new" column to "contacted" column
- **Expected:** Card moves to new column, column counts update, visual feedback during drag

### Edge Cases

#### LEAD-011: Drag feedback

- **Steps:** Start dragging a lead card
- **Expected:** Card opacity reduces to 0.5, target column highlights with blue ring

#### LEAD-012: Search with no results

- **Steps:** Search for "xyznonexistent"
- **Expected:** All columns empty, no crash, clear visual that no results found

#### LEAD-013: Search case insensitive

- **Steps:** Search for "john" when lead is "John Doe"
- **Expected:** Lead found and displayed

#### LEAD-014: Clear search

- **Steps:** Clear search box
- **Expected:** All leads reappear in correct columns

#### LEAD-015: Phone number LTR

- **Steps:** Check phone display on lead card/detail
- **Expected:** Phone numbers displayed left-to-right even in RTL layout

#### LEAD-016: Tags display limit

- **Steps:** View lead with many tags
- **Expected:** Max 3 tags shown as blue pill badges

#### LEAD-017: Status dropdown in detail panel

- **Steps:** Open detail panel, click status dropdown
- **Expected:** All 7 statuses available as options

#### LEAD-018: Cancel edit in detail panel

- **Steps:** Change name, click Cancel instead of Save
- **Expected:** Changes discarded, panel closes

#### LEAD-019: Mobile responsive

- **Steps:** Resize to mobile width
- **Expected:** Kanban board scrollable horizontally, cards readable

#### LEAD-020: Add lead button

- **Steps:** Click "Add Lead" button in header
- **Expected:** Add lead form/modal appears (or placeholder if not implemented)

#### LEAD-021: Empty column

- **Steps:** View a status column with no leads
- **Expected:** Column visible with count 0, droppable area still works

#### LEAD-022: Long lead name

- **Steps:** View lead with very long name (200 chars)
- **Expected:** Name truncated or wrapped, card layout preserved
