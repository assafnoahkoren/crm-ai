import type { IEmbeddingProvider } from "./embedding.provider";
import { MockEmbeddingProvider } from "./embedding.mock";
import { OpenAIEmbeddingProvider } from "./embedding.openai";
import { logger } from "../../lib/logger";

export type { IEmbeddingProvider };

export function createEmbeddingProvider(): IEmbeddingProvider {
  if (process.env.OPENAI_API_KEY) {
    logger.info("[Embeddings] Using OpenAI provider");
    return new OpenAIEmbeddingProvider();
  }
  logger.info("[Embeddings] No OPENAI_API_KEY — using mock provider");
  return new MockEmbeddingProvider();
}
