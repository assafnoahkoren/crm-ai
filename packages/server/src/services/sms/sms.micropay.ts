import type { ISmsProvider } from "./sms.provider";
import { logger } from "../../lib/logger";

export class MicropaySmsProvider implements ISmsProvider {
  private host: string;
  private token: string;

  constructor() {
    this.host = process.env.MICROPAY_SMS_HOST || "https://www.micropay.co.il/extApi";
    this.token = process.env.MICROPAY_SMS_TOKEN || "";
  }

  async sendOtp(phone: string, code: string): Promise<{ success: boolean }> {
    const masked = phone.replace(/(\+?\d{3})\d+(\d{4})/, "$1***$2");

    const body = new URLSearchParams({
      post: "2",
      token: this.token,
      msg: `Your CRM-AI verification code: ${code}`,
      list: phone.replace("+", ""),
      from: "0501234567",
      type: "sms",
    });

    const response = await fetch(`${this.host}/ExtApi/ScheduleSms.php`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });

    const text = await response.text();
    const success = !text.includes("ERROR");

    if (success) {
      logger.info({ phone: masked, provider: "micropay" }, "otp.sent");
    } else {
      logger.error({ phone: masked, error: text, provider: "micropay" }, "otp.failed");
    }

    return { success };
  }
}
