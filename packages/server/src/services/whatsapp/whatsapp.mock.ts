import type { IWhatsAppProvider, WhatsAppMessage, WhatsAppSendResult } from "./whatsapp.provider";
import { logger } from "../../lib/logger";

let messageCounter = 0;

export class MockWhatsAppProvider implements IWhatsAppProvider {
  async sendMessage(msg: WhatsAppMessage): Promise<WhatsAppSendResult> {
    messageCounter++;
    const idMessage = `mock_${Date.now()}_${messageCounter}`;

    logger.info(
      { chatId: msg.chatId, idMessage, provider: "mock", msgPreview: msg.message.slice(0, 80) },
      "whatsapp.message.sent",
    );

    return { idMessage, success: true };
  }

  async getState(): Promise<{ state: string }> {
    return { state: "authorized" };
  }
}
