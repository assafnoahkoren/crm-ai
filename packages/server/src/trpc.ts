import { initTRPC } from "@trpc/server";
import { logger } from "./lib/logger";

export interface Context {
  userId?: string;
  organizationId?: string;
}

export function createContext(): Context {
  return {};
}

const t = initTRPC.context<Context>().create();

// Logging middleware
const loggingMiddleware = t.middleware(async ({ path, type, next }) => {
  const start = performance.now();
  const result = await next();
  const duration = performance.now() - start;
  logger.info({ path, type, duration: `${duration.toFixed(0)}ms` }, "trpc.request");
  return result;
});

export const router = t.router;
export const publicProcedure = t.procedure.use(loggingMiddleware);
export const protectedProcedure = t.procedure.use(loggingMiddleware);
