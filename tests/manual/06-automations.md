# Test Plan: Automations

## Feature Overview

Automation rules engine and message templates. Rules trigger actions on events (status change, no response, schedule). Templates support variable interpolation for personalized messaging.

## URLs

- **Local:** http://localhost:5173/settings (Automations tab)
- **Production:** https://crm-ai-client.onrender.com/settings (Automations tab)

## Prerequisites

- Authenticated user session with admin/owner role
- Located under Settings page, Automations tab

---

## Test Cases

### Happy Path

#### AUTO-001: Automations tab loads

- **Steps:** Navigate to /settings, click "Automations" tab
- **Expected:** List of automation rules displayed

#### AUTO-002: Rule display

- **Steps:** View automation rule in list
- **Expected:** Shows trigger type, trigger config, associated template, active/inactive status

#### AUTO-003: Active status indicator

- **Steps:** View rule with active status
- **Expected:** Green indicator for active rules

#### AUTO-004: Templates tab loads

- **Steps:** Click "Templates" tab
- **Expected:** List of message templates displayed

#### AUTO-005: Template display

- **Steps:** View template in list
- **Expected:** Shows template name, category badge, content preview in monospace

#### AUTO-006: Template variables

- **Steps:** View template content with variables
- **Expected:** Variables like {{lead.name}}, {{org.name}} shown in template

#### AUTO-007: Add rule button

- **Steps:** Look for "Add Rule" button
- **Expected:** Dashed button visible for adding new automation rules

#### AUTO-008: Add template button

- **Steps:** Look for "Add Template" button
- **Expected:** Dashed button visible for adding new templates

### Edge Cases

#### AUTO-009: No automation rules

- **Steps:** View automations tab with no rules
- **Expected:** Empty state or "no rules" message, add button still visible

#### AUTO-010: No templates

- **Steps:** View templates tab with no templates
- **Expected:** Empty state or "no templates" message, add button still visible

#### AUTO-011: Tab switching

- **Steps:** Switch between Automations and Templates tabs
- **Expected:** Correct content loads for each tab, no flicker

#### AUTO-012: Long template content

- **Steps:** View template with very long content (2000 chars)
- **Expected:** Content truncated in preview or scrollable

#### AUTO-013: Hebrew template content

- **Steps:** View template with Hebrew text
- **Expected:** RTL rendering, text readable

#### AUTO-014: Multiple rules for same trigger

- **Steps:** View multiple rules with same trigger type
- **Expected:** All rules listed, distinguishable by action/config

#### AUTO-015: Inactive rule visual

- **Steps:** View inactive automation rule
- **Expected:** Visually distinct from active (gray indicator)

#### AUTO-016: Agent role access

- **Steps:** Login as agent (not admin/owner), view automations
- **Expected:** Can view but cannot create/edit/delete (read-only)

#### AUTO-017: Mobile responsive

- **Steps:** Resize to mobile width
- **Expected:** Tabs usable, rules/templates readable, no overflow
