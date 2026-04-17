export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LLMResponse {
  content: string;
  tokensUsed: number;
  model: string;
}

export interface ILLMProvider {
  chat(messages: LLMMessage[]): Promise<LLMResponse>;
}
