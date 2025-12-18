import { create } from 'zustand'
import { Suggestion } from '@/types'

interface EditorState {
  // Editor content
  content: string
  setContent: (content: string) => void

  // Suggestion state
  suggestion: Suggestion | null
  setSuggestion: (suggestion: Suggestion | null) => void

  // Autocomplete toggle
  isAutocompleteEnabled: boolean
  setAutocompleteEnabled: (enabled: boolean) => void

  // Loading state
  isGenerating: boolean
  setIsGenerating: (isGenerating: boolean) => void

  // Error state
  error: string | null
  setError: (error: string | null) => void

  // Actions
  acceptSuggestion: () => void
  rejectSuggestion: () => void
}

export const useEditorStore = create<EditorState>((set) => ({
  content: '',
  setContent: (content) => set({ content }),

  suggestion: null,
  setSuggestion: (suggestion) => set({ suggestion, error: null }),

  isAutocompleteEnabled: true,
  setAutocompleteEnabled: (enabled) => set({ isAutocompleteEnabled: enabled }),

  isGenerating: false,
  setIsGenerating: (isGenerating) => set({ isGenerating }),

  error: null,
  setError: (error) => set({ error }),

  acceptSuggestion: () => {
    set({ suggestion: null })
  },

  rejectSuggestion: () => {
    set({ suggestion: null })
  },
}))
