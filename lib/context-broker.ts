import type { AtRiskChunk, ConflictAnalysis } from '@/types'

export interface EditContext {
  oldTerm: string
  newTerm: string
  editedChunk: string
}

/**
 * Context Broker - Analyzes consistency conflicts between edited content and related chunks
 * Uses LLM to identify what needs updating
 */
export async function analyzeLogicConflicts(
  editContext: EditContext,
  atRiskChunks: AtRiskChunk[],
  signal?: AbortSignal
): Promise<ConflictAnalysis[]> {
  if (atRiskChunks.length === 0) return []

  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        editContext,
        chunks: atRiskChunks.map((c) => ({
          chunkId: c.chunkId,
          content: c.chunk.content,
          similarity: c.similarity,
        })),
      }),
      signal,
    })

    if (!response.ok) {
      console.error('Context broker API error:', response.status)
      return fallbackAnalysis(atRiskChunks)
    }

    const analyses: ConflictAnalysis[] = await response.json()
    return analyses
  } catch (error) {
    if ((error as Error).name === 'AbortError') return []
    console.error('Context broker error:', error)
    return fallbackAnalysis(atRiskChunks)
  }
}

/**
 * Fallback when API fails - assume needs_update for all chunks
 */
function fallbackAnalysis(atRiskChunks: AtRiskChunk[]): ConflictAnalysis[] {
  return atRiskChunks.map((c) => ({
    chunkId: c.chunkId,
    conflictType: 'needs_update',
    details: 'Unable to analyze - defaulting to needs update',
    refactoringDirectives: [],
  }))
}

/**
 * Extract old/new terms from edit context
 * Identifies the primary term change between old and new content
 */
export function extractTermChange(
  oldContent: string,
  newContent: string
): { oldTerm: string; newTerm: string } | null {
  // Simple heuristic: find first significant difference
  const oldWords = oldContent.split(/\s+/)
  const newWords = newContent.split(/\s+/)

  // Find first differing word sequence
  let diffStart = 0
  while (diffStart < oldWords.length && diffStart < newWords.length) {
    if (oldWords[diffStart] !== newWords[diffStart]) break
    diffStart++
  }

  if (diffStart >= oldWords.length && diffStart >= newWords.length) {
    return null // No difference found
  }

  // Find end of difference
  let oldDiffEnd = diffStart
  let newDiffEnd = diffStart

  // Look for where they converge again
  while (oldDiffEnd < oldWords.length && newDiffEnd < newWords.length) {
    if (oldWords[oldDiffEnd] === newWords[newDiffEnd]) break
    oldDiffEnd++
    newDiffEnd++
  }

  const oldTerm = oldWords.slice(diffStart, Math.max(diffStart + 1, oldDiffEnd)).join(' ')
  const newTerm = newWords.slice(diffStart, Math.max(diffStart + 1, newDiffEnd)).join(' ')

  if (!oldTerm || !newTerm) return null

  return { oldTerm, newTerm }
}
