import type { ILLMProvider, LLMMessage, LLMResponse } from "./llm.provider";

const CANNED_RESPONSES: Record<string, string> = {
  price:
    "Our pricing starts at $99/month for the basic plan. Would you like me to send you a detailed breakdown?",
  help: "I'd be happy to help! Could you tell me more about what you're looking for?",
  hours: "We're available Sunday through Thursday, 9:00 AM to 6:00 PM Israel time.",
  thanks: "You're welcome! Don't hesitate to reach out if you have more questions.",
  default:
    "Thank you for your message! Let me look into that for you. Is there anything specific you'd like to know?",
};

export class MockLLMProvider implements ILLMProvider {
  async chat(messages: LLMMessage[]): Promise<LLMResponse> {
    const lastUserMsg =
      [...messages]
        .reverse()
        .find((m: LLMMessage) => m.role === "user")
        ?.content?.toLowerCase() || "";

    let response = CANNED_RESPONSES.default;
    for (const [keyword, reply] of Object.entries(CANNED_RESPONSES)) {
      if (keyword !== "default" && lastUserMsg.includes(keyword)) {
        response = reply;
        break;
      }
    }

    return {
      content: response,
      tokensUsed: Math.ceil(response.length / 4),
      model: "mock-gpt",
    };
  }
}
