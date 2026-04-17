import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { prisma } from "../db/client";
import { sendMessageInput } from "@crm-ai/shared";
import { createWhatsAppProvider } from "../services/whatsapp";
import { logger } from "../lib/logger";

const whatsapp = createWhatsAppProvider();

export const conversationsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return prisma.conversation.findMany({
      where: { organizationId: ctx.organizationId },
      orderBy: { lastMessageAt: "desc" },
      include: {
        lead: { select: { id: true, name: true, phone: true, status: true } },
      },
    });
  }),

  getById: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ input, ctx }) => {
    const conversation = await prisma.conversation.findFirst({
      where: { id: input.id, organizationId: ctx.organizationId },
      include: {
        lead: { select: { id: true, name: true, phone: true, status: true, tags: true } },
      },
    });

    if (!conversation) throw new Error("Conversation not found");

    // Mark as read
    if (conversation.unreadCount > 0) {
      await prisma.conversation.update({
        where: { id: input.id },
        data: { unreadCount: 0 },
      });
    }

    return conversation;
  }),

  messages: protectedProcedure
    .input(
      z.object({
        conversationId: z.string(),
        cursor: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
      }),
    )
    .query(async ({ input, ctx }) => {
      // Verify conversation belongs to org
      const conv = await prisma.conversation.findFirst({
        where: { id: input.conversationId, organizationId: ctx.organizationId },
      });
      if (!conv) throw new Error("Conversation not found");

      const messages = await prisma.message.findMany({
        where: { conversationId: input.conversationId },
        take: input.limit,
        ...(input.cursor ? { skip: 1, cursor: { id: input.cursor } } : {}),
        orderBy: { createdAt: "desc" },
        include: {
          senderUser: { select: { id: true, name: true } },
        },
      });

      return {
        messages: messages.reverse(), // Chronological order
        nextCursor: messages.length === input.limit ? messages[0]?.id : undefined,
      };
    }),

  sendMessage: protectedProcedure.input(sendMessageInput).mutation(async ({ input, ctx }) => {
    // Verify conversation belongs to org
    const conv = await prisma.conversation.findFirst({
      where: { id: input.conversationId, organizationId: ctx.organizationId },
    });
    if (!conv) throw new Error("Conversation not found");

    // Send via WhatsApp
    const chatId = conv.whatsappChatId || `${conv.phone.replace("+", "")}@c.us`;
    const result = await whatsapp.sendMessage({
      chatId,
      message: input.content,
    });

    // Store the message
    const message = await prisma.message.create({
      data: {
        conversationId: input.conversationId,
        direction: "outbound",
        sender: "agent",
        senderUserId: ctx.userId,
        type: input.type,
        content: input.content,
        status: result.success ? "sent" : "failed",
        metadata: { idMessage: result.idMessage },
      },
    });

    // Update conversation
    await prisma.conversation.update({
      where: { id: input.conversationId },
      data: { lastMessageAt: new Date() },
    });

    logger.info(
      {
        conversationId: input.conversationId,
        sender: "agent",
        userId: ctx.userId,
        provider: result.success ? "sent" : "failed",
      },
      "whatsapp.message.sent",
    );

    return message;
  }),

  toggleBot: protectedProcedure
    .input(z.object({ conversationId: z.string(), isBot: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      const result = await prisma.conversation.updateMany({
        where: { id: input.conversationId, organizationId: ctx.organizationId },
        data: { isBot: input.isBot },
      });

      if (result.count === 0) throw new Error("Conversation not found");

      logger.info(
        { conversationId: input.conversationId, isBot: input.isBot },
        "conversation.bot.toggled",
      );

      return { success: true };
    }),
});
