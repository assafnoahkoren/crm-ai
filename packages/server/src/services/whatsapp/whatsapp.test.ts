import { describe, test, expect } from "bun:test";
import { MockWhatsAppProvider } from "./whatsapp.mock";
import { createWhatsAppProvider } from "./index";

describe("WhatsApp Provider", () => {
  test("MockWhatsAppProvider sends message successfully", async () => {
    const provider = new MockWhatsAppProvider();
    const result = await provider.sendMessage({
      chatId: "972521234567@c.us",
      message: "Hello from test",
    });
    expect(result.success).toBe(true);
    expect(result.idMessage).toContain("mock_");
  });

  test("MockWhatsAppProvider returns authorized state", async () => {
    const provider = new MockWhatsAppProvider();
    const state = await provider.getState();
    expect(state.state).toBe("authorized");
  });

  test("createWhatsAppProvider returns mock when no credentials", () => {
    delete process.env.GREEN_API_INSTANCE_ID;
    delete process.env.GREEN_API_TOKEN;
    const provider = createWhatsAppProvider();
    expect(provider).toBeInstanceOf(MockWhatsAppProvider);
  });
});
