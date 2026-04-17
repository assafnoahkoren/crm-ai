import { z } from "zod";
import { LEAD_STATUSES, LEAD_SOURCES, USER_ROLES, MESSAGE_TYPES } from "./constants";

// ── Auth ──────────────────────────────────────────────

export const phoneSchema = z.string().regex(/^\+?[1-9]\d{7,14}$/, "Invalid phone number");

export const otpSchema = z.string().length(6, "OTP must be 6 digits");

export const sendOtpInput = z.object({
  phone: phoneSchema,
});

export const verifyOtpInput = z.object({
  phone: phoneSchema,
  code: otpSchema,
});

// ── Users ─────────────────────────────────────────────

export const userRoleSchema = z.enum(USER_ROLES);

export const inviteUserInput = z.object({
  phone: phoneSchema,
  name: z.string().min(1).max(100),
  role: userRoleSchema,
});

// ── Leads ─────────────────────────────────────────────

export const leadStatusSchema = z.enum(LEAD_STATUSES);
export const leadSourceSchema = z.enum(LEAD_SOURCES);

export const createLeadInput = z.object({
  name: z.string().min(1).max(200),
  phone: phoneSchema,
  email: z.string().email().optional(),
  company: z.string().max(200).optional(),
  notes: z.string().max(5000).optional(),
  tags: z.array(z.string().max(50)).max(20).default([]),
  source: leadSourceSchema.default("manual"),
  sourceMetadata: z.record(z.string(), z.unknown()).optional(),
});

export const updateLeadInput = z.object({
  id: z.string(),
  name: z.string().min(1).max(200).optional(),
  phone: phoneSchema.optional(),
  email: z.string().email().optional(),
  company: z.string().max(200).optional(),
  notes: z.string().max(5000).optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  status: leadStatusSchema.optional(),
  assignedToUserId: z.string().optional(),
});

export const leadFiltersInput = z.object({
  status: leadStatusSchema.optional(),
  source: leadSourceSchema.optional(),
  assignedToUserId: z.string().optional(),
  search: z.string().max(200).optional(),
  tags: z.array(z.string()).optional(),
  cursor: z.string().optional(),
  limit: z.number().min(1).max(100).default(50),
});

// ── Lead Ingestion (external API) ─────────────────────

export const ingestLeadInput = z.object({
  name: z.string().min(1).max(200),
  phone: phoneSchema,
  email: z.string().email().optional(),
  company: z.string().max(200).optional(),
  source: z.string().max(50).default("api"),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

// ── Messages ──────────────────────────────────────────

export const sendMessageInput = z.object({
  conversationId: z.string(),
  content: z.string().min(1).max(5000),
  type: z.enum(MESSAGE_TYPES).default("text"),
});

// ── Knowledge Base ────────────────────────────────────

export const createKnowledgeDocInput = z.object({
  title: z.string().min(1).max(200),
  content: z.string().optional(),
  category: z.string().max(100).optional(),
  tags: z.array(z.string().max(50)).max(20).default([]),
});

// ── Automations ───────────────────────────────────────

export const createAutomationInput = z.object({
  trigger: z.enum(["status_change", "no_response", "schedule"]),
  triggerConfig: z.record(z.string(), z.unknown()),
  action: z.enum(["send_template", "assign_agent", "change_status"]),
  actionConfig: z.record(z.string(), z.unknown()),
  isActive: z.boolean().default(true),
});

export const createTemplateInput = z.object({
  name: z.string().min(1).max(100),
  content: z.string().min(1).max(2000),
  category: z.string().max(100).optional(),
  language: z.string().max(10).default("he"),
});
