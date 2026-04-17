import type { IEmbeddingProvider } from "./embedding.provider";
import { logger } from "../../lib/logger";

export class OpenAIEmbeddingProvider implements IEmbeddingProvider {
  readonly dimensions = 1536;
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || "";
  }

  async embed(text: string): Promise<number[]> {
    const result = await this.embedBatch([text]);
    return result[0];
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    const start = performance.now();

    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: texts,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      logger.error({ status: response.status, error }, "openai.embedding.failed");
      throw new Error(`OpenAI embedding failed: ${response.status}`);
    }

    const data = (await response.json()) as {
      data: Array<{ embedding: number[] }>;
      usage: { total_tokens: number };
    };

    const duration = performance.now() - start;
    logger.info(
      {
        count: texts.length,
        tokens: data.usage.total_tokens,
        duration: `${duration.toFixed(0)}ms`,
      },
      "openai.embedding.success",
    );

    return data.data.map((d) => d.embedding);
  }
}
