import type { IWhatsAppProvider } from "./whatsapp.provider";
import { MockWhatsAppProvider } from "./whatsapp.mock";
import { GreenApiWhatsAppProvider } from "./whatsapp.greenapi";
import { logger } from "../../lib/logger";

export type { IWhatsAppProvider };
export type { WhatsAppMessage, WhatsAppSendResult } from "./whatsapp.provider";

export function createWhatsAppProvider(): IWhatsAppProvider {
  if (process.env.GREEN_API_INSTANCE_ID && process.env.GREEN_API_TOKEN) {
    logger.info("[WhatsApp] Using green-api.com provider");
    return new GreenApiWhatsAppProvider();
  }
  logger.info("[WhatsApp] No GREEN_API credentials — using mock provider");
  return new MockWhatsAppProvider();
}
