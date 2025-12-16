export interface Suggestion {
  id: string
  content: string
  position: number
  type: 'tech-stack'
}

export interface EditorState {
  content: string
  suggestion: Suggestion | null
  isGenerating: boolean
}
