import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@crm-ai/server/src/routers/app";

export const trpc = createTRPCReact<AppRouter>();
