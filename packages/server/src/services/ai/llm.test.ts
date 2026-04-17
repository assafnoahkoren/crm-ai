import { describe, test, expect } from "bun:test";
import { MockLLMProvider } from "./llm.mock";
import { createLLMProvider } from "./index";

describe("LLM Provider", () => {
  test("MockLLMProvider returns canned response", async () => {
    const provider = new MockLLMProvider();
    const result = await provider.chat([
      { role: "system", content: "You are helpful." },
      { role: "user", content: "Hello" },
    ]);
    expect(result.content.length).toBeGreaterThan(0);
    expect(result.model).toBe("mock-gpt");
    expect(result.tokensUsed).toBeGreaterThan(0);
  });

  test("MockLLMProvider matches keyword 'price'", async () => {
    const provider = new MockLLMProvider();
    const result = await provider.chat([{ role: "user", content: "What is the price?" }]);
    expect(result.content).toContain("pricing");
  });

  test("MockLLMProvider matches keyword 'help'", async () => {
    const provider = new MockLLMProvider();
    const result = await provider.chat([{ role: "user", content: "I need help" }]);
    expect(result.content).toContain("happy to help");
  });

  test("MockLLMProvider returns default for unknown input", async () => {
    const provider = new MockLLMProvider();
    const result = await provider.chat([{ role: "user", content: "xyz123 random text" }]);
    expect(result.content).toContain("Thank you");
  });

  test("createLLMProvider returns mock when no key", () => {
    delete process.env.OPENAI_API_KEY;
    const provider = createLLMProvider();
    expect(provider).toBeInstanceOf(MockLLMProvider);
  });
});
