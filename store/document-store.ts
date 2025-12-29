import { create } from 'zustand'

interface DocumentState {
  currentDocId: string | null
  title: string
  isSaving: boolean
  lastSavedAt: Date | null
  isDirty: boolean
  saveError: string | null

  setCurrentDoc: (id: string | null, title: string) => void
  setTitle: (title: string) => void
  markDirty: () => void
  markSaving: () => void
  markSaved: () => void
  setSaveError: (error: string | null) => void
  reset: () => void
}

export const useDocumentStore = create<DocumentState>((set) => ({
  currentDocId: null,
  title: 'Untitled',
  isSaving: false,
  lastSavedAt: null,
  isDirty: false,
  saveError: null,

  setCurrentDoc: (id, title) => set({
    currentDocId: id,
    title,
    isDirty: false,
    lastSavedAt: null,
    saveError: null,
  }),

  setTitle: (title) => set({ title, isDirty: true, saveError: null }),

  markDirty: () => set({ isDirty: true }),

  markSaving: () => set({ isSaving: true }),

  markSaved: () => set({
    isSaving: false,
    isDirty: false,
    lastSavedAt: new Date(),
    saveError: null,
  }),

  setSaveError: (error) => set({ saveError: error, isSaving: false }),

  reset: () => set({
    currentDocId: null,
    title: 'Untitled',
    isSaving: false,
    lastSavedAt: null,
    isDirty: false,
    saveError: null,
  }),
}))
