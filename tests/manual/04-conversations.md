# Test Plan: Conversations (WhatsApp Chat)

## Feature Overview

Split-view chat interface with conversation list sidebar and message area. Supports WhatsApp messaging via green-api, bot/agent messages, bot toggle.

## URLs

- **Local:** http://localhost:5173/conversations
- **Production:** https://crm-ai-client.onrender.com/conversations

## Prerequisites

- Authenticated user session
- Conversations with messages (mock data available)

---

## Test Cases

### Happy Path

#### CONV-001: Conversations page loads

- **Steps:** Navigate to /conversations
- **Expected:** Split view: left sidebar with conversation list, right area empty or with selected chat

#### CONV-002: Conversation list display

- **Steps:** View sidebar conversation list
- **Expected:** Each item shows: lead name, phone, last message preview, timestamp, unread badge

#### CONV-003: Select conversation

- **Steps:** Click on a conversation in the list
- **Expected:** Selected conversation highlighted (blue-50 bg), messages load in right panel

#### CONV-004: Message display - customer

- **Steps:** View inbound customer messages
- **Expected:** White background with border, right-aligned (RTL context)

#### CONV-005: Message display - agent

- **Steps:** View outbound agent messages
- **Expected:** Blue background (bg-blue-100), left-aligned

#### CONV-006: Message display - bot

- **Steps:** View outbound bot messages
- **Expected:** Purple background (bg-purple-100), "Bot" label above message

#### CONV-007: Send message

- **Steps:** Type message in input field, press Enter or click Send
- **Expected:** Message appears in chat, input field cleared

#### CONV-008: Message timestamps

- **Steps:** View message timestamps
- **Expected:** Shows HH:mm format

#### CONV-009: Unread count badge

- **Steps:** View conversation with unread messages
- **Expected:** Blue rounded badge with unread count

#### CONV-010: Bot status indicator

- **Steps:** View conversation header
- **Expected:** Green "Bot Active" or gray "Bot Inactive" indicator

### Edge Cases

#### CONV-011: Empty message prevention

- **Steps:** Try sending empty message (just spaces)
- **Expected:** Send button disabled, message not sent

#### CONV-012: Long message

- **Steps:** Send or view a very long message (5000 chars)
- **Expected:** Message wraps properly, max-width constraint (max-w-xs)

#### CONV-013: Search conversations

- **Steps:** Type in sidebar search box
- **Expected:** Conversation list filters by lead name or phone

#### CONV-014: No conversations

- **Steps:** View conversations page with empty state
- **Expected:** Empty state message, no crash

#### CONV-015: Phone number LTR

- **Steps:** Check phone display in conversation list
- **Expected:** Phone numbers displayed left-to-right

#### CONV-016: Conversation hover effect

- **Steps:** Hover over non-selected conversation
- **Expected:** Light gray background hover effect

#### CONV-017: Mobile responsive

- **Steps:** Resize to mobile width
- **Expected:** Either sidebar or chat visible (not both), navigation between them

#### CONV-018: Message chronological order

- **Steps:** View messages in a conversation
- **Expected:** Messages in chronological order, newest at bottom

#### CONV-019: Send with Enter key

- **Steps:** Type message, press Enter
- **Expected:** Message sent (same as clicking Send button)

#### CONV-020: Bot toggle

- **Steps:** Toggle bot status in conversation header
- **Expected:** Bot status indicator changes (active/inactive)
