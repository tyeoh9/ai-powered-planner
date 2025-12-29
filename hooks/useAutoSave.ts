'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useDocumentStore } from '@/store/document-store'
import { updateDocument } from '@/lib/actions/documents'
import type { JSONContent } from '@tiptap/react'

const AUTO_SAVE_DELAY = 3000 // 3 seconds of idle before saving

export function useAutoSave(getContent: () => JSONContent | undefined) {
  const {
    currentDocId,
    title,
    isDirty,
    markSaving,
    markSaved,
    setSaveError,
  } = useDocumentStore()

  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isSavingRef = useRef(false)

  const save = useCallback(async () => {
    if (!currentDocId || isSavingRef.current) return

    const content = getContent()
    if (!content) return

    isSavingRef.current = true
    markSaving()

    const result = await updateDocument(currentDocId, { title, content })
    if (result.success) {
      markSaved()
    } else {
      console.error('Auto-save failed:', result.error)
      setSaveError(result.error)
    }

    isSavingRef.current = false
  }, [currentDocId, title, getContent, markSaving, markSaved, setSaveError])

  // Auto-save when dirty
  useEffect(() => {
    if (!isDirty || !currentDocId) return

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      save()
    }, AUTO_SAVE_DELAY)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [isDirty, currentDocId, title, save])

  // Manual save function
  const manualSave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    save()
  }, [save])

  return { save: manualSave }
}
