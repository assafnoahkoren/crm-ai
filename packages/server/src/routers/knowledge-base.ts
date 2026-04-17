import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { prisma } from "../db/client";
import { createKnowledgeDocInput } from "@crm-ai/shared";
import { processDocument } from "../services/knowledge-base/processor";
import { retrieveChunks } from "../services/knowledge-base/retriever";
import { logger } from "../lib/logger";

export const knowledgeBaseRouter = router({
  list: protectedProcedure
    .input(
      z
        .object({
          category: z.string().optional(),
          search: z.string().optional(),
        })
        .optional(),
    )
    .query(async ({ input, ctx }) => {
      const where: Record<string, unknown> = {
        organizationId: ctx.organizationId,
      };

      if (input?.category) where.category = input.category;
      if (input?.search) {
        where.title = { contains: input.search, mode: "insensitive" };
      }

      return prisma.knowledgeDocument.findMany({
        where,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          category: true,
          tags: true,
          status: true,
          chunkCount: true,
          mimeType: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    }),

  getById: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ input, ctx }) => {
    const doc = await prisma.knowledgeDocument.findFirst({
      where: { id: input.id, organizationId: ctx.organizationId },
    });

    if (!doc) throw new Error("Document not found");
    return doc;
  }),

  create: protectedProcedure.input(createKnowledgeDocInput).mutation(async ({ input, ctx }) => {
    const doc = await prisma.knowledgeDocument.create({
      data: {
        ...input,
        organizationId: ctx.organizationId!,
        uploadedByUserId: ctx.userId!,
        status: input.content ? "processing" : "ready",
      },
    });

    logger.info(
      { docId: doc.id, orgId: ctx.organizationId, title: input.title },
      "knowledge.created",
    );

    // Process in background if content is provided
    if (input.content) {
      processDocument(doc.id).catch((err) => {
        logger.error({ docId: doc.id, error: String(err) }, "knowledge.process.bgError");
      });
    }

    return doc;
  }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).max(200).optional(),
        content: z.string().optional(),
        category: z.string().max(100).optional(),
        tags: z.array(z.string().max(50)).max(20).optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { id, ...data } = input;

      const doc = await prisma.knowledgeDocument.updateMany({
        where: { id, organizationId: ctx.organizationId },
        data,
      });

      if (doc.count === 0) throw new Error("Document not found");

      // Re-process if content changed
      if (data.content) {
        await prisma.knowledgeDocument.update({
          where: { id },
          data: { status: "processing" },
        });
        processDocument(id).catch((err) => {
          logger.error({ docId: id, error: String(err) }, "knowledge.reprocess.bgError");
        });
      }

      return prisma.knowledgeDocument.findUnique({ where: { id } });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      // Delete chunks first
      await prisma.knowledgeChunk.deleteMany({
        where: { documentId: input.id, organizationId: ctx.organizationId },
      });

      const result = await prisma.knowledgeDocument.deleteMany({
        where: { id: input.id, organizationId: ctx.organizationId },
      });

      if (result.count === 0) throw new Error("Document not found");

      logger.info({ docId: input.id, orgId: ctx.organizationId }, "knowledge.deleted");

      return { success: true };
    }),

  // RAG search endpoint
  search: protectedProcedure
    .input(
      z.object({ query: z.string().min(1).max(1000), topK: z.number().min(1).max(20).default(5) }),
    )
    .query(async ({ input, ctx }) => {
      return retrieveChunks(ctx.organizationId!, input.query, input.topK);
    }),
});
