import { describe, test, expect } from "bun:test";
import { chunkText } from "./chunker";

describe("Text Chunker", () => {
  test("returns single chunk for short text", () => {
    const chunks = chunkText("Hello world, this is a short text.");
    expect(chunks.length).toBe(1);
    expect(chunks[0].content).toBe("Hello world, this is a short text.");
    expect(chunks[0].position).toBe(0);
  });

  test("splits long text into multiple chunks", () => {
    // Generate text that's definitely longer than 512 tokens
    const paragraphs = Array.from(
      { length: 20 },
      (_, i) =>
        `Paragraph ${i + 1}: This is a fairly long paragraph that contains some meaningful text content. ` +
        `It discusses various topics and ideas that are relevant to the knowledge base. ` +
        `The purpose of this text is to test the chunking functionality of the system.`,
    );
    const longText = paragraphs.join("\n\n");

    const chunks = chunkText(longText);
    expect(chunks.length).toBeGreaterThan(1);

    // All chunks should have content
    for (const chunk of chunks) {
      expect(chunk.content.length).toBeGreaterThan(0);
    }

    // Positions should be sequential
    for (let i = 0; i < chunks.length; i++) {
      expect(chunks[i].position).toBe(i);
    }
  });

  test("preserves paragraph boundaries when possible", () => {
    const text = "First paragraph.\n\nSecond paragraph.\n\nThird paragraph.";
    const chunks = chunkText(text);
    // Short text should be one chunk
    expect(chunks.length).toBe(1);
    expect(chunks[0].content).toContain("First paragraph");
    expect(chunks[0].content).toContain("Third paragraph");
  });
});
