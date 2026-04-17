import { prisma } from "../../db/client";
import { createEmbeddingProvider } from "../ai";
import { logger } from "../../lib/logger";

const embeddingProvider = createEmbeddingProvider();

export interface RetrievalResult {
  content: string;
  score: number;
  documentTitle: string;
  documentId: string;
  position: number;
}

function cosineSimilarity(a: number[], b: number[]): number {
  const minLen = Math.min(a.length, b.length);
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < minLen; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Retrieve relevant knowledge base chunks for a query using vector similarity.
 * Uses in-memory cosine similarity until MongoDB Atlas Vector Search is configured.
 */
export async function retrieveChunks(
  organizationId: string,
  query: string,
  topK: number = 5,
  minScore: number = 0.3,
): Promise<RetrievalResult[]> {
  const start = performance.now();

  // 1. Generate query embedding
  const queryEmbedding = await embeddingProvider.embed(query);

  // 2. Fetch all chunks for the organization
  // NOTE: In production with Atlas Vector Search, this would be a $vectorSearch aggregation.
  // For now, we do in-memory similarity (fine for <10K chunks per org).
  const chunks = await prisma.knowledgeChunk.findMany({
    where: { organizationId },
    include: {
      document: { select: { title: true } },
    },
  });

  // 3. Compute similarity scores
  const scored = chunks
    .map((chunk: (typeof chunks)[number]) => ({
      content: chunk.content,
      score: cosineSimilarity(queryEmbedding, chunk.embedding),
      documentTitle: chunk.document.title,
      documentId: chunk.documentId,
      position: chunk.position,
    }))
    .filter((r: { score: number }) => r.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  const duration = performance.now() - start;
  logger.info(
    {
      orgId: organizationId,
      query: query.slice(0, 100),
      chunksSearched: chunks.length,
      resultsFound: scored.length,
      topScore: scored[0]?.score?.toFixed(3),
      duration: `${duration.toFixed(0)}ms`,
    },
    "rag.retrieval",
  );

  return scored;
}
