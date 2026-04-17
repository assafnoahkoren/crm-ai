import { PrismaClient } from "@prisma/client";
import { logger } from "../lib/logger";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? [
            { emit: "event", level: "warn" },
            { emit: "event", level: "error" },
          ]
        : [{ emit: "event", level: "error" }],
  });

prisma.$on("error" as never, (e: unknown) => {
  logger.error(e, "prisma.error");
});

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
