'use client'

import { useEffect, useRef, useState } from 'react'
import { useFolderStore } from '@/store/folder-store'
import { moveDocument } from '@/lib/actions/documents'
import { moveFolder } from '@/lib/actions/folders'
import type { Folder } from '@/lib/actions/folders'

interface MoveToModalProps {
  item: { type: 'folder' | 'document'; id: string }
  onClose: () => void
  onMoved: () => void
}

export function MoveToModal({ item, onClose, onMoved }: MoveToModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isMoving, setIsMoving] = useState(false)

  const { folders, getFolderChildren } = useFolderStore()

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [onClose])

  async function handleMove() {
    setError(null)
    setIsMoving(true)

    const result = item.type === 'document'
      ? await moveDocument(item.id, selectedFolderId)
      : await moveFolder(item.id, selectedFolderId)

    if (!result.success) {
      setError(result.error)
      setIsMoving(false)
      return
    }

    onMoved()
    onClose()
  }

  function renderFolderList(parentId: string | null, level: number): React.ReactNode {
    const children = getFolderChildren(parentId)
    return children.map((folder) => {
      // Don't show the item being moved (for folders)
      if (item.type === 'folder' && folder.id === item.id) return null

      return (
        <div key={folder.id}>
          <button
            className={`move-to-folder-item ${selectedFolderId === folder.id ? 'selected' : ''}`}
            style={{ paddingLeft: level * 16 + 12 }}
            onClick={() => setSelectedFolderId(folder.id)}
          >
            <span className="folder-icon">📁</span>
            {folder.name}
          </button>
          {renderFolderList(folder.id, level + 1)}
        </div>
      )
    })
  }

  return (
    <div className="modal-overlay">
      <div ref={modalRef} className="move-to-modal">
        <div className="move-to-header">
          <h3>Move to folder</h3>
          <button className="move-to-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="move-to-list">
          <button
            className={`move-to-folder-item ${selectedFolderId === null ? 'selected' : ''}`}
            onClick={() => setSelectedFolderId(null)}
          >
            <span className="folder-icon">🏠</span>
            Root (no folder)
          </button>
          {renderFolderList(null, 1)}
        </div>

        {error && <div className="move-to-error">{error}</div>}

        <div className="move-to-actions">
          <button className="move-to-cancel" onClick={onClose}>
            Cancel
          </button>
          <button className="move-to-confirm" onClick={handleMove} disabled={isMoving}>
            {isMoving ? 'Moving...' : 'Move'}
          </button>
        </div>
      </div>
    </div>
  )
}
