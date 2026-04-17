# Test Plan: Knowledge Base

## Feature Overview

Document management for RAG (Retrieval-Augmented Generation). Upload text documents, view document list with status/chunks, search functionality. Documents are chunked and embedded for AI-powered retrieval.

## URLs

- **Local:** http://localhost:5173/knowledge-base
- **Production:** https://crm-ai-client.onrender.com/knowledge-base

## Prerequisites

- Authenticated user session
- Knowledge documents (mock data or real uploads)

---

## Test Cases

### Happy Path

#### KB-001: Knowledge base page loads

- **Steps:** Navigate to /knowledge-base
- **Expected:** Document list table with header, upload button visible

#### KB-002: Document list table columns

- **Steps:** View document table
- **Expected:** Columns: Title, Category, Status, Chunks, Tags

#### KB-003: Document status badges

- **Steps:** View status column
- **Expected:** "ready" = green badge, "processing" = yellow badge, "error" = red badge

#### KB-004: Upload button opens modal

- **Steps:** Click "Upload" button
- **Expected:** Modal dialog opens with title, category, and content fields

#### KB-005: Upload document

- **Steps:** Fill title + content in modal, submit
- **Expected:** Document created, appears in list with "processing" status, then becomes "ready"

#### KB-006: Document with category

- **Steps:** Upload document with category "Products"
- **Expected:** Category shown in table row

#### KB-007: Chunk count display

- **Steps:** View document that's been processed
- **Expected:** Chunk count shown (e.g., "12")

### Edge Cases

#### KB-008: Upload with empty title

- **Steps:** Try uploading with empty title field
- **Expected:** Validation error, form not submitted

#### KB-009: Upload with empty content

- **Steps:** Try uploading with title but no content
- **Expected:** Either validation error or document created with 0 chunks

#### KB-010: Very long content

- **Steps:** Upload document with 10,000+ characters
- **Expected:** Document processed, multiple chunks created, no timeout

#### KB-011: Hebrew content

- **Steps:** Upload document with Hebrew text
- **Expected:** Content stored and displayed correctly in RTL

#### KB-012: Empty knowledge base

- **Steps:** View page with no documents
- **Expected:** Empty table or empty state message, no crash

#### KB-013: Document tags display

- **Steps:** View document with tags
- **Expected:** Tags shown as inline badges

#### KB-014: Category filter

- **Steps:** Filter documents by category (if filter UI exists)
- **Expected:** Only documents matching category shown

#### KB-015: Max title length (200 chars)

- **Steps:** Enter title with 201+ characters
- **Expected:** Validation prevents submission or truncates

#### KB-016: Processing state

- **Steps:** Upload large document, check immediately
- **Expected:** Status shows "processing" while chunking/embedding

#### KB-017: Mobile responsive

- **Steps:** Resize to mobile width
- **Expected:** Table scrollable or reformatted, upload modal usable
