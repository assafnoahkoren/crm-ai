import { router } from "../trpc";
import { healthRouter } from "./health";
import { leadsRouter } from "./leads";
import { knowledgeBaseRouter } from "./knowledge-base";

export const appRouter = router({
  health: healthRouter,
  leads: leadsRouter,
  knowledgeBase: knowledgeBaseRouter,
});

export type AppRouter = typeof appRouter;
