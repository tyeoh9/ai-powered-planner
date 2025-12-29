'use client'

import { useState } from 'react'
import { createFolder } from '@/lib/actions/folders'
import { useFolderStore } from '@/store/folder-store'

interface CreateFolderButtonProps {
  onCreated: () => void
}

export function CreateFolderButton({ onCreated }: CreateFolderButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { currentFolderId } = useFolderStore()

  async function handleCreate() {
    if (!name.trim() || isSubmitting) return
    setError(null)
    setIsSubmitting(true)

    const result = await createFolder(name.trim(), currentFolderId)
    setIsSubmitting(false)

    if (!result.success) {
      setError(result.error)
      return
    }

    setName('')
    setIsOpen(false)
    onCreated()
  }

  function handleClose() {
    setIsOpen(false)
    setName('')
    setError(null)
  }

  return (
    <>
      <button className="new-document-button" onClick={() => setIsOpen(true)}>
        + New Folder
      </button>

      {isOpen && (
        <div className="modal-overlay" onClick={handleClose}>
          <div className="create-folder-modal" onClick={(e) => e.stopPropagation()}>
            <div className="create-folder-modal-header">
              <h3>Create New Folder</h3>
              <button className="modal-close-btn" onClick={handleClose}>×</button>
            </div>
            <div className="create-folder-modal-body">
              <input
                type="text"
                className={`create-folder-modal-input ${error ? 'input-error' : ''}`}
                placeholder="Folder name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  setError(null)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreate()
                  if (e.key === 'Escape') handleClose()
                }}
                autoFocus
              />
              {error && <p className="input-error-message">{error}</p>}
            </div>
            <div className="create-folder-modal-actions">
              <button className="modal-cancel-btn" onClick={handleClose}>
                Cancel
              </button>
              <button
                className="modal-create-btn"
                onClick={handleCreate}
                disabled={!name.trim() || isSubmitting}
              >
                {isSubmitting ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
