'use client'

import { useState } from 'react'
import Link from 'next/link'
import { DocumentCard } from './DocumentCard'
import type { Document } from '@/lib/actions/documents'

interface DocumentListProps {
  initialDocuments: Document[]
}

export function DocumentList({ initialDocuments }: DocumentListProps) {
  const [documents, setDocuments] = useState(initialDocuments)

  function handleDelete(id: string) {
    setDocuments(docs => docs.filter(doc => doc.id !== id))
  }

  return (
    <div className="document-list-container">
      <div className="document-list-header">
        <h1>My Documents</h1>
        <Link href="/documents/new" className="new-document-button">
          + New Document
        </Link>
      </div>

      {documents.length === 0 ? (
        <div className="document-list-empty">
          <p>No documents yet</p>
          <Link href="/documents/new" className="new-document-button">
            Create your first document
          </Link>
        </div>
      ) : (
        <div className="document-list">
          {documents.map(doc => (
            <DocumentCard
              key={doc.id}
              id={doc.id}
              title={doc.title}
              updatedAt={doc.updated_at}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}
