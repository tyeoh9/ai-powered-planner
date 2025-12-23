import type { Chunk, CursorContext, DirtyChunk } from '@/types'

/**
 * Detect cursor context based on chunk content
 */
function detectCursorContext(chunk: Chunk): CursorContext {
  const content = chunk.content.trimEnd()
  if (content.endsWith('\n\n')) return 'new-block'
  if (content.endsWith('\n')) return 'end-of-line'
  if (/[.!?]$/.test(content)) return 'end-of-sentence'
  return 'mid-sentence'
}

/**
 * Generate a FIM patch for a dirty chunk
 * Calls the /api/patch endpoint with chunk-specific context
 */
export async function generateChunkPatch(
  dirtyChunk: DirtyChunk,
  allChunks: Chunk[],
  globalContext: string,
  signal?: AbortSignal
): Promise<{ before: string; after: string } | null> {
  const chunk = allChunks.find((c) => c.id === dirtyChunk.chunkId)
  if (!chunk) return null

  // Build prefix (chunks before) and suffix (chunks after)
  const chunkIndex = allChunks.findIndex((c) => c.id === dirtyChunk.chunkId)
  const prefixChunks = allChunks.slice(Math.max(0, chunkIndex - 2), chunkIndex)
  const suffixChunks = allChunks.slice(chunkIndex + 1, chunkIndex + 3)

  const prefix = prefixChunks.map((c) => c.content).join('\n\n')
  const suffix = suffixChunks.map((c) => c.content).join('\n\n')

  // Detect cursor context for position-based prompts
  const cursorContext = detectCursorContext(chunk)

  try {
    const response = await fetch('/api/patch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chunkContent: chunk.content,
        prefix,
        suffix,
        globalContext,
        reason: dirtyChunk.reason,
        conflictAnalysis: dirtyChunk.conflictAnalysis,
        cursorContext,
      }),
      signal,
    })

    if (!response.ok) {
      console.error('Patch API error:', response.status)
      return null
    }

    const reader = response.body?.getReader()
    if (!reader) return null

    // Read streamed response
    const decoder = new TextDecoder()
    let patchedContent = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      patchedContent += decoder.decode(value)
    }

    patchedContent = patchedContent.trim()

    if (!patchedContent || patchedContent === chunk.content) {
      return null
    }

    return {
      before: chunk.content,
      after: patchedContent,
    }
  } catch (error) {
    if ((error as Error).name === 'AbortError') return null
    console.error('Chunk patch error:', error)
    return null
  }
}

/**
 * Simple find-replace patch for obvious term substitutions
 * Used as fallback or for simple cases
 */
export function simpleTermReplace(
  content: string,
  oldTerm: string,
  newTerm: string
): { before: string; after: string } | null {
  if (!content.toLowerCase().includes(oldTerm.toLowerCase())) {
    return null
  }

  // Case-preserving replacement
  const regex = new RegExp(escapeRegex(oldTerm), 'gi')
  const after = content.replace(regex, (match) => {
    // Preserve case pattern
    if (match === match.toUpperCase()) return newTerm.toUpperCase()
    if (match === match.toLowerCase()) return newTerm.toLowerCase()
    if (match[0] === match[0].toUpperCase()) {
      return newTerm.charAt(0).toUpperCase() + newTerm.slice(1)
    }
    return newTerm
  })

  if (after === content) return null

  return { before: content, after }
}

function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Apply a patch to document content
 */
export function applyPatch(
  documentContent: string,
  chunk: Chunk,
  patch: { before: string; after: string }
): string {
  // Find the chunk in the document and replace
  const before = documentContent.slice(0, chunk.startOffset)
  const after = documentContent.slice(chunk.endOffset)

  return before + patch.after + after
}
