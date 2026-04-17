import type { IEmbeddingProvider } from "./embedding.provider";

// Generates deterministic fake vectors based on text hash
function hashToVector(text: string, dims: number): number[] {
  const vector: number[] = [];
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash * 31 + text.charCodeAt(i)) | 0;
  }
  for (let i = 0; i < dims; i++) {
    hash = (hash * 1103515245 + 12345) | 0;
    vector.push(((hash >> 16) & 0x7fff) / 0x7fff - 0.5);
  }
  // Normalize
  const norm = Math.sqrt(vector.reduce((s, v) => s + v * v, 0));
  return vector.map((v) => v / norm);
}

export class MockEmbeddingProvider implements IEmbeddingProvider {
  readonly dimensions = 256; // Smaller than real (1536) for mock

  async embed(text: string): Promise<number[]> {
    return hashToVector(text, this.dimensions);
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    return texts.map((t) => hashToVector(t, this.dimensions));
  }
}
