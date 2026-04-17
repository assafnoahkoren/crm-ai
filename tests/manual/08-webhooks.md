# Test Plan: Webhooks

## Feature Overview

External integration endpoints: lead ingestion API (POST /api/v1/leads/ingest) and WhatsApp webhook (POST /api/webhooks/whatsapp). Server-side only, no UI — tested via HTTP requests.

## URLs

- **Local API:** http://localhost:3000
- **Production API:** https://crm-ai-server-s5zj.onrender.com

## Prerequisites

- Server running (local or prod)
- API key configured in organization settings (for lead ingestion)
- curl or HTTP client available

---

## Test Cases

### Health Check

#### WH-001: Health endpoint

- **Steps:** `GET /api/health`
- **Expected:** 200 OK with JSON `{"status":"ok","uptime":...}`

#### WH-002: Liveness probe

- **Steps:** `GET /api/health/live`
- **Expected:** 200 OK with "OK" text

### Lead Ingestion

#### WH-003: Ingest lead with valid payload

- **Steps:** POST to `/api/v1/leads/ingest` with Bearer token and valid JSON body (name, phone)
- **Expected:** 201 Created with lead ID

#### WH-004: Ingest lead with all fields

- **Steps:** POST with name, phone, email, company, source, metadata
- **Expected:** 201 Created, all fields stored

#### WH-005: Missing auth token

- **Steps:** POST without Authorization header
- **Expected:** 401 Unauthorized

#### WH-006: Invalid auth token

- **Steps:** POST with `Authorization: Bearer invalid_token`
- **Expected:** 403 Forbidden

#### WH-007: Missing required field (name)

- **Steps:** POST with valid auth but missing name field
- **Expected:** 400 Bad Request with validation error

#### WH-008: Invalid phone format

- **Steps:** POST with phone "abc"
- **Expected:** 400 Bad Request with phone validation error

#### WH-009: Invalid JSON body

- **Steps:** POST with malformed JSON
- **Expected:** 400 Bad Request

#### WH-010: Non-POST method

- **Steps:** GET /api/v1/leads/ingest
- **Expected:** 405 Method Not Allowed

#### WH-011: Rate limiting

- **Steps:** Send 61+ requests in 1 minute from same IP
- **Expected:** 429 Too Many Requests with retryAfter header

### WhatsApp Webhook

#### WH-012: Valid incoming message

- **Steps:** POST to `/api/webhooks/whatsapp` with valid green-api payload (typeWebhook: "incomingMessageReceived")
- **Expected:** 200 OK (immediate response), message processed async

#### WH-013: Non-message webhook type

- **Steps:** POST with typeWebhook: "stateInstanceChanged"
- **Expected:** 200 OK, event ignored

#### WH-014: Invalid JSON

- **Steps:** POST with malformed JSON body
- **Expected:** 400 Bad Request

#### WH-015: Missing sender data

- **Steps:** POST with valid typeWebhook but missing senderData
- **Expected:** 200 OK, logged as incomplete, no crash

#### WH-016: Unknown phone number

- **Steps:** POST with chatId for phone not matching any lead
- **Expected:** 200 OK, logged as "whatsapp.webhook.noLead"

#### WH-017: Rate limiting on webhook

- **Steps:** Send 61+ webhook requests in 1 minute
- **Expected:** 429 Too Many Requests

### Edge Cases

#### WH-018: Very long message content

- **Steps:** Send webhook with 5000+ char message
- **Expected:** Message stored (content max 5000 in schema), no crash

#### WH-019: Extended text message format

- **Steps:** POST with messageData.extendedTextMessageData.text instead of textMessageData
- **Expected:** Message text correctly extracted from alternate format

#### WH-020: Duplicate webhook delivery

- **Steps:** Send same webhook payload twice (same idMessage)
- **Expected:** Both processed (no dedup currently), two messages stored

#### WH-021: Lead ingestion with metadata

- **Steps:** POST with metadata: { "utm_campaign": "test", "formId": "f1" }
- **Expected:** Metadata stored in sourceMetadata field

#### WH-022: Concurrent webhook requests

- **Steps:** Send 10 webhook requests simultaneously
- **Expected:** All processed correctly, no race conditions in conversation creation

#### WH-023: Client error logging

- **Steps:** POST to `/api/log/client-error` with error details
- **Expected:** Error logged on server, 200 OK response
