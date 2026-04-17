import { describe, test, expect } from "bun:test";
import { appRouter } from "./routers/app";

describe("tRPC Router", () => {
  test("health.ping returns ok status", async () => {
    const caller = appRouter.createCaller({});
    const result = await caller.health.ping();
    expect(result.status).toBe("ok");
    expect(result.timestamp).toBeDefined();
  });
});
