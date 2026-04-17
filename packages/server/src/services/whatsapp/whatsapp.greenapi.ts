import type { IWhatsAppProvider, WhatsAppMessage, WhatsAppSendResult } from "./whatsapp.provider";
import { logger } from "../../lib/logger";

export class GreenApiWhatsAppProvider implements IWhatsAppProvider {
  private baseUrl: string;

  constructor() {
    const instanceId = process.env.GREEN_API_INSTANCE_ID || "";
    const token = process.env.GREEN_API_TOKEN || "";
    this.baseUrl = `https://api.green-api.com/waInstance${instanceId}`;
    // Token is appended to each endpoint path
    this.baseUrl += `/{method}/${token}`;
  }

  private url(method: string): string {
    return this.baseUrl.replace("{method}", method);
  }

  async sendMessage(msg: WhatsAppMessage): Promise<WhatsAppSendResult> {
    const start = performance.now();

    const response = await fetch(this.url("sendMessage"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chatId: msg.chatId,
        message: msg.message,
        ...(msg.quotedMessageId ? { quotedMessageId: msg.quotedMessageId } : {}),
      }),
    });

    const data = (await response.json()) as { idMessage?: string };
    const duration = performance.now() - start;

    if (!response.ok || !data.idMessage) {
      logger.error(
        { chatId: msg.chatId, status: response.status, data, duration: `${duration.toFixed(0)}ms` },
        "whatsapp.send.failed",
      );
      return { idMessage: "", success: false };
    }

    logger.info(
      { chatId: msg.chatId, idMessage: data.idMessage, duration: `${duration.toFixed(0)}ms` },
      "whatsapp.message.sent",
    );

    return { idMessage: data.idMessage, success: true };
  }

  async getState(): Promise<{ state: string }> {
    const response = await fetch(this.url("getStateInstance"), {
      method: "GET",
    });
    const data = (await response.json()) as { stateInstance: string };
    return { state: data.stateInstance };
  }
}
