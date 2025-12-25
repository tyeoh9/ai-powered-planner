'use client'

import { useState, useRef } from 'react'
import { useFolderStore } from '@/store/folder-store'
import { moveDocument } from '@/lib/actions/documents'
import { moveFolder, renameFolder, deleteFolder } from '@/lib/actions/folders'
import type { Folder } from '@/lib/actions/folders'

interface FolderNodeProps {
  folder: Folder
  level: number
  onRefresh: () => void
  onContextMenu: (e: React.MouseEvent, folder: Folder) => void
}

export function FolderNode({ folder, level, onRefresh, onContextMenu }: FolderNodeProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(folder.name)
  const [isDragOver, setIsDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const {
    folders,
    expandedIds,
    currentFolderId,
    dragItem,
    toggleExpanded,
    setCurrentFolder,
    setDragItem,
    setDragOverId,
    getFolderChildren,
  } = useFolderStore()

  const isExpanded = expandedIds.has(folder.id)
  const isSelected = currentFolderId === folder.id
  const children = getFolderChildren(folder.id)
  const hasChildren = children.length > 0

  async function handleRename() {
    if (editName.trim() && editName !== folder.name) {
      try {
        await renameFolder(folder.id, editName.trim())
        onRefresh()
      } catch (error) {
        console.error('Failed to rename folder:', error)
      }
    }
    setIsEditing(false)
  }

  function handleDragStart(e: React.DragEvent) {
    e.stopPropagation()
    setDragItem({ type: 'folder', id: folder.id })
    e.dataTransfer.setData('application/json', JSON.stringify({ type: 'folder', id: folder.id }))
    e.dataTransfer.effectAllowed = 'move'
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (!dragItem || (dragItem.type === 'folder' && dragItem.id === folder.id)) return
    setIsDragOver(true)
    setDragOverId(folder.id)
    e.dataTransfer.dropEffect = 'move'
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault()
    setIsDragOver(false)
    setDragOverId(null)
  }

  async function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
    setDragOverId(null)

    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'))
      if (data.type === 'document') {
        await moveDocument(data.id, folder.id)
      } else if (data.type === 'folder' && data.id !== folder.id) {
        await moveFolder(data.id, folder.id)
      }
      onRefresh()
    } catch (error) {
      console.error('Failed to move item:', error)
    }

    setDragItem(null)
  }

  function handleDragEnd() {
    setDragItem(null)
    setDragOverId(null)
  }

  function handleClick(e: React.MouseEvent) {
    e.stopPropagation()
    setCurrentFolder(folder.id)
  }

  function handleToggle(e: React.MouseEvent) {
    e.stopPropagation()
    toggleExpanded(folder.id)
  }

  function handleDoubleClick(e: React.MouseEvent) {
    e.stopPropagation()
    setIsEditing(true)
    setEditName(folder.name)
    setTimeout(() => inputRef.current?.select(), 0)
  }

  return (
    <>
      <div
        className={`folder-node ${isSelected ? 'selected' : ''} ${isDragOver ? 'drag-over' : ''}`}
        style={{ paddingLeft: level * 16 + 8 }}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onContextMenu={(e) => onContextMenu(e, folder)}
        draggable={!isEditing}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onDragEnd={handleDragEnd}
      >
        <button
          className="folder-toggle"
          onClick={handleToggle}
          style={{ visibility: hasChildren ? 'visible' : 'hidden' }}
        >
          {isExpanded ? '▼' : '▶'}
        </button>
        <span className="folder-icon">📁</span>
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            className="folder-name-input"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRename()
              if (e.key === 'Escape') setIsEditing(false)
            }}
            onClick={(e) => e.stopPropagation()}
            autoFocus
          />
        ) : (
          <span className="folder-name">{folder.name}</span>
        )}
      </div>
      {isExpanded &&
        children.map((child) => (
          <FolderNode
            key={child.id}
            folder={child}
            level={level + 1}
            onRefresh={onRefresh}
            onContextMenu={onContextMenu}
          />
        ))}
    </>
  )
}
