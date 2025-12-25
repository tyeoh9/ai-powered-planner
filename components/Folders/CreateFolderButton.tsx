'use client'

import { useState } from 'react'
import { createFolder } from '@/lib/actions/folders'
import { useFolderStore } from '@/store/folder-store'

interface CreateFolderButtonProps {
  onCreated: () => void
}

export function CreateFolderButton({ onCreated }: CreateFolderButtonProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [name, setName] = useState('')
  const { currentFolderId } = useFolderStore()

  async function handleCreate() {
    if (!name.trim()) return

    try {
      await createFolder(name.trim(), currentFolderId)
      setName('')
      setIsCreating(false)
      onCreated()
    } catch (error: any) {
      console.error('Failed to create folder:', error)
      alert(error.message || 'Failed to create folder')
    }
  }

  if (isCreating) {
    return (
      <div className="create-folder-input-wrapper">
        <input
          type="text"
          className="create-folder-input"
          placeholder="Folder name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleCreate()
            if (e.key === 'Escape') {
              setIsCreating(false)
              setName('')
            }
          }}
          autoFocus
        />
        <div className="create-folder-actions">
          <button className="create-folder-save" onClick={handleCreate}>
            Create
          </button>
          <button
            className="create-folder-cancel"
            onClick={() => {
              setIsCreating(false)
              setName('')
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <button className="create-folder-button" onClick={() => setIsCreating(true)}>
      + New Folder
    </button>
  )
}
