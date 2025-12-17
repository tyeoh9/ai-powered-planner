export interface DiffSegment {
  type: 'unchanged' | 'added' | 'removed'
  text: string
}

export interface Suggestion {
  id: string
  originalContent: string
  newContent: string
  diff: DiffSegment[]
  type: 'edit'
}

export interface EditorState {
  content: string
  suggestion: Suggestion | null
  isGenerating: boolean
}
