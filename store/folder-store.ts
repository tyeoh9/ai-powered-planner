import { create } from 'zustand'
import { Folder } from '@/lib/actions/folders'
import { Document } from '@/lib/actions/documents'

interface DragItem {
  type: 'folder' | 'document'
  id: string
}

interface FolderState {
  folders: Folder[]
  documents: Document[]
  currentFolderId: string | null
  dragItem: DragItem | null
  dragOverId: string | null

  setFolders: (folders: Folder[]) => void
  setDocuments: (documents: Document[]) => void
  setCurrentFolder: (id: string | null) => void
  setDragItem: (item: DragItem | null) => void
  setDragOverId: (id: string | null) => void

  // Computed helpers
  getFolderChildren: (parentId: string | null) => Folder[]
  getDocumentsInFolder: (folderId: string | null) => Document[]
}

export const useFolderStore = create<FolderState>((set, get) => ({
  folders: [],
  documents: [],
  currentFolderId: null,
  dragItem: null,
  dragOverId: null,

  setFolders: (folders) => set({ folders }),

  setDocuments: (documents) => set({ documents }),

  setCurrentFolder: (id) => set({ currentFolderId: id }),

  setDragItem: (item) => set({ dragItem: item }),

  setDragOverId: (id) => set({ dragOverId: id }),

  getFolderChildren: (parentId) => {
    const { folders } = get()
    return folders.filter((f) => f.parent_id === parentId)
  },

  getDocumentsInFolder: (folderId) => {
    const { documents } = get()
    return documents.filter((d) => d.folder_id === folderId)
  },
}))
