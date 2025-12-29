'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { DocumentCard } from './DocumentCard'
import { FolderCard } from '@/components/Folders/FolderCard'
import { CreateFolderButton } from '@/components/Folders/CreateFolderButton'
import { Breadcrumb } from '@/components/Folders/Breadcrumb'
import { MoveToModal } from '@/components/MoveToModal'
import { useFolderStore } from '@/store/folder-store'
import { getDocuments, createDocument } from '@/lib/actions/documents'
import { getFolders, getFolderPath } from '@/lib/actions/folders'
import type { Document } from '@/lib/actions/documents'
import type { Folder } from '@/lib/actions/folders'

interface DocumentListProps {
  initialDocuments: Document[]
  initialFolders: Folder[]
}

export function DocumentList({ initialDocuments, initialFolders }: DocumentListProps) {
  const router = useRouter()
  const [documents, setDocuments] = useState(initialDocuments)
  const [folderPath, setFolderPath] = useState<Folder[]>([])
  const [moveModalItem, setMoveModalItem] = useState<{ type: 'folder' | 'document'; id: string } | null>(null)

  const { currentFolderId, setFolders, setDocuments: setStoreDocuments, getFolderChildren } = useFolderStore()

  useEffect(() => {
    setFolders(initialFolders)
    setStoreDocuments(initialDocuments)
  }, [initialFolders, initialDocuments])

  useEffect(() => {
    async function loadPath() {
      if (currentFolderId) {
        const path = await getFolderPath(currentFolderId)
        setFolderPath(path)
      } else {
        setFolderPath([])
      }
    }
    loadPath()
  }, [currentFolderId])

  async function refreshData() {
    const [docs, folders] = await Promise.all([getDocuments(), getFolders()])
    setDocuments(docs)
    setFolders(folders)
    setStoreDocuments(docs)
  }

  function handleDelete(id: string) {
    setDocuments(docs => docs.filter(doc => doc.id !== id))
    setStoreDocuments(documents.filter(doc => doc.id !== id))
  }

  function handleMoveClick(docId: string) {
    setMoveModalItem({ type: 'document', id: docId })
  }

  function handleFolderMoveClick(folderId: string) {
    setMoveModalItem({ type: 'folder', id: folderId })
  }

  function handleFolderDelete(id: string) {
    setFolders(useFolderStore.getState().folders.filter(f => f.id !== id))
  }

  async function handleCreateDocument() {
    const { id } = await createDocument(currentFolderId)
    router.push(`/documents/${id}`)
  }

  const filteredDocuments = currentFolderId === null
    ? documents.filter(doc => doc.folder_id === null)
    : documents.filter(doc => doc.folder_id === currentFolderId)

  const currentFolders = getFolderChildren(currentFolderId)
  const isEmpty = filteredDocuments.length === 0 && currentFolders.length === 0

  return (
    <div className="document-list-container">
      <div className="document-list-header">
        <div className="document-list-header-left">
          <h1>My Documents</h1>
          {folderPath.length > 0 && <Breadcrumb path={folderPath} />}
        </div>
        <div className="document-list-header-buttons">
          <CreateFolderButton onCreated={refreshData} />
          <button onClick={handleCreateDocument} className="new-document-button">
            + New Document
          </button>
        </div>
      </div>

      {isEmpty ? (
        <div className="document-list-empty">
          <Image
            src="/octopus_sleeping.svg"
            alt="Sleeping octopus"
            width={120}
            height={120}
            className="empty-state-image"
            unoptimized
          />
          <p>{currentFolderId ? 'This folder is empty' : 'No documents yet'}</p>
          <button onClick={handleCreateDocument} className="new-document-button">
            Create {currentFolderId ? 'a document here' : 'your first document'}
          </button>
        </div>
      ) : (
        <div className="document-list">
          {currentFolders.map(folder => (
            <FolderCard
              key={folder.id}
              id={folder.id}
              name={folder.name}
              onDelete={handleFolderDelete}
              onMoveClick={handleFolderMoveClick}
            />
          ))}
          {filteredDocuments.map(doc => (
            <DocumentCard
              key={doc.id}
              id={doc.id}
              title={doc.title}
              updatedAt={doc.updated_at}
              onDelete={handleDelete}
              onMoveClick={handleMoveClick}
            />
          ))}
        </div>
      )}

      {moveModalItem && (
        <MoveToModal
          item={moveModalItem}
          onClose={() => setMoveModalItem(null)}
          onMoved={refreshData}
        />
      )}
    </div>
  )
}
