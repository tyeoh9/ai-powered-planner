'use client'

import { useRouter } from 'next/navigation'
import { useDocumentStore } from '@/store/document-store'
import { SaveIndicator } from './SaveIndicator'

export function DocumentHeader() {
  const router = useRouter()
  const { title, setTitle, saveError } = useDocumentStore()

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
        <div className="document-title-wrapper">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Untitled"
            className={`document-title-input ${saveError ? 'input-error' : ''}`}
          />
          {saveError && <p className="input-error-message">{saveError}</p>}
        </div>
      </div>
      <div className="document-header-right">
        <SaveIndicator />
      </div>
    </div>
  )
}
