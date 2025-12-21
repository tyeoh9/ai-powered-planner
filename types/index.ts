export interface DiffSegment {
  type: 'unchanged' | 'added' | 'removed'
  text: string
}

export type CursorContext = 'mid-sentence' | 'end-of-sentence' | 'end-of-line' | 'new-block'

export interface FIMPayload {
  prefix: string
  suffix: string
  cursorContext: CursorContext
}

export interface Suggestion {
  id: string
  originalContent: string
  newContent: string
  diff: DiffSegment[]
  type: 'edit'
  cursorPosition?: number
}

// Document chunking for consistency tracking
export interface Chunk {
  id: string // chunk_{index}
  content: string
  startOffset: number
  endOffset: number
}

export interface ChunkEmbedding {
  chunkId: string
  embedding: number[]
}

// Dirty chunk queue for consistency updates
export type DirtyPriority = 'P0' | 'P1'

export interface DirtyChunk {
  chunkId: string
  priority: DirtyPriority
  reason: string
  similarity: number
  originalContent: string
  patch?: {
    before: string
    after: string
  }
  conflictAnalysis?: ConflictAnalysis
}

export interface AtRiskChunk {
  chunkId: string
  similarity: number
  chunk: Chunk
}

// Context Broker - Conflict analysis
export type ConflictType = 'needs_update' | 'consistent'

export interface RefactoringDirective {
  action: 'replace' | 'rephrase' | 'remove' | 'keep'
  target: string
  replacement?: string
  rationale: string
}

export interface ConflictAnalysis {
  chunkId: string
  conflictType: ConflictType
  details: string
  refactoringDirectives: RefactoringDirective[]
}

// Primary intent captures the user's change delta
export interface PrimaryIntent {
  oldTerm: string
  newTerm: string
  intentSummary: string
}
