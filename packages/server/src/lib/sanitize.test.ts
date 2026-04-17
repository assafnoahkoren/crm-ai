import { describe, test, expect } from "bun:test";
import { escapeHtml, maskPhone } from "./sanitize";

describe("Sanitization", () => {
  test("escapeHtml prevents XSS", () => {
    expect(escapeHtml('<script>alert("xss")</script>')).toBe(
      "&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;",
    );
  });

  test("escapeHtml handles normal text", () => {
    expect(escapeHtml("Hello World")).toBe("Hello World");
  });

  test("maskPhone masks Israeli number", () => {
    expect(maskPhone("+972521234567")).toBe("+972***4567");
  });

  test("maskPhone masks short number", () => {
    expect(maskPhone("0521234567")).toBe("052***4567");
  });
});
