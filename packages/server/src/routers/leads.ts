import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { prisma } from "../db/client";
import {
  createLeadInput,
  updateLeadInput,
  leadFiltersInput,
  leadStatusSchema,
} from "@crm-ai/shared";
import { logger } from "../lib/logger";

export const leadsRouter = router({
  list: protectedProcedure.input(leadFiltersInput).query(async ({ input, ctx }) => {
    const where: Record<string, unknown> = {
      organizationId: ctx.organizationId,
    };

    if (input.status) where.status = input.status;
    if (input.source) where.source = input.source;
    if (input.assignedToUserId) where.assignedToUserId = input.assignedToUserId;
    if (input.tags?.length) where.tags = { hasSome: input.tags };
    if (input.search) {
      where.OR = [
        { name: { contains: input.search, mode: "insensitive" } },
        { phone: { contains: input.search } },
        { email: { contains: input.search, mode: "insensitive" } },
        { company: { contains: input.search, mode: "insensitive" } },
      ];
    }

    const leads = await prisma.lead.findMany({
      where,
      take: input.limit,
      ...(input.cursor ? { skip: 1, cursor: { id: input.cursor } } : {}),
      orderBy: { createdAt: "desc" },
      include: {
        assignedTo: { select: { id: true, name: true, avatar: true } },
      },
    });

    const nextCursor = leads.length === input.limit ? leads[leads.length - 1]?.id : undefined;

    return { leads, nextCursor };
  }),

  getById: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ input, ctx }) => {
    const lead = await prisma.lead.findFirst({
      where: { id: input.id, organizationId: ctx.organizationId },
      include: {
        assignedTo: { select: { id: true, name: true, avatar: true } },
        conversation: true,
      },
    });

    if (!lead) {
      throw new Error("Lead not found");
    }

    return lead;
  }),

  create: protectedProcedure.input(createLeadInput).mutation(async ({ input, ctx }) => {
    const lead = await prisma.lead.create({
      data: {
        ...input,
        organizationId: ctx.organizationId!,
      },
    });

    logger.info(
      { leadId: lead.id, orgId: ctx.organizationId, source: input.source },
      "lead.created",
    );

    return lead;
  }),

  update: protectedProcedure.input(updateLeadInput).mutation(async ({ input, ctx }) => {
    const { id, ...data } = input;

    const lead = await prisma.lead.updateMany({
      where: { id, organizationId: ctx.organizationId },
      data,
    });

    if (lead.count === 0) {
      throw new Error("Lead not found");
    }

    logger.info(
      { leadId: id, orgId: ctx.organizationId, fields: Object.keys(data) },
      "lead.updated",
    );

    return prisma.lead.findUnique({ where: { id } });
  }),

  updateStatus: protectedProcedure
    .input(z.object({ id: z.string(), status: leadStatusSchema }))
    .mutation(async ({ input, ctx }) => {
      const lead = await prisma.lead.updateMany({
        where: { id: input.id, organizationId: ctx.organizationId },
        data: { status: input.status },
      });

      if (lead.count === 0) {
        throw new Error("Lead not found");
      }

      logger.info(
        { leadId: input.id, orgId: ctx.organizationId, status: input.status },
        "lead.status.changed",
      );

      return prisma.lead.findUnique({ where: { id: input.id } });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const result = await prisma.lead.deleteMany({
        where: { id: input.id, organizationId: ctx.organizationId },
      });

      if (result.count === 0) {
        throw new Error("Lead not found");
      }

      logger.info({ leadId: input.id, orgId: ctx.organizationId }, "lead.deleted");

      return { success: true };
    }),

  bulkUpdateStatus: protectedProcedure
    .input(z.object({ ids: z.array(z.string()), status: leadStatusSchema }))
    .mutation(async ({ input, ctx }) => {
      const result = await prisma.lead.updateMany({
        where: {
          id: { in: input.ids },
          organizationId: ctx.organizationId,
        },
        data: { status: input.status },
      });

      logger.info(
        { count: result.count, orgId: ctx.organizationId, status: input.status },
        "lead.bulk.status.changed",
      );

      return { count: result.count };
    }),

  stats: protectedProcedure.query(async ({ ctx }) => {
    const leads = await prisma.lead.groupBy({
      by: ["status"],
      where: { organizationId: ctx.organizationId },
      _count: true,
    });

    const total = leads.reduce((sum: number, l: { _count: number }) => sum + l._count, 0);

    return {
      total,
      byStatus: Object.fromEntries(
        leads.map((l: { status: string; _count: number }) => [l.status, l._count]),
      ),
    };
  }),
});
