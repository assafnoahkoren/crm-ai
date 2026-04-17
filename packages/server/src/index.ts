import { createHTTPServer } from "@trpc/server/adapters/standalone";
import cors from "cors";
import { appRouter } from "./routers/app";
import { createContext } from "./trpc";
import { logger } from "./lib/logger";

const PORT = Number(process.env.PORT) || 3000;

const server = createHTTPServer({
  router: appRouter,
  createContext,
  middleware: cors(),
});

server.listen(PORT);
logger.info({ port: PORT }, "CRM-AI server started");
