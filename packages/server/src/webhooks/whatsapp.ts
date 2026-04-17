import type { IncomingMessage, ServerResponse } from "http";
import { prisma } from "../db/client";
import { logger } from "../lib/logger";
import { handleBotResponse } from "../services/ai/bot";

interface GreenApiWebhook {
  typeWebhook: string;
  instanceData: { idInstance: number };
  timestamp: number;
  senderData?: { chatId: string; sender: string; senderName: string };
  messageData?: {
    typeMessage: string;
    textMessageData?: { textMessage: string };
    extendedTextMessageData?: { text: string };
  };
  idMessage?: string;
}

/**
 * Handle incoming WhatsApp webhooks from green-api.com
 */
export async function handleWhatsAppWebhook(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== "POST") {
    res.writeHead(405);
    res.end();
    return;
  }

  let body = "";
  for await (const chunk of req) {
    body += chunk;
  }

  let payload: GreenApiWebhook;
  try {
    payload = JSON.parse(body);
  } catch {
    res.writeHead(400);
    res.end();
    return;
  }

  // Always respond 200 quickly to avoid retries
  res.writeHead(200);
  res.end("OK");

  // Only process incoming messages
  if (payload.typeWebhook !== "incomingMessageReceived") {
    return;
  }

  const chatId = payload.senderData?.chatId;
  const senderPhone = payload.senderData?.sender?.replace("@c.us", "");
  const messageText =
    payload.messageData?.textMessageData?.textMessage ||
    payload.messageData?.extendedTextMessageData?.text;

  if (!chatId || !senderPhone || !messageText) {
    logger.warn({ payload: JSON.stringify(payload).slice(0, 200) }, "whatsapp.webhook.incomplete");
    return;
  }

  logger.info(
    { chatId, senderPhone, msgPreview: messageText.slice(0, 80) },
    "whatsapp.message.received",
  );

  try {
    // Find or create conversation by phone number
    // First, find the lead by phone
    const phone = senderPhone.startsWith("+") ? senderPhone : `+${senderPhone}`;
    const lead = await prisma.lead.findFirst({
      where: { phone: { contains: senderPhone } },
    });

    if (!lead) {
      logger.info({ phone: senderPhone }, "whatsapp.webhook.noLead");
      return;
    }

    // Find or create conversation
    let conversation = await prisma.conversation.findFirst({
      where: { leadId: lead.id },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          organizationId: lead.organizationId,
          leadId: lead.id,
          whatsappChatId: chatId,
          phone,
          isBot: true,
          unreadCount: 1,
          lastMessageAt: new Date(),
        },
      });
    } else {
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: {
          unreadCount: { increment: 1 },
          lastMessageAt: new Date(),
          whatsappChatId: chatId,
        },
      });
    }

    // Store the message
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        direction: "inbound",
        sender: "customer",
        type: "text",
        content: messageText,
        status: "delivered",
        metadata: { idMessage: payload.idMessage },
      },
    });

    logger.info({ conversationId: conversation.id, leadId: lead.id }, "whatsapp.message.stored");

    // Trigger AI bot response in background
    handleBotResponse({
      conversationId: conversation.id,
      organizationId: lead.organizationId,
      leadId: lead.id,
      chatId,
      customerMessage: messageText,
    }).catch((err) => {
      logger.error({ error: String(err), conversationId: conversation.id }, "bot.response.error");
    });
  } catch (error) {
    logger.error({ error: String(error), chatId }, "whatsapp.webhook.error");
  }
}
