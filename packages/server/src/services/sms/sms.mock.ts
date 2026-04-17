import type { ISmsProvider } from "./sms.provider";
import { logger } from "../../lib/logger";

export class MockSmsProvider implements ISmsProvider {
  async sendOtp(phone: string, code: string): Promise<{ success: boolean }> {
    const masked = phone.replace(/(\+?\d{3})\d+(\d{4})/, "$1***$2");
    logger.info({ phone: masked, code, provider: "mock" }, "otp.sent");
    return { success: true };
  }
}
