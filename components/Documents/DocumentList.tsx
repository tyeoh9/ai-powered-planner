'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { DocumentCard } from './DocumentCard'
import { FolderTree } from '@/components/Folders/FolderTree'
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

  const { currentFolderId, setFolders, setDocuments: setStoreDocuments, getDocumentsInFolder } = useFolderStore()

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

  function handleFolderMoveModal(item: { type: 'folder' | 'document'; id: string }) {
    setMoveModalItem(item)
  }

  async function handleCreateDocument() {
    const { id } = await createDocument(currentFolderId)
    router.push(`/documents/${id}`)
  }

  const filteredDocuments = currentFolderId === null
    ? documents.filter(doc => doc.folder_id === null)
    : documents.filter(doc => doc.folder_id === currentFolderId)

  return (
    <div className="document-page-layout">
      <aside className="folder-sidebar">
        <FolderTree onMoveToModal={handleFolderMoveModal} />
      </aside>

      <main className="document-list-container">
        <div className="document-list-header">
          <div className="document-list-header-left">
            <h1>My Documents</h1>
            {folderPath.length > 0 && <Breadcrumb path={folderPath} />}
          </div>
          <button onClick={handleCreateDocument} className="new-document-button">
            + New Document
          </button>
        </div>

        {filteredDocuments.length === 0 ? (
          <div className="document-list-empty">
            <p>{currentFolderId ? 'This folder is empty' : 'No documents yet'}</p>
            <button onClick={handleCreateDocument} className="new-document-button">
              Create {currentFolderId ? 'a document here' : 'your first document'}
            </button>
          </div>
        ) : (
          <div className="document-list">
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
      </main>

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
