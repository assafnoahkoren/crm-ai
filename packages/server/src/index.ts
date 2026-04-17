import { createHTTPServer } from "@trpc/server/adapters/standalone";
import cors from "cors";
import { appRouter } from "./routers/app";
import { createContext } from "./trpc";
import { logger } from "./lib/logger";
import { auth } from "./auth/auth";

const PORT = Number(process.env.PORT) || 3000;

const server = createHTTPServer({
  router: appRouter,
  createContext,
  middleware: cors(),
  async onRequest(req, res) {
    // Route /api/auth/* to Better Auth
    const url = new URL(req.url || "", `http://localhost:${PORT}`);
    if (url.pathname.startsWith("/api/auth")) {
      const response = await auth.handler(req);
      res.writeHead(response.status, Object.fromEntries(response.headers.entries()));
      const body = await response.text();
      res.end(body);
      return;
    }
  },
});

server.listen(PORT);
logger.info({ port: PORT, env: process.env.NODE_ENV || "development" }, "CRM-AI server started");
