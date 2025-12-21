import { create } from 'zustand'
import type { Suggestion, Chunk, DirtyChunk } from '@/types'

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

  // Chunk tracking for consistency
  chunks: Chunk[]
  setChunks: (chunks: Chunk[]) => void

  // Embedding cache (chunkId -> embedding vector)
  embeddingCache: Map<string, number[]>
  setEmbeddingCache: (cache: Map<string, number[]>) => void
  updateEmbedding: (chunkId: string, embedding: number[]) => void

  // Dirty chunk queue for consistency updates
  dirtyQueue: DirtyChunk[]
  setDirtyQueue: (queue: DirtyChunk[]) => void
  currentDirtyIndex: number
  setCurrentDirtyIndex: (index: number) => void
  advanceDirtyQueue: () => void
  clearDirtyQueue: () => void

  // Auditing state
  isAuditing: boolean
  setIsAuditing: (auditing: boolean) => void

  // Patch context for lazy generation
  patchContext: string
  setPatchContext: (ctx: string) => void
}

export const useEditorStore = create<EditorState>((set, get) => ({
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

  // Chunk tracking
  chunks: [],
  setChunks: (chunks) => set({ chunks }),

  // Embedding cache
  embeddingCache: new Map(),
  setEmbeddingCache: (cache) => set({ embeddingCache: cache }),
  updateEmbedding: (chunkId, embedding) => {
    const cache = new Map(get().embeddingCache)
    cache.set(chunkId, embedding)
    set({ embeddingCache: cache })
  },

  // Dirty queue
  dirtyQueue: [],
  setDirtyQueue: (queue) => set({ dirtyQueue: queue, currentDirtyIndex: 0 }),
  currentDirtyIndex: 0,
  setCurrentDirtyIndex: (index) => set({ currentDirtyIndex: index }),
  advanceDirtyQueue: () => {
    const { currentDirtyIndex, dirtyQueue } = get()
    if (currentDirtyIndex < dirtyQueue.length - 1) {
      set({ currentDirtyIndex: currentDirtyIndex + 1 })
    } else {
      // Queue exhausted
      set({ dirtyQueue: [], currentDirtyIndex: 0 })
    }
  },
  clearDirtyQueue: () => set({ dirtyQueue: [], currentDirtyIndex: 0 }),

  // Auditing
  isAuditing: false,
  setIsAuditing: (auditing) => set({ isAuditing: auditing }),

  // Patch context
  patchContext: '',
  setPatchContext: (ctx) => set({ patchContext: ctx }),
}))
