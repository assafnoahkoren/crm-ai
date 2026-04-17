import { initTRPC, TRPCError } from "@trpc/server";
import { logger } from "./lib/logger";

export interface Context {
  userId?: string;
  organizationId?: string;
  userRole?: string;
}

export function createContext(): Context {
  // Auth context is populated by auth middleware on protected routes
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

// Auth middleware — ensures user is authenticated
const authMiddleware = t.middleware(async ({ ctx, next }) => {
  if (!ctx.userId || !ctx.organizationId) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Not authenticated" });
  }
  return next({
    ctx: {
      userId: ctx.userId,
      organizationId: ctx.organizationId,
      userRole: ctx.userRole,
    },
  });
});

// Role guard middleware factory
export function requireRole(...roles: string[]) {
  return t.middleware(async ({ ctx, next }) => {
    if (!ctx.userRole || !roles.includes(ctx.userRole)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `Requires role: ${roles.join(" or ")}`,
      });
    }
    return next();
  });
}

export const router = t.router;
export const publicProcedure = t.procedure.use(loggingMiddleware);
export const protectedProcedure = t.procedure.use(loggingMiddleware).use(authMiddleware);
export const adminProcedure = t.procedure
  .use(loggingMiddleware)
  .use(authMiddleware)
  .use(requireRole("owner", "admin"));
export const ownerProcedure = t.procedure
  .use(loggingMiddleware)
  .use(authMiddleware)
  .use(requireRole("owner"));
