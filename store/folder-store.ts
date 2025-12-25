import { create } from 'zustand'
import { Folder } from '@/lib/actions/folders'
import { Document } from '@/lib/actions/documents'

const EXPANDED_STORAGE_KEY = 'folder-expanded-state'

interface DragItem {
  type: 'folder' | 'document'
  id: string
}

interface FolderState {
  folders: Folder[]
  documents: Document[]
  currentFolderId: string | null
  expandedIds: Set<string>
  dragItem: DragItem | null
  dragOverId: string | null

  setFolders: (folders: Folder[]) => void
  setDocuments: (documents: Document[]) => void
  setCurrentFolder: (id: string | null) => void
  toggleExpanded: (id: string) => void
  setExpanded: (id: string, expanded: boolean) => void
  setDragItem: (item: DragItem | null) => void
  setDragOverId: (id: string | null) => void
  loadExpandedState: () => void

  // Computed helpers
  getFolderChildren: (parentId: string | null) => Folder[]
  getDocumentsInFolder: (folderId: string | null) => Document[]
}

function loadFromStorage(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const stored = localStorage.getItem(EXPANDED_STORAGE_KEY)
    if (stored) {
      return new Set(JSON.parse(stored))
    }
  } catch {
    // ignore
  }
  return new Set()
}

function saveToStorage(expandedIds: Set<string>) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(EXPANDED_STORAGE_KEY, JSON.stringify([...expandedIds]))
  } catch {
    // ignore
  }
}

export const useFolderStore = create<FolderState>((set, get) => ({
  folders: [],
  documents: [],
  currentFolderId: null,
  expandedIds: new Set(),
  dragItem: null,
  dragOverId: null,

  setFolders: (folders) => set({ folders }),

  setDocuments: (documents) => set({ documents }),

  setCurrentFolder: (id) => set({ currentFolderId: id }),

  toggleExpanded: (id) => {
    const { expandedIds } = get()
    const newExpanded = new Set(expandedIds)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    saveToStorage(newExpanded)
    set({ expandedIds: newExpanded })
  },

  setExpanded: (id, expanded) => {
    const { expandedIds } = get()
    const newExpanded = new Set(expandedIds)
    if (expanded) {
      newExpanded.add(id)
    } else {
      newExpanded.delete(id)
    }
    saveToStorage(newExpanded)
    set({ expandedIds: newExpanded })
  },

  setDragItem: (item) => set({ dragItem: item }),

  setDragOverId: (id) => set({ dragOverId: id }),

  loadExpandedState: () => {
    set({ expandedIds: loadFromStorage() })
  },

  getFolderChildren: (parentId) => {
    const { folders } = get()
    return folders.filter((f) => f.parent_id === parentId)
  },

  getDocumentsInFolder: (folderId) => {
    const { documents } = get()
    return documents.filter((d) => d.folder_id === folderId)
  },
}))
