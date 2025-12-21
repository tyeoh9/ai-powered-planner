import type { Chunk, ChunkEmbedding } from '@/types'

// Lazy-loaded pipeline
let embeddingPipeline: unknown = null
let isLoading = false
let loadPromise: Promise<unknown> | null = null

const SIMILARITY_THRESHOLD = 0.75
const TRANSFORMERS_CDN = 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2'

declare global {
  interface Window {
    TransformersApi?: {
      pipeline: (task: string, model: string) => Promise<unknown>
    }
  }
}

/**
 * Check if running in browser
 */
function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

/**
 * Load transformers library via script tag
 */
function loadTransformersScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if (window.TransformersApi) {
      resolve()
      return
    }

    // Check if script is already in DOM
    const existingScript = document.querySelector(`script[src="${TRANSFORMERS_CDN}"]`)
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve())
      return
    }

    const script = document.createElement('script')
    script.src = TRANSFORMERS_CDN
    script.type = 'module'
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load transformers library'))
    document.head.appendChild(script)
  })
}

/**
 * Initialize the embedding model (lazy load)
 * Uses all-MiniLM-L6-v2 - 384 dimensions, good balance of speed/quality
 */
async function getEmbeddingPipeline() {
  // Only run in browser - SSR will fail
  if (!isBrowser()) {
    throw new Error('Embeddings can only be generated in the browser')
  }

  if (embeddingPipeline) return embeddingPipeline

  if (isLoading && loadPromise) {
    return loadPromise
  }

  isLoading = true
  loadPromise = (async () => {
    // Load via script tag and use global
    await loadTransformersScript()

    // Access the library from the global scope
    // The CDN exposes it differently - need to use dynamic import in browser
    const module = await new Function(
      'return import("https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2")'
    )()

    embeddingPipeline = await module.pipeline(
      'feature-extraction',
      'Xenova/all-MiniLM-L6-v2'
    )
    isLoading = false
    return embeddingPipeline
  })()

  return loadPromise
}

/**
 * Generate embedding for a single text
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const pipe = await getEmbeddingPipeline()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const output = await (pipe as any)(text, { pooling: 'mean', normalize: true })
  return Array.from(output.data)
}

/**
 * Generate embeddings for multiple texts (batched)
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const embeddings: number[][] = []
  for (const text of texts) {
    const emb = await generateEmbedding(text)
    embeddings.push(emb)
  }
  return embeddings
}

/**
 * Compute cosine similarity between two vectors
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0

  let dotProduct = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB)
  if (denominator === 0) return 0

  return dotProduct / denominator
}

/**
 * Find chunks similar to query embedding
 */
export function findSimilarChunks(
  queryEmbedding: number[],
  chunkEmbeddings: ChunkEmbedding[],
  threshold: number = SIMILARITY_THRESHOLD
): Array<{ chunkId: string; similarity: number }> {
  const results: Array<{ chunkId: string; similarity: number }> = []

  for (const ce of chunkEmbeddings) {
    const similarity = cosineSimilarity(queryEmbedding, ce.embedding)
    if (similarity >= threshold) {
      results.push({ chunkId: ce.chunkId, similarity })
    }
  }

  // Sort by similarity descending
  return results.sort((a, b) => b.similarity - a.similarity)
}

/**
 * Generate embeddings for all chunks and return cache
 */
export async function embedChunks(chunks: Chunk[]): Promise<Map<string, number[]>> {
  const cache = new Map<string, number[]>()

  for (const chunk of chunks) {
    const embedding = await generateEmbedding(chunk.content)
    cache.set(chunk.id, embedding)
  }

  return cache
}

/**
 * Update embedding cache for specific chunk IDs
 */
export async function updateEmbeddingCache(
  cache: Map<string, number[]>,
  chunks: Chunk[],
  chunkIds: string[]
): Promise<Map<string, number[]>> {
  const newCache = new Map(cache)

  for (const id of chunkIds) {
    const chunk = chunks.find((c) => c.id === id)
    if (chunk) {
      const embedding = await generateEmbedding(chunk.content)
      newCache.set(id, embedding)
    }
  }

  return newCache
}

/**
 * Convert cache Map to ChunkEmbedding array for similarity search
 */
export function cacheToEmbeddings(cache: Map<string, number[]>): ChunkEmbedding[] {
  const embeddings: ChunkEmbedding[] = []
  cache.forEach((embedding, chunkId) => {
    embeddings.push({ chunkId, embedding })
  })
  return embeddings
}

/**
 * Check if model is loaded
 */
export function isModelLoaded(): boolean {
  return embeddingPipeline !== null
}

/**
 * Preload the model (call early to reduce first-use latency)
 */
export async function preloadModel(): Promise<void> {
  await getEmbeddingPipeline()
}
