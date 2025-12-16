import { create } from 'zustand'
import { Suggestion } from '@/types'

interface EditorState {
  // Editor content
  content: string
  setContent: (content: string) => void

  // Suggestion state
  suggestion: Suggestion | null
  setSuggestion: (suggestion: Suggestion | null) => void

  // Flag to prevent re-triggering after accept
  justAccepted: boolean
  setJustAccepted: (justAccepted: boolean) => void

  // Loading state
  isGenerating: boolean
  setIsGenerating: (isGenerating: boolean) => void

  // Error state
  error: string | null
  setError: (error: string | null) => void

  // Actions
  acceptSuggestion: () => string | null
  rejectSuggestion: () => void
}

export const useEditorStore = create<EditorState>((set, get) => ({
  content: '',
  setContent: (content) => set({ content }),

  suggestion: null,
  setSuggestion: (suggestion) => set({ suggestion, error: null }),

  justAccepted: false,
  setJustAccepted: (justAccepted) => set({ justAccepted }),

  isGenerating: false,
  setIsGenerating: (isGenerating) => set({ isGenerating }),

  error: null,
  setError: (error) => set({ error, isGenerating: false }),

  acceptSuggestion: () => {
    const { suggestion } = get()
    if (suggestion) {
      set({
        suggestion: null,
        justAccepted: true, // Prevent re-triggering
      })
      return suggestion.content
    }
    return null
  },

  rejectSuggestion: () => {
    set({ suggestion: null })
  },
}))
