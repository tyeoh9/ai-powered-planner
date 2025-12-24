'use client'

import { useDocumentStore } from '@/store/document-store'

export function SaveIndicator() {
  const { isSaving, isDirty, lastSavedAt } = useDocumentStore()

  if (isSaving) {
    return <span className="save-indicator saving">Saving...</span>
  }

  if (isDirty) {
    return <span className="save-indicator unsaved">Unsaved changes</span>
  }

  if (lastSavedAt) {
    return <span className="save-indicator saved">Saved</span>
  }

  return null
}
