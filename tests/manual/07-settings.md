# Test Plan: Settings

## Feature Overview

Settings page with tabbed interface for managing automations and templates. Currently serves as the container for automation management. User/org management not yet implemented.

## URLs

- **Local:** http://localhost:5173/settings
- **Production:** https://crm-ai-client.onrender.com/settings

## Prerequisites

- Authenticated user session

---

## Test Cases

### Happy Path

#### SET-001: Settings page loads

- **Steps:** Navigate to /settings
- **Expected:** Settings page with tab navigation (Automations | Templates)

#### SET-002: Default tab

- **Steps:** Navigate to /settings
- **Expected:** Default tab selected and content visible

#### SET-003: Tab navigation

- **Steps:** Click between Automations and Templates tabs
- **Expected:** Tab content switches, active tab visually highlighted

#### SET-004: Settings page title

- **Steps:** View page header
- **Expected:** "Settings" title displayed

#### SET-005: Sidebar navigation

- **Steps:** Click "Settings" in sidebar
- **Expected:** Navigates to /settings, menu item highlighted

### Edge Cases

#### SET-006: Direct URL to settings

- **Steps:** Type /settings URL directly
- **Expected:** Page loads correctly with default tab

#### SET-007: Hebrew RTL layout

- **Steps:** View settings page in Hebrew
- **Expected:** All text right-aligned, tabs flow right-to-left

#### SET-008: Mobile responsive

- **Steps:** Resize to mobile width
- **Expected:** Tab buttons wrap or scroll, content readable

#### SET-009: Rapid tab switching

- **Steps:** Click between tabs quickly
- **Expected:** No visual glitches, correct content always shown

#### SET-010: Page refresh on tab

- **Steps:** Select Templates tab, refresh page
- **Expected:** Page reloads (may return to default tab)
