import { router } from "../trpc";
import { healthRouter } from "./health";
import { leadsRouter } from "./leads";

export const appRouter = router({
  health: healthRouter,
  leads: leadsRouter,
});

export type AppRouter = typeof appRouter;
