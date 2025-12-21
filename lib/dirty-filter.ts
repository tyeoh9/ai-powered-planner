import type { AtRiskChunk, DirtyChunk, DirtyPriority, ConflictAnalysis } from '@/types'
import { extractKeyTerms } from './chunking'

const MAX_DIRTY_QUEUE = 10

interface EditContext {
  oldContent: string
  newContent: string
  modifiedChunkContent: string
}

/**
 * Filter at-risk chunks to identify true conflicts using heuristics + context broker analysis
 * Returns prioritized dirty queue (max 10 items)
 */
export function filterDirtyChunks(
  atRiskChunks: AtRiskChunk[],
  editContext: EditContext,
  conflictAnalyses: ConflictAnalysis[] = []
): DirtyChunk[] {
  const dirtyChunks: DirtyChunk[] = []

  // Build lookup for conflict analyses by chunkId
  const conflictMap = new Map<string, ConflictAnalysis>()
  for (const analysis of conflictAnalyses) {
    conflictMap.set(analysis.chunkId, analysis)
  }

  // Extract terms from the edit to detect what changed
  const oldTerms = new Set(extractKeyTerms(editContext.oldContent))
  const newTerms = new Set(extractKeyTerms(editContext.newContent))
  const modifiedTerms = new Set(extractKeyTerms(editContext.modifiedChunkContent))

  // Find terms that were added or removed in the edit
  const addedTerms = [...newTerms].filter((t) => !oldTerms.has(t))
  const removedTerms = [...oldTerms].filter((t) => !newTerms.has(t))

  for (const atRisk of atRiskChunks) {
    const chunkTerms = new Set(extractKeyTerms(atRisk.chunk.content))
    const conflictAnalysis = conflictMap.get(atRisk.chunkId)

    // Use context broker analysis if available
    let conflict = conflictAnalysis
      ? applyConflictAnalysis(atRisk, conflictAnalysis)
      : null

    // Fall back to heuristic detection if no analysis or consistent
    if (!conflict || (conflictAnalysis && conflictAnalysis.conflictType === 'consistent')) {
      conflict = detectConflict(atRisk, chunkTerms, addedTerms, removedTerms, modifiedTerms)
    }

    if (conflict) {
      dirtyChunks.push({
        chunkId: atRisk.chunkId,
        priority: conflict.priority,
        reason: conflict.reason,
        similarity: atRisk.similarity,
        originalContent: atRisk.chunk.content,
        conflictAnalysis, // Store for use in patch generation
      })
    }
  }

  // Sort by priority (P0 > P1), then by similarity
  dirtyChunks.sort((a, b) => {
    const priorityOrder = { P0: 0, P1: 1 }
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
    if (priorityDiff !== 0) return priorityDiff
    return b.similarity - a.similarity
  })

  // Cap at max queue size
  return dirtyChunks.slice(0, MAX_DIRTY_QUEUE)
}

/**
 * Convert context broker analysis to conflict result with appropriate priority
 */
function applyConflictAnalysis(
  _atRisk: AtRiskChunk,
  analysis: ConflictAnalysis
): ConflictResult | null {
  if (analysis.conflictType === 'consistent') {
    return null // No conflict, filter out
  }

  // P0 if has directives, P1 otherwise
  const priority: DirtyPriority =
    analysis.refactoringDirectives?.length > 0 ? 'P0' : 'P1'

  return {
    priority,
    reason: analysis.details || 'Needs update for consistency',
  }
}

interface ConflictResult {
  priority: DirtyPriority
  reason: string
}

/**
 * Detect if a chunk has a true conflict with the edit
 */
function detectConflict(
  atRisk: AtRiskChunk,
  chunkTerms: Set<string>,
  addedTerms: string[],
  removedTerms: string[],
  modifiedTerms: Set<string>
): ConflictResult | null {
  const chunkContent = atRisk.chunk.content.toLowerCase()

  // P0: Chunk still contains a removed term (stale reference)
  for (const removed of removedTerms) {
    if (chunkContent.includes(removed.toLowerCase())) {
      return {
        priority: 'P0',
        reason: `Contains outdated reference to "${removed}"`,
      }
    }
  }

  // P1: High similarity + shared terms with modified content
  const sharedWithModified = [...chunkTerms].filter((t) => modifiedTerms.has(t))
  if (sharedWithModified.length > 0 && atRisk.similarity >= 0.8) {
    return {
      priority: 'P1',
      reason: `Semantically related (shares: ${sharedWithModified.slice(0, 3).join(', ')})`,
    }
  }

  // P1: Moderate similarity + some term overlap
  if (atRisk.similarity >= 0.75 && sharedWithModified.length > 0) {
    return {
      priority: 'P1',
      reason: `May need review (${Math.round(atRisk.similarity * 100)}% similar)`,
    }
  }

  // P1: High similarity alone (semantic match without term overlap)
  if (atRisk.similarity >= 0.85) {
    return {
      priority: 'P1',
      reason: `High semantic similarity (${Math.round(atRisk.similarity * 100)}%)`,
    }
  }

  // Check for entity/noun overlap that might indicate related content
  const hasSignificantOverlap = [...chunkTerms].some((term) => {
    return addedTerms.some((added) => term.includes(added) || added.includes(term))
  })

  if (hasSignificantOverlap) {
    return {
      priority: 'P1',
      reason: 'Contains related terminology',
    }
  }

  // No true conflict detected - filter out
  return null
}

/**
 * Check if a specific term appears in text (case-insensitive)
 */
export function containsTerm(text: string, term: string): boolean {
  return text.toLowerCase().includes(term.toLowerCase())
}

/**
 * Find all occurrences of old term that should be replaced
 */
export function findStaleReferences(
  chunkContent: string,
  oldTerm: string,
  newTerm: string
): { start: number; end: number; oldText: string; newText: string }[] {
  const references: { start: number; end: number; oldText: string; newText: string }[] = []
  const lowerContent = chunkContent.toLowerCase()
  const lowerOld = oldTerm.toLowerCase()

  let searchStart = 0
  while (true) {
    const index = lowerContent.indexOf(lowerOld, searchStart)
    if (index === -1) break

    references.push({
      start: index,
      end: index + oldTerm.length,
      oldText: chunkContent.slice(index, index + oldTerm.length),
      newText: newTerm,
    })

    searchStart = index + 1
  }

  return references
}
