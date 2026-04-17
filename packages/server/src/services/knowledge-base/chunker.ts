export interface Chunk {
  content: string;
  position: number;
}

const DEFAULT_CHUNK_SIZE = 512;
const DEFAULT_CHUNK_OVERLAP = 50;

// Simple word-based token approximation (1 token ~ 4 chars for English, ~2 for Hebrew)
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 3);
}

/**
 * Recursive character text splitter
 * Splits text into chunks of approximately `chunkSize` tokens with `overlap` token overlap.
 * Tries to split on paragraph > sentence > word boundaries.
 */
export function chunkText(
  text: string,
  chunkSize: number = DEFAULT_CHUNK_SIZE,
  overlap: number = DEFAULT_CHUNK_OVERLAP,
): Chunk[] {
  const separators = ["\n\n", "\n", ". ", " "];
  return recursiveSplit(text, separators, chunkSize, overlap);
}

function recursiveSplit(
  text: string,
  separators: string[],
  chunkSize: number,
  overlap: number,
): Chunk[] {
  if (estimateTokens(text) <= chunkSize) {
    return [{ content: text.trim(), position: 0 }];
  }

  const sep = separators.find((s) => text.includes(s)) || separators[separators.length - 1];
  const parts = text.split(sep);
  const chunks: Chunk[] = [];
  let currentChunk = "";
  let position = 0;

  for (const part of parts) {
    const candidate = currentChunk ? currentChunk + sep + part : part;

    if (estimateTokens(candidate) > chunkSize && currentChunk) {
      chunks.push({ content: currentChunk.trim(), position });
      position++;

      // Overlap: keep the tail of current chunk
      const words = currentChunk.split(/\s+/);
      const overlapWords = Math.ceil(overlap * 3); // Approximate chars for overlap tokens
      const overlapText = words
        .slice(-Math.min(words.length, Math.ceil(overlapWords / 5)))
        .join(" ");
      currentChunk = overlapText + sep + part;
    } else {
      currentChunk = candidate;
    }
  }

  if (currentChunk.trim()) {
    chunks.push({ content: currentChunk.trim(), position });
  }

  return chunks;
}
