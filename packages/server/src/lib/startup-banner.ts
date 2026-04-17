import { logger } from "./logger";

interface ServiceStatus {
  name: string;
  mode: "Connected" | "MOCK" | "Not configured";
}

export function printStartupBanner(port: number): void {
  const services: ServiceStatus[] = [
    {
      name: "MongoDB",
      mode: process.env.DATABASE_URL ? "Connected" : "Not configured",
    },
    {
      name: "SMS (Micropay)",
      mode: process.env.MICROPAY_SMS_TOKEN ? "Connected" : "MOCK",
    },
    {
      name: "WhatsApp (green-api)",
      mode: process.env.GREEN_API_INSTANCE_ID && process.env.GREEN_API_TOKEN ? "Connected" : "MOCK",
    },
    {
      name: "OpenAI Embeddings",
      mode: process.env.OPENAI_API_KEY ? "Connected" : "MOCK",
    },
    {
      name: "OpenAI LLM",
      mode: process.env.OPENAI_API_KEY ? "Connected" : "MOCK",
    },
  ];

  const lines = [
    "",
    "┌─────────────────────────────────────────┐",
    "│           CRM-AI Service Status         │",
    "├──────────────────┬──────────────────────┤",
    ...services.map((s) => {
      const icon = s.mode === "Connected" ? "✓" : s.mode === "MOCK" ? "~" : "✗";
      return `│ ${icon} ${s.name.padEnd(16)}│ ${s.mode.padEnd(20)}│`;
    }),
    "├──────────────────┴──────────────────────┤",
    `│ Port: ${String(port).padEnd(6)} Env: ${(process.env.NODE_ENV || "development").padEnd(17)}│`,
    "└─────────────────────────────────────────┘",
    "",
  ];

  for (const line of lines) {
    logger.info(line);
  }
}
