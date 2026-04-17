import { z } from "zod";
import { router, protectedProcedure, adminProcedure } from "../trpc";
import { prisma } from "../db/client";
import { createAutomationInput, createTemplateInput } from "@crm-ai/shared";
import { logger } from "../lib/logger";

export const automationsRouter = router({
  // ── Automation Rules ────────────────────────────────

  listRules: protectedProcedure.query(async ({ ctx }) => {
    return prisma.automationRule.findMany({
      where: { organizationId: ctx.organizationId },
      orderBy: { createdAt: "desc" },
    });
  }),

  createRule: adminProcedure.input(createAutomationInput).mutation(async ({ input, ctx }) => {
    const rule = await prisma.automationRule.create({
      data: {
        ...input,
        triggerConfig: JSON.parse(JSON.stringify(input.triggerConfig)),
        actionConfig: JSON.parse(JSON.stringify(input.actionConfig)),
        organizationId: ctx.organizationId!,
      },
    });

    logger.info(
      { ruleId: rule.id, trigger: input.trigger, action: input.action },
      "automation.rule.created",
    );
    return rule;
  }),

  updateRule: adminProcedure
    .input(
      z.object({
        id: z.string(),
        isActive: z.boolean().optional(),
        triggerConfig: z.record(z.string(), z.unknown()).optional(),
        actionConfig: z.record(z.string(), z.unknown()).optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { id, ...data } = input;
      const updateData: Record<string, unknown> = {};
      if (data.isActive !== undefined) updateData.isActive = data.isActive;
      if (data.triggerConfig)
        updateData.triggerConfig = JSON.parse(JSON.stringify(data.triggerConfig));
      if (data.actionConfig)
        updateData.actionConfig = JSON.parse(JSON.stringify(data.actionConfig));

      const result = await prisma.automationRule.updateMany({
        where: { id, organizationId: ctx.organizationId },
        data: updateData,
      });

      if (result.count === 0) throw new Error("Rule not found");
      return prisma.automationRule.findUnique({ where: { id } });
    }),

  deleteRule: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const result = await prisma.automationRule.deleteMany({
        where: { id: input.id, organizationId: ctx.organizationId },
      });
      if (result.count === 0) throw new Error("Rule not found");
      logger.info({ ruleId: input.id }, "automation.rule.deleted");
      return { success: true };
    }),

  // ── Message Templates ───────────────────────────────

  listTemplates: protectedProcedure.query(async ({ ctx }) => {
    return prisma.messageTemplate.findMany({
      where: { organizationId: ctx.organizationId },
      orderBy: { createdAt: "desc" },
    });
  }),

  createTemplate: adminProcedure.input(createTemplateInput).mutation(async ({ input, ctx }) => {
    const template = await prisma.messageTemplate.create({
      data: {
        ...input,
        organizationId: ctx.organizationId!,
      },
    });

    logger.info({ templateId: template.id, name: input.name }, "template.created");
    return template;
  }),

  updateTemplate: adminProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).max(100).optional(),
        content: z.string().min(1).max(2000).optional(),
        category: z.string().max(100).optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { id, ...data } = input;
      const result = await prisma.messageTemplate.updateMany({
        where: { id, organizationId: ctx.organizationId },
        data,
      });
      if (result.count === 0) throw new Error("Template not found");
      return prisma.messageTemplate.findUnique({ where: { id } });
    }),

  deleteTemplate: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const result = await prisma.messageTemplate.deleteMany({
        where: { id: input.id, organizationId: ctx.organizationId },
      });
      if (result.count === 0) throw new Error("Template not found");
      return { success: true };
    }),
});
