import { router } from "../trpc";
import { healthRouter } from "./health";
import { leadsRouter } from "./leads";
import { knowledgeBaseRouter } from "./knowledge-base";
import { conversationsRouter } from "./conversations";

export const appRouter = router({
  health: healthRouter,
  leads: leadsRouter,
  knowledgeBase: knowledgeBaseRouter,
  conversations: conversationsRouter,
});

export type AppRouter = typeof appRouter;
