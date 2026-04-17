import { prisma } from "../../db/client";
import { createWhatsAppProvider } from "../whatsapp";
import { interpolateTemplate, type TemplateContext } from "./template";
import { logger } from "../../lib/logger";

const whatsapp = createWhatsAppProvider();

interface StatusChangeEvent {
  leadId: string;
  organizationId: string;
  oldStatus: string;
  newStatus: string;
}

/**
 * Evaluate and execute automation rules when a lead's status changes.
 */
export async function onLeadStatusChange(event: StatusChangeEvent): Promise<void> {
  const { leadId, organizationId, newStatus } = event;

  // Find active rules that trigger on this status change
  const rules = await prisma.automationRule.findMany({
    where: {
      organizationId,
      trigger: "status_change",
      isActive: true,
    },
  });

  const matchingRules = rules.filter((rule: (typeof rules)[number]) => {
    const config = rule.triggerConfig as Record<string, unknown>;
    return config.status === newStatus;
  });

  if (matchingRules.length === 0) return;

  // Get lead data for template interpolation
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: {
      assignedTo: { select: { name: true } },
      organization: { select: { name: true } },
    },
  });

  if (!lead) return;

  const templateCtx: TemplateContext = {
    lead: { name: lead.name, phone: lead.phone, company: lead.company || "", status: lead.status },
    agent: { name: lead.assignedTo?.name || "" },
    org: { name: lead.organization.name },
  };

  for (const rule of matchingRules) {
    try {
      await executeAction(rule, lead, templateCtx);
      logger.info(
        { ruleId: rule.id, trigger: "status_change", leadId, action: rule.action },
        "automation.executed",
      );
    } catch (error) {
      logger.error({ ruleId: rule.id, leadId, error: String(error) }, "automation.failed");
    }
  }
}

async function executeAction(
  rule: { id: string; action: string; actionConfig: unknown },
  lead: { id: string; phone: string; organizationId: string },
  ctx: TemplateContext,
): Promise<void> {
  const config = rule.actionConfig as Record<string, unknown>;

  switch (rule.action) {
    case "send_template": {
      const templateId = config.templateId as string;
      if (!templateId) return;

      const template = await prisma.messageTemplate.findUnique({
        where: { id: templateId },
      });
      if (!template) return;

      const message = interpolateTemplate(template.content, ctx);
      const chatId = `${lead.phone.replace("+", "")}@c.us`;

      // Find or create conversation
      let conversation = await prisma.conversation.findFirst({
        where: { leadId: lead.id },
      });

      if (!conversation) {
        conversation = await prisma.conversation.create({
          data: {
            organizationId: lead.organizationId,
            leadId: lead.id,
            phone: lead.phone,
            isBot: true,
            lastMessageAt: new Date(),
            unreadCount: 0,
          },
        });
      }

      // Send via WhatsApp
      const result = await whatsapp.sendMessage({ chatId, message });

      // Store message
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          direction: "outbound",
          sender: "bot",
          type: "text",
          content: message,
          status: result.success ? "sent" : "failed",
          metadata: { automationRuleId: rule.id, templateId },
        },
      });

      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { lastMessageAt: new Date() },
      });

      break;
    }

    case "assign_agent": {
      const userId = config.userId as string;
      if (!userId) return;

      await prisma.lead.update({
        where: { id: lead.id },
        data: { assignedToUserId: userId },
      });
      break;
    }

    case "change_status": {
      const status = config.status as string;
      if (!status) return;

      await prisma.lead.update({
        where: { id: lead.id },
        data: { status },
      });
      break;
    }
  }
}
