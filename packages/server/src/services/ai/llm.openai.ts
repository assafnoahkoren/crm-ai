import type { ILLMProvider, LLMMessage, LLMResponse } from "./llm.provider";
import { logger } from "../../lib/logger";

export class OpenAILLMProvider implements ILLMProvider {
  private apiKey: string;
  private model: string;

  constructor(model: string = "gpt-4o") {
    this.apiKey = process.env.OPENAI_API_KEY || "";
    this.model = model;
  }

  async chat(messages: LLMMessage[]): Promise<LLMResponse> {
    const start = performance.now();

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      logger.error({ status: response.status, error }, "openai.chat.failed");
      throw new Error(`OpenAI chat failed: ${response.status}`);
    }

    const data = (await response.json()) as {
      choices: Array<{ message: { content: string } }>;
      usage: { total_tokens: number };
      model: string;
    };

    const duration = performance.now() - start;
    const content = data.choices[0]?.message?.content || "";

    logger.info(
      {
        model: data.model,
        tokensUsed: data.usage.total_tokens,
        duration: `${duration.toFixed(0)}ms`,
      },
      "openai.chat.success",
    );

    return {
      content,
      tokensUsed: data.usage.total_tokens,
      model: data.model,
    };
  }
}
