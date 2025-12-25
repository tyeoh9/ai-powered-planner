'use client'

import { useEffect, useRef, useState } from 'react'
import { deleteFolder, renameFolder } from '@/lib/actions/folders'
import type { Folder } from '@/lib/actions/folders'

interface FolderContextMenuProps {
  folder: Folder
  position: { x: number; y: number }
  onClose: () => void
  onRefresh: () => void
  onMoveClick: (folder: Folder) => void
}

export function FolderContextMenu({
  folder,
  position,
  onClose,
  onRefresh,
  onMoveClick,
}: FolderContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)
  const [isRenaming, setIsRenaming] = useState(false)
  const [newName, setNewName] = useState(folder.name)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [onClose])

  async function handleRename() {
    if (!newName.trim()) return
    try {
      await renameFolder(folder.id, newName.trim())
      onRefresh()
      onClose()
    } catch (error) {
      console.error('Failed to rename:', error)
    }
  }

  async function handleDelete() {
    setError(null)
    try {
      await deleteFolder(folder.id)
      onRefresh()
      onClose()
    } catch (error: any) {
      setError(error.message || 'Cannot delete folder')
    }
  }

  function handleMoveClick() {
    onMoveClick(folder)
    onClose()
  }

  return (
    <div
      ref={menuRef}
      className="folder-context-menu"
      style={{ top: position.y, left: position.x }}
    >
      {isRenaming ? (
        <div className="context-menu-rename">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRename()
              if (e.key === 'Escape') setIsRenaming(false)
            }}
            autoFocus
          />
          <div className="context-menu-rename-actions">
            <button onClick={handleRename}>Save</button>
            <button onClick={() => setIsRenaming(false)}>Cancel</button>
          </div>
        </div>
      ) : (
        <>
          <button className="context-menu-item" onClick={() => setIsRenaming(true)}>
            Rename
          </button>
          <button className="context-menu-item" onClick={handleMoveClick}>
            Move to...
          </button>
          <hr className="context-menu-divider" />
          <button className="context-menu-item danger" onClick={handleDelete}>
            Delete
          </button>
          {error && <div className="context-menu-error">{error}</div>}
        </>
      )}
    </div>
  )
}
