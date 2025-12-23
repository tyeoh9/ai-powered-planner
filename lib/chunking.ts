import type { Chunk } from '@/types'

const MIN_CHUNK_CHARS = 50
const MAX_CHUNK_CHARS = 500
const MIN_CHUNKS_FOR_COMPARISON = 2

/**
 * Splits document content into trackable chunks
 * Strategy: Split on paragraph breaks, merge small chunks, split large ones
 * Ensures at least MIN_CHUNKS_FOR_COMPARISON chunks for semantic comparison
 */
export function chunkDocument(content: string): Chunk[] {
  if (!content.trim()) return []

  // Split on double newlines (paragraphs)
  const paragraphs = content.split(/\n\n+/)
  let chunks: Chunk[] = []
  let currentOffset = 0

  for (let i = 0; i < paragraphs.length; i++) {
    const para = paragraphs[i]
    if (!para.trim()) {
      // Account for empty paragraph separators
      currentOffset += para.length + 2 // +2 for \n\n
      continue
    }

    // Handle oversized paragraphs by splitting on sentences
    if (para.length > MAX_CHUNK_CHARS) {
      const sentences = splitIntoSentences(para)
      let sentenceOffset = currentOffset

      for (const sentence of sentences) {
        if (sentence.trim()) {
          chunks.push({
            id: `chunk_${chunks.length}`,
            content: sentence,
            startOffset: sentenceOffset,
            endOffset: sentenceOffset + sentence.length,
          })
        }
        sentenceOffset += sentence.length
      }
    } else {
      chunks.push({
        id: `chunk_${chunks.length}`,
        content: para,
        startOffset: currentOffset,
        endOffset: currentOffset + para.length,
      })
    }

    // Move offset past paragraph + separator
    currentOffset += para.length
    if (i < paragraphs.length - 1) {
      // Find actual separator length
      const nextParaIndex = content.indexOf(paragraphs[i + 1], currentOffset)
      if (nextParaIndex > currentOffset) {
        currentOffset = nextParaIndex
      }
    }
  }

  // Merge tiny chunks with neighbors
  chunks = mergeSmallChunks(chunks)

  // If we have only 1 chunk, force sentence-level splitting for semantic comparison
  if (chunks.length < MIN_CHUNKS_FOR_COMPARISON && content.length > MIN_CHUNK_CHARS) {
    chunks = forceSentenceChunking(content)
  }

  return chunks
}

/**
 * Split text into sentences (preserving punctuation)
 */
function splitIntoSentences(text: string): string[] {
  // Split on sentence boundaries but keep the delimiter
  const parts = text.split(/(?<=[.!?])\s+/)
  return parts.filter((p) => p.trim())
}

/**
 * Force sentence-level chunking for single-paragraph content
 * Ensures we have multiple chunks for semantic comparison
 */
function forceSentenceChunking(content: string): Chunk[] {
  const sentences = splitIntoSentences(content)
  if (sentences.length < 2) {
    // Can't split further - return as single chunk
    return [{
      id: 'chunk_0',
      content: content,
      startOffset: 0,
      endOffset: content.length,
    }]
  }

  const chunks: Chunk[] = []
  let offset = 0

  for (const sentence of sentences) {
    // Find actual position in content (handles spacing variations)
    const sentenceStart = content.indexOf(sentence, offset)
    if (sentenceStart === -1) continue

    if (sentence.trim().length >= MIN_CHUNK_CHARS) {
      chunks.push({
        id: `chunk_${chunks.length}`,
        content: sentence,
        startOffset: sentenceStart,
        endOffset: sentenceStart + sentence.length,
      })
    } else if (chunks.length > 0) {
      // Merge small sentence with previous chunk
      const prev = chunks[chunks.length - 1]
      prev.content = content.slice(prev.startOffset, sentenceStart + sentence.length)
      prev.endOffset = sentenceStart + sentence.length
    } else {
      // First chunk is small, will merge with next
      chunks.push({
        id: `chunk_${chunks.length}`,
        content: sentence,
        startOffset: sentenceStart,
        endOffset: sentenceStart + sentence.length,
      })
    }

    offset = sentenceStart + sentence.length
  }

  // Final merge pass for small chunks
  return mergeSmallChunks(chunks)
}

/**
 * Merge chunks smaller than MIN_CHUNK_CHARS with neighbors
 */
function mergeSmallChunks(chunks: Chunk[]): Chunk[] {
  if (chunks.length <= 1) return chunks

  const merged: Chunk[] = []
  let i = 0

  while (i < chunks.length) {
    const current = chunks[i]

    // If chunk is small and has a next neighbor, merge
    if (current.content.length < MIN_CHUNK_CHARS && i < chunks.length - 1) {
      const next = chunks[i + 1]
      merged.push({
        id: `chunk_${merged.length}`,
        content: current.content + '\n\n' + next.content,
        startOffset: current.startOffset,
        endOffset: next.endOffset,
      })
      i += 2
    } else {
      merged.push({
        ...current,
        id: `chunk_${merged.length}`,
      })
      i++
    }
  }

  return merged
}

/**
 * Get chunk by ID
 */
export function getChunkById(chunks: Chunk[], id: string): Chunk | undefined {
  return chunks.find((c) => c.id === id)
}

/**
 * Get chunk containing a specific offset position
 */
export function getChunkAtOffset(chunks: Chunk[], offset: number): Chunk | undefined {
  return chunks.find((c) => offset >= c.startOffset && offset <= c.endOffset)
}

/**
 * Find which chunks were modified between old and new content
 * Returns IDs of chunks in newChunks that differ from corresponding oldChunks
 */
export function findModifiedChunkIds(oldChunks: Chunk[], newChunks: Chunk[]): string[] {
  const modified: string[] = []

  // Simple approach: compare by position
  // If content at same index differs, mark as modified
  for (let i = 0; i < newChunks.length; i++) {
    const newChunk = newChunks[i]
    const oldChunk = oldChunks[i]

    if (!oldChunk || oldChunk.content !== newChunk.content) {
      modified.push(newChunk.id)
    }
  }

  return modified
}

/**
 * Extract key terms from text (for heuristic matching)
 */
export function extractKeyTerms(text: string): string[] {
  // Extract capitalized words (proper nouns), technical terms
  const words = text.split(/\s+/)
  const terms: string[] = []

  for (const word of words) {
    const cleaned = word.replace(/[^a-zA-Z0-9-_]/g, '')
    if (!cleaned) continue

    // Proper nouns (capitalized, not at sentence start)
    if (/^[A-Z][a-z]+/.test(cleaned) && cleaned.length > 2) {
      terms.push(cleaned.toLowerCase())
    }
    // Technical terms (camelCase, PascalCase, snake_case, contains numbers)
    if (/[a-z][A-Z]|[A-Z]{2,}|_|\d/.test(cleaned)) {
      terms.push(cleaned.toLowerCase())
    }
  }

  return [...new Set(terms)]
}
