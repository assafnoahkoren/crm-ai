import { describe, test, expect } from "bun:test";
import { MockSmsProvider } from "./sms.mock";
import { createSmsProvider } from "./index";

describe("SMS Provider", () => {
  test("MockSmsProvider sends OTP successfully", async () => {
    const provider = new MockSmsProvider();
    const result = await provider.sendOtp("+972521234567", "123456");
    expect(result.success).toBe(true);
  });

  test("createSmsProvider returns mock when no token", () => {
    delete process.env.MICROPAY_SMS_TOKEN;
    const provider = createSmsProvider();
    expect(provider).toBeInstanceOf(MockSmsProvider);
  });
});
