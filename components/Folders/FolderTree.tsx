'use client'

import { useState, useEffect } from 'react'
import { useFolderStore } from '@/store/folder-store'
import { getFolders } from '@/lib/actions/folders'
import { moveDocument } from '@/lib/actions/documents'
import { FolderNode } from './FolderNode'
import { FolderContextMenu } from './FolderContextMenu'
import { CreateFolderButton } from './CreateFolderButton'
import type { Folder } from '@/lib/actions/folders'

interface FolderTreeProps {
  onMoveToModal: (item: { type: 'folder' | 'document'; id: string }) => void
}

export function FolderTree({ onMoveToModal }: FolderTreeProps) {
  const [contextMenu, setContextMenu] = useState<{
    folder: Folder
    position: { x: number; y: number }
  } | null>(null)
  const [isDragOverRoot, setIsDragOverRoot] = useState(false)

  const {
    folders,
    currentFolderId,
    dragItem,
    setFolders,
    setCurrentFolder,
    setDragItem,
    loadExpandedState,
    getFolderChildren,
  } = useFolderStore()

  useEffect(() => {
    loadExpandedState()
    refreshFolders()
  }, [])

  async function refreshFolders() {
    try {
      const data = await getFolders()
      setFolders(data)
    } catch (error) {
      console.error('Failed to load folders:', error)
    }
  }

  function handleContextMenu(e: React.MouseEvent, folder: Folder) {
    e.preventDefault()
    setContextMenu({
      folder,
      position: { x: e.clientX, y: e.clientY },
    })
  }

  function handleMoveClick(folder: Folder) {
    onMoveToModal({ type: 'folder', id: folder.id })
  }

  function handleRootDragOver(e: React.DragEvent) {
    e.preventDefault()
    if (dragItem) {
      setIsDragOverRoot(true)
      e.dataTransfer.dropEffect = 'move'
    }
  }

  function handleRootDragLeave() {
    setIsDragOverRoot(false)
  }

  async function handleRootDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragOverRoot(false)

    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'))
      if (data.type === 'document') {
        await moveDocument(data.id, null)
        // Trigger document refresh from parent
      }
      refreshFolders()
    } catch (error) {
      console.error('Failed to move to root:', error)
    }

    setDragItem(null)
  }

  const rootFolders = getFolderChildren(null)

  return (
    <div className="folder-tree">
      <div className="folder-tree-header">
        <span className="folder-tree-title">Folders</span>
        <CreateFolderButton onCreated={refreshFolders} />
      </div>

      <div
        className={`folder-root ${currentFolderId === null ? 'selected' : ''} ${isDragOverRoot ? 'drag-over' : ''}`}
        onClick={() => setCurrentFolder(null)}
        onDragOver={handleRootDragOver}
        onDragLeave={handleRootDragLeave}
        onDrop={handleRootDrop}
      >
        <span className="folder-icon">🏠</span>
        <span className="folder-name">All Documents</span>
      </div>

      <div className="folder-list">
        {rootFolders.map((folder) => (
          <FolderNode
            key={folder.id}
            folder={folder}
            level={0}
            onRefresh={refreshFolders}
            onContextMenu={handleContextMenu}
          />
        ))}
      </div>

      {contextMenu && (
        <FolderContextMenu
          folder={contextMenu.folder}
          position={contextMenu.position}
          onClose={() => setContextMenu(null)}
          onRefresh={refreshFolders}
          onMoveClick={handleMoveClick}
        />
      )}
    </div>
  )
}

export { FolderTree as default }
