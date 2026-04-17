import { describe, test, expect } from "bun:test";
import { MockEmbeddingProvider } from "./embedding.mock";
import { createEmbeddingProvider } from "./index";

describe("Embedding Provider", () => {
  test("MockEmbeddingProvider returns correct dimensions", async () => {
    const provider = new MockEmbeddingProvider();
    const embedding = await provider.embed("Hello world");
    expect(embedding.length).toBe(256);
  });

  test("MockEmbeddingProvider is deterministic", async () => {
    const provider = new MockEmbeddingProvider();
    const a = await provider.embed("Hello world");
    const b = await provider.embed("Hello world");
    expect(a).toEqual(b);
  });

  test("MockEmbeddingProvider produces different vectors for different texts", async () => {
    const provider = new MockEmbeddingProvider();
    const a = await provider.embed("Hello world");
    const b = await provider.embed("Goodbye world");
    expect(a).not.toEqual(b);
  });

  test("MockEmbeddingProvider embedBatch works", async () => {
    const provider = new MockEmbeddingProvider();
    const results = await provider.embedBatch(["Hello", "World", "Test"]);
    expect(results.length).toBe(3);
    expect(results[0].length).toBe(256);
  });

  test("MockEmbeddingProvider produces normalized vectors", async () => {
    const provider = new MockEmbeddingProvider();
    const embedding = await provider.embed("Test normalization");
    const norm = Math.sqrt(embedding.reduce((s, v) => s + v * v, 0));
    expect(Math.abs(norm - 1.0)).toBeLessThan(0.01);
  });

  test("createEmbeddingProvider returns mock when no key", () => {
    delete process.env.OPENAI_API_KEY;
    const provider = createEmbeddingProvider();
    expect(provider).toBeInstanceOf(MockEmbeddingProvider);
  });
});
