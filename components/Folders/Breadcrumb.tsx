'use client'

import { useFolderStore } from '@/store/folder-store'
import type { Folder } from '@/lib/actions/folders'

interface BreadcrumbProps {
  path: Folder[]
}

export function Breadcrumb({ path }: BreadcrumbProps) {
  const { setCurrentFolder } = useFolderStore()

  function handleClick(folderId: string | null) {
    setCurrentFolder(folderId)
  }

  return (
    <nav className="folder-breadcrumb">
      <button className="breadcrumb-item" onClick={() => handleClick(null)}>
        Home
      </button>
      {path.map((folder, index) => (
        <span key={folder.id} className="breadcrumb-segment">
          <span className="breadcrumb-separator">/</span>
          <button
            className={`breadcrumb-item ${index === path.length - 1 ? 'current' : ''}`}
            onClick={() => handleClick(folder.id)}
          >
            {folder.name}
          </button>
        </span>
      ))}
    </nav>
  )
}
