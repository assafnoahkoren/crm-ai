import type {
  LeadStatus,
  LeadSource,
  UserRole,
  MessageType,
  MessageDirection,
  MessageSender,
  MessageDeliveryStatus,
  KnowledgeDocStatus,
  AutomationTrigger,
  AutomationAction,
} from "./constants";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: string;
  settings: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  organizationId: string;
  phone: string;
  name: string;
  role: UserRole;
  avatar?: string;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Lead {
  id: string;
  organizationId: string;
  source: LeadSource;
  sourceMetadata?: Record<string, unknown>;
  status: LeadStatus;
  name: string;
  phone: string;
  email?: string;
  company?: string;
  notes?: string;
  tags: string[];
  assignedToUserId?: string;
  customFields?: Record<string, unknown>;
  score?: number;
  conversationId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Conversation {
  id: string;
  organizationId: string;
  leadId: string;
  whatsappChatId?: string;
  phone: string;
  isBot: boolean;
  lastMessageAt?: Date;
  unreadCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  conversationId: string;
  direction: MessageDirection;
  sender: MessageSender;
  senderUserId?: string;
  type: MessageType;
  content: string;
  mediaUrl?: string;
  metadata?: Record<string, unknown>;
  status: MessageDeliveryStatus;
  createdAt: Date;
}

export interface KnowledgeDocument {
  id: string;
  organizationId: string;
  title: string;
  content?: string;
  fileUrl?: string;
  mimeType?: string;
  category?: string;
  tags: string[];
  chunkCount: number;
  status: KnowledgeDocStatus;
  uploadedByUserId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface KnowledgeChunk {
  id: string;
  documentId: string;
  organizationId: string;
  content: string;
  embedding: number[];
  position: number;
  metadata?: Record<string, unknown>;
}

export interface AutomationRule {
  id: string;
  organizationId: string;
  trigger: AutomationTrigger;
  triggerConfig: Record<string, unknown>;
  action: AutomationAction;
  actionConfig: Record<string, unknown>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MessageTemplate {
  id: string;
  organizationId: string;
  name: string;
  content: string;
  category?: string;
  language: string;
  createdAt: Date;
  updatedAt: Date;
}
