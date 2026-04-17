import { router, protectedProcedure } from "../trpc";
import { prisma } from "../db/client";

export const dashboardRouter = router({
  summary: protectedProcedure.query(async ({ ctx }) => {
    const orgId = ctx.organizationId;

    // Lead pipeline stats
    const leadsByStatus = await prisma.lead.groupBy({
      by: ["status"],
      where: { organizationId: orgId },
      _count: true,
    });

    const totalLeads = leadsByStatus.reduce(
      (sum: number, l: { _count: number }) => sum + l._count,
      0,
    );

    // Active conversations
    const activeConversations = await prisma.conversation.count({
      where: { organizationId: orgId },
    });

    const unreadConversations = await prisma.conversation.count({
      where: { organizationId: orgId, unreadCount: { gt: 0 } },
    });

    // Messages today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const messagesToday = await prisma.message.count({
      where: {
        conversation: { organizationId: orgId },
        createdAt: { gte: today },
      },
    });

    // Bot vs agent messages today
    const botMessagesToday = await prisma.message.count({
      where: {
        conversation: { organizationId: orgId },
        sender: "bot",
        direction: "outbound",
        createdAt: { gte: today },
      },
    });

    const agentMessagesToday = await prisma.message.count({
      where: {
        conversation: { organizationId: orgId },
        sender: "agent",
        direction: "outbound",
        createdAt: { gte: today },
      },
    });

    // Knowledge base stats
    const kbDocuments = await prisma.knowledgeDocument.count({
      where: { organizationId: orgId, status: "ready" },
    });

    const kbChunks = await prisma.knowledgeChunk.count({
      where: { organizationId: orgId },
    });

    return {
      leads: {
        total: totalLeads,
        byStatus: Object.fromEntries(
          leadsByStatus.map((l: { status: string; _count: number }) => [l.status, l._count]),
        ),
      },
      conversations: {
        total: activeConversations,
        unread: unreadConversations,
      },
      messages: {
        today: messagesToday,
        botToday: botMessagesToday,
        agentToday: agentMessagesToday,
      },
      knowledgeBase: {
        documents: kbDocuments,
        chunks: kbChunks,
      },
    };
  }),

  recentActivity: protectedProcedure.query(async ({ ctx }) => {
    // Get recent leads
    const recentLeads = await prisma.lead.findMany({
      where: { organizationId: ctx.organizationId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, name: true, status: true, source: true, createdAt: true },
    });

    // Get recent messages
    const recentMessages = await prisma.message.findMany({
      where: { conversation: { organizationId: ctx.organizationId } },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        sender: true,
        direction: true,
        content: true,
        createdAt: true,
        conversation: { select: { lead: { select: { name: true } } } },
      },
    });

    return {
      leads: recentLeads,
      messages: recentMessages.map((m) => ({
        id: m.id,
        sender: m.sender,
        direction: m.direction,
        preview: m.content.slice(0, 100),
        leadName: m.conversation.lead.name,
        createdAt: m.createdAt,
      })),
    };
  }),
});
