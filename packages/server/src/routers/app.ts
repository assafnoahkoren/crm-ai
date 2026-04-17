import { router } from "../trpc";
import { healthRouter } from "./health";
import { leadsRouter } from "./leads";
import { knowledgeBaseRouter } from "./knowledge-base";
import { conversationsRouter } from "./conversations";
import { automationsRouter } from "./automations";
import { dashboardRouter } from "./dashboard";

export const appRouter = router({
  health: healthRouter,
  leads: leadsRouter,
  knowledgeBase: knowledgeBaseRouter,
  conversations: conversationsRouter,
  automations: automationsRouter,
  dashboard: dashboardRouter,
});

export type AppRouter = typeof appRouter;
