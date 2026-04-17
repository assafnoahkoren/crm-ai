import type { IEmbeddingProvider } from "./embedding.provider";
import type { ILLMProvider } from "./llm.provider";
import { MockEmbeddingProvider } from "./embedding.mock";
import { OpenAIEmbeddingProvider } from "./embedding.openai";
import { MockLLMProvider } from "./llm.mock";
import { OpenAILLMProvider } from "./llm.openai";
import { logger } from "../../lib/logger";

export type { IEmbeddingProvider };
export type { ILLMProvider, LLMMessage, LLMResponse } from "./llm.provider";

export function createEmbeddingProvider(): IEmbeddingProvider {
  if (process.env.OPENAI_API_KEY) {
    logger.info("[Embeddings] Using OpenAI provider");
    return new OpenAIEmbeddingProvider();
  }
  logger.info("[Embeddings] No OPENAI_API_KEY — using mock provider");
  return new MockEmbeddingProvider();
}

export function createLLMProvider(): ILLMProvider {
  if (process.env.OPENAI_API_KEY) {
    logger.info("[LLM] Using OpenAI provider");
    return new OpenAILLMProvider();
  }
  logger.info("[LLM] No OPENAI_API_KEY — using mock provider");
  return new MockLLMProvider();
}
