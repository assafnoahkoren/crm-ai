import type { ISmsProvider } from "./sms.provider";
import { MockSmsProvider } from "./sms.mock";
import { MicropaySmsProvider } from "./sms.micropay";
import { logger } from "../../lib/logger";

export type { ISmsProvider };

export function createSmsProvider(): ISmsProvider {
  if (process.env.MICROPAY_SMS_TOKEN) {
    logger.info("[SMS] Using Micropay provider");
    return new MicropaySmsProvider();
  }
  logger.info("[SMS] No MICROPAY_SMS_TOKEN — using mock provider");
  return new MockSmsProvider();
}
