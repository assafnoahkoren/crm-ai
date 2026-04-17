# Test Plan: Authentication (Phone OTP)

## Feature Overview

Phone-based authentication using Better Auth with OTP verification via Micropay SMS. Two-step flow: phone entry → 6-digit OTP verification.

## URLs

- **Local:** http://localhost:5173
- **Production:** https://crm-ai-client.onrender.com

## Prerequisites

- App running (local or prod)
- Valid phone number for OTP
- SMS provider configured (or mock mode for local dev)

---

## Test Cases

### Happy Path

#### AUTH-001: Display login page

- **Steps:** Navigate to app URL while logged out
- **Expected:** Login page shown with phone input, "Send Code" button, Hebrew RTL layout

#### AUTH-002: Enter valid phone number

- **Steps:** Type `+972521234567` in phone field, click "Send Code"
- **Expected:** OTP page shown with 6 input boxes, phone stored for verification

#### AUTH-003: OTP auto-advance focus

- **Steps:** On OTP page, type digit "1"
- **Expected:** Focus automatically moves to second input box

#### AUTH-004: OTP auto-submit on 6th digit

- **Steps:** Enter all 6 correct OTP digits
- **Expected:** Form auto-submits after 6th digit, no need to click button

#### AUTH-005: Successful login

- **Steps:** Enter correct OTP code
- **Expected:** Page reloads, sidebar + main content visible, redirected to /leads

#### AUTH-006: Logout

- **Steps:** Click logout button in sidebar
- **Expected:** Session cleared, login page shown again

### Edge Cases

#### AUTH-007: Invalid phone format

- **Steps:** Enter "abc" or "123" in phone field, submit
- **Expected:** Validation error shown, OTP not sent

#### AUTH-008: Wrong OTP code

- **Steps:** Enter incorrect 6-digit code
- **Expected:** Error message shown, all OTP fields cleared, focus returns to first box

#### AUTH-009: OTP backspace navigation

- **Steps:** On OTP page with some digits entered, press Backspace on empty field
- **Expected:** Focus moves to previous field

#### AUTH-010: OTP expiry (5 minutes)

- **Steps:** Request OTP, wait 5+ minutes, enter code
- **Expected:** Error message (code expired), must request new code

#### AUTH-011: Max failed attempts (3)

- **Steps:** Enter wrong OTP 3 times
- **Expected:** OTP invalidated, must request new code

#### AUTH-012: Rate limiting

- **Steps:** Send 60+ OTP requests rapidly from same IP
- **Expected:** 429 Too Many Requests response

#### AUTH-013: Cancel OTP and go back

- **Steps:** On OTP page, click "Cancel" or back button
- **Expected:** Return to phone entry page

#### AUTH-014: Phone input LTR direction

- **Steps:** Inspect phone input field direction
- **Expected:** Input has `dir="ltr"` even in RTL (Hebrew) layout

#### AUTH-015: Session persistence

- **Steps:** Login successfully, close tab, reopen app URL
- **Expected:** Still logged in (session cookie persists)

#### AUTH-016: Protected routes without auth

- **Steps:** Navigate directly to /leads, /dashboard while logged out
- **Expected:** Auth flow shown instead of page content
