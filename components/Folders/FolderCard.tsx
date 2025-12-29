'use client'

import { useState } from 'react'
import { deleteFolder } from '@/lib/actions/folders'
import { useFolderStore } from '@/store/folder-store'

interface FolderCardProps {
  id: string
  name: string
  onDelete: (id: string) => void
  onMoveClick?: (id: string) => void
}

export function FolderCard({ id, name, onDelete, onMoveClick }: FolderCardProps) {
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { setCurrentFolder, setDragItem } = useFolderStore()

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation()

    if (!confirmingDelete) {
      setConfirmingDelete(true)
      return
    }

    setIsDeleting(true)
    setError(null)
    try {
      await deleteFolder(id)
      onDelete(id)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete folder'
      setError(message)
      setIsDeleting(false)
      setConfirmingDelete(false)
    }
  }

  function handleClick() {
    setCurrentFolder(id)
  }

  function handleDragStart(e: React.DragEvent) {
    setDragItem({ type: 'folder', id })
    e.dataTransfer.setData('application/json', JSON.stringify({ type: 'folder', id }))
    e.dataTransfer.effectAllowed = 'move'
  }

  function handleDragEnd() {
    setDragItem(null)
  }

  function handleContextMenu(e: React.MouseEvent) {
    if (onMoveClick) {
      e.preventDefault()
      onMoveClick(id)
    }
  }

  return (
    <div
      className="document-card folder-card"
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onContextMenu={handleContextMenu}
      onClick={handleClick}
    >
      <div className="folder-card-content">
        <span className="folder-card-icon">📁</span>
        <h3 className="document-card-title">{name || 'Untitled Folder'}</h3>
      </div>
      {error && <p className="folder-card-error">{error}</p>}
      <button
        onClick={handleDelete}
        onBlur={() => setConfirmingDelete(false)}
        disabled={isDeleting}
        className={`document-card-delete ${confirmingDelete ? 'confirming' : ''}`}
      >
        {isDeleting ? 'Deleting...' : confirmingDelete ? 'Confirm?' : 'Delete'}
      </button>
    </div>
  )
}
