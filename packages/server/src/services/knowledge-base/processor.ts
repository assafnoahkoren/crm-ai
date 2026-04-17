import { prisma } from "../../db/client";
import { createEmbeddingProvider } from "../ai";
import { chunkText } from "./chunker";
import { logger } from "../../lib/logger";

const embeddingProvider = createEmbeddingProvider();

/**
 * Process a knowledge document: chunk text → generate embeddings → store chunks
 */
export async function processDocument(documentId: string): Promise<void> {
  const doc = await prisma.knowledgeDocument.findUnique({
    where: { id: documentId },
  });

  if (!doc || !doc.content) {
    logger.error({ documentId }, "knowledge.process.noContent");
    await prisma.knowledgeDocument.update({
      where: { id: documentId },
      data: { status: "error" },
    });
    return;
  }

  try {
    // 1. Chunk the text
    const chunks = chunkText(doc.content);
    logger.info({ documentId, chunkCount: chunks.length }, "knowledge.chunked");

    // 2. Generate embeddings for all chunks
    const embeddings = await embeddingProvider.embedBatch(chunks.map((c) => c.content));
    logger.info({ documentId, embeddingCount: embeddings.length }, "knowledge.embedded");

    // 3. Delete old chunks if re-processing
    await prisma.knowledgeChunk.deleteMany({
      where: { documentId },
    });

    // 4. Store chunks with embeddings
    await prisma.knowledgeChunk.createMany({
      data: chunks.map((chunk, i) => ({
        documentId,
        organizationId: doc.organizationId,
        content: chunk.content,
        embedding: embeddings[i],
        position: chunk.position,
        metadata: { title: doc.title, category: doc.category },
      })),
    });

    // 5. Update document status
    await prisma.knowledgeDocument.update({
      where: { id: documentId },
      data: { status: "ready", chunkCount: chunks.length },
    });

    logger.info({ documentId, chunkCount: chunks.length }, "knowledge.processed");
  } catch (error) {
    logger.error({ documentId, error: String(error) }, "knowledge.process.failed");
    await prisma.knowledgeDocument.update({
      where: { id: documentId },
      data: { status: "error" },
    });
  }
}
