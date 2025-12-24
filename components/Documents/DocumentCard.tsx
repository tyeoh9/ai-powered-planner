'use client'

import { useState } from 'react'
import Link from 'next/link'
import { deleteDocument } from '@/lib/actions/documents'

interface DocumentCardProps {
  id: string
  title: string
  updatedAt: string
  onDelete: (id: string) => void
}

export function DocumentCard({ id, title, updatedAt, onDelete }: DocumentCardProps) {
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const formattedDate = new Date(updatedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })

  async function handleDelete() {
    if (!confirmingDelete) {
      setConfirmingDelete(true)
      return
    }

    setIsDeleting(true)
    try {
      await deleteDocument(id)
      onDelete(id)
    } catch (error) {
      console.error('Failed to delete document:', error)
      setIsDeleting(false)
      setConfirmingDelete(false)
    }
  }

  return (
    <div className="document-card">
      <Link href={`/documents/${id}`} className="document-card-link">
        <h3 className="document-card-title">{title || 'Untitled'}</h3>
        <p className="document-card-date">{formattedDate}</p>
      </Link>
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
