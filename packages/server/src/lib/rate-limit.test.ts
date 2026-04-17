import { describe, test, expect } from "bun:test";
import { checkRateLimit } from "./rate-limit";

describe("Rate Limiter", () => {
  test("allows requests within limit", () => {
    const result = checkRateLimit("test-allow", 5, 60000);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });

  test("blocks requests exceeding limit", () => {
    const key = "test-block-" + Date.now();
    for (let i = 0; i < 3; i++) {
      checkRateLimit(key, 3, 60000);
    }
    const result = checkRateLimit(key, 3, 60000);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });
});
