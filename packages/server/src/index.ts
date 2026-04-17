import { createHTTPServer } from "@trpc/server/adapters/standalone";
import cors from "cors";
import { appRouter } from "./routers/app";
import { createContext } from "./trpc";
import { logger } from "./lib/logger";
import { auth } from "./auth/auth";
import { handleLeadIngest } from "./webhooks/lead-ingest";

const PORT = Number(process.env.PORT) || 3000;

const server = createHTTPServer({
  router: appRouter,
  createContext,
  middleware: cors(),
  async onRequest(req, res) {
    const url = new URL(req.url || "", `http://localhost:${PORT}`);

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

    // Health check endpoints
    if (url.pathname === "/api/health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "ok", timestamp: new Date().toISOString() }));
      return;
    }
  },
});

server.listen(PORT);
logger.info({ port: PORT, env: process.env.NODE_ENV || "development" }, "CRM-AI server started");
