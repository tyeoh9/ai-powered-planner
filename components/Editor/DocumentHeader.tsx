'use client'

import { useRouter } from 'next/navigation'
import { useDocumentStore } from '@/store/document-store'
import { SaveIndicator } from './SaveIndicator'

export function DocumentHeader() {
  const router = useRouter()
  const { title, setTitle } = useDocumentStore()

  return (
    <div className="document-header">
      <div className="document-header-left">
        <button
          onClick={() => router.push('/')}
          className="back-button"
          title="Back to documents"
        >
          &larr; Back
        </button>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Untitled"
          className="document-title-input"
        />
      </div>
      <div className="document-header-right">
        <SaveIndicator />
      </div>
    </div>
  )
}
