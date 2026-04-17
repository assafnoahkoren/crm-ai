import { betterAuth } from "better-auth";
import { phoneNumber } from "better-auth/plugins";
import { organization } from "better-auth/plugins";
import { createSmsProvider } from "../services/sms";
import { logger } from "../lib/logger";

const smsProvider = createSmsProvider();

export const auth = betterAuth({
  database: {
    type: "mongodb",
    url: process.env.DATABASE_URL || "mongodb://localhost:27017/crm-ai",
  },
  secret: process.env.BETTER_AUTH_SECRET || "dev-secret-change-in-production",
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  plugins: [
    phoneNumber({
      sendOTP: async ({ phoneNumber: phone, code }) => {
        const result = await smsProvider.sendOtp(phone, code);
        if (!result.success) {
          logger.error({ phone }, "auth.otp.send.failed");
        }
      },
      otpLength: 6,
      expiresIn: 300,
      allowedAttempts: 3,
      signUpOnVerification: {
        getTempEmail: (phone) => `${phone.replace("+", "")}@crm-ai.app`,
        getTempName: (phone) => phone,
      },
    }),
    organization(),
  ],
});
