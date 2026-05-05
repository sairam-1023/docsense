import { GoogleGenAI } from '@google/genai';
const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY! });

export let embeddingStore: { chunk: string; embedding: number[] }[] = [];

// Convert text to a vector using Google's free embedding model
export async function embedText(text: string): Promise<number[]> {
  const result = await ai.models.embedContent({
    model: 'text-embedding-004',
    contents: text,
  });
  return result.embeddings?.[0]?.values ?? [];
}

// Embed all chunks and store them
export async function embedChunks(chunks: string[]): Promise<void> {
  embeddingStore = [];

  // Process in batches of 10 to stay within rate limits
  for (let i = 0; i < chunks.length; i += 10) {
    const batch = chunks.slice(i, i + 10);
    const embeddings = await Promise.all(batch.map(embedText));

    batch.forEach((chunk, idx) => {
      embeddingStore.push({ chunk, embedding: embeddings[idx] });
    });

    // Small delay between batches to avoid hitting rate limits
    if (i + 10 < chunks.length) {
      await new Promise(r => setTimeout(r, 200));
    }
  }
}

// Cosine similarity — measures how similar two vectors are
function cosineSimilarity(a: number[], b: number[]): number {
  const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dot / (magA * magB);
}

// Find the top K most relevant chunks for a given question
export async function findRelevantChunks(question: string, topK = 4): Promise<string[]> {
  if (embeddingStore.length === 0) return [];

  const questionEmbedding = await embedText(question);

  const scored = embeddingStore.map(({ chunk, embedding }) => ({
    chunk,
    score: cosineSimilarity(questionEmbedding, embedding),
  }));

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK).map(s => s.chunk);
}