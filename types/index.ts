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
