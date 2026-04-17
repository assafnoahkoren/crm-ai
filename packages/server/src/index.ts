import { createHTTPServer } from "@trpc/server/adapters/standalone";
import cors from "cors";
import { appRouter } from "./routers/app";
import { createContext } from "./trpc";
import { logger } from "./lib/logger";
import { checkRateLimit } from "./lib/rate-limit";
import { auth } from "./auth/auth";
import { handleLeadIngest } from "./webhooks/lead-ingest";
import { handleWhatsAppWebhook } from "./webhooks/whatsapp";

const PORT = Number(process.env.PORT) || 3000;

function getClientIp(req: { headers: Record<string, string | string[] | undefined> }): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") return forwarded.split(",")[0].trim();
  return "unknown";
}

const server = createHTTPServer({
  router: appRouter,
  createContext,
  middleware: cors(),
  async onRequest(req, res) {
    const url = new URL(req.url || "", `http://localhost:${PORT}`);
    const ip = getClientIp(req);

    // Rate limit public endpoints (auth, webhooks)
    if (
      url.pathname.startsWith("/api/auth") ||
      url.pathname === "/api/v1/leads/ingest" ||
      url.pathname === "/api/webhooks/whatsapp"
    ) {
      const limit = checkRateLimit(`${ip}:${url.pathname}`, 60, 60000); // 60 req/min
      if (!limit.allowed) {
        res.writeHead(429, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            error: "Too many requests",
            retryAfter: Math.ceil((limit.resetAt - Date.now()) / 1000),
          }),
        );
        return;
      }
    }

    // Route /api/auth/* to Better Auth
    if (url.pathname.startsWith("/api/auth")) {
      const response = await auth.handler(req);
      res.writeHead(response.status, Object.fromEntries(response.headers.entries()));
      const body = await response.text();
      res.end(body);
      return;
    }

    // Route /api/v1/leads/ingest to webhook handler
    if (url.pathname === "/api/v1/leads/ingest") {
      await handleLeadIngest(req, res);
      return;
    }

    // WhatsApp webhook from green-api.com
    if (url.pathname === "/api/webhooks/whatsapp") {
      await handleWhatsAppWebhook(req, res);
      return;
    }

    // Health check endpoints
    if (url.pathname === "/api/health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          status: "ok",
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
        }),
      );
      return;
    }

    if (url.pathname === "/api/health/live") {
      res.writeHead(200);
      res.end("OK");
      return;
    }
  },
});

server.listen(PORT);
logger.info({ port: PORT, env: process.env.NODE_ENV || "development" }, "CRM-AI server started");
