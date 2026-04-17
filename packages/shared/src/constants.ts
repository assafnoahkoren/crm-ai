export const LEAD_STATUSES = [
  "new",
  "contacted",
  "qualified",
  "proposal",
  "negotiation",
  "won",
  "lost",
] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const LEAD_SOURCES = ["manual", "facebook", "website", "api"] as const;

export type LeadSource = (typeof LEAD_SOURCES)[number];

export const USER_ROLES = ["owner", "admin", "agent"] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const MESSAGE_TYPES = ["text", "image", "document", "voice", "location"] as const;

export type MessageType = (typeof MESSAGE_TYPES)[number];

export const MESSAGE_DIRECTIONS = ["inbound", "outbound"] as const;
export type MessageDirection = (typeof MESSAGE_DIRECTIONS)[number];

export const MESSAGE_SENDERS = ["bot", "agent", "customer"] as const;
export type MessageSender = (typeof MESSAGE_SENDERS)[number];

export const MESSAGE_DELIVERY_STATUSES = ["sent", "delivered", "read", "failed"] as const;
export type MessageDeliveryStatus = (typeof MESSAGE_DELIVERY_STATUSES)[number];

export const AUTOMATION_TRIGGERS = ["status_change", "no_response", "schedule"] as const;
export type AutomationTrigger = (typeof AUTOMATION_TRIGGERS)[number];

export const AUTOMATION_ACTIONS = ["send_template", "assign_agent", "change_status"] as const;
export type AutomationAction = (typeof AUTOMATION_ACTIONS)[number];

export const KNOWLEDGE_DOC_STATUSES = ["processing", "ready", "error"] as const;
export type KnowledgeDocStatus = (typeof KNOWLEDGE_DOC_STATUSES)[number];
