'use client'

import { useCallback, useRef } from 'react'
import { useEditorStore } from '@/store/editor-store'
import { computeDiff, hasChanges } from '@/utils/diff'

const DEBOUNCE_MS = 1000
const MIN_CONTENT_LENGTH = 10

export function useSuggestion() {
  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const blockedUntilManualEditRef = useRef<boolean>(false)
  const isGeneratingRef = useRef(false)

  const fetchSuggestion = useCallback(async (content: string) => {
    if (isGeneratingRef.current) return

    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    abortControllerRef.current = new AbortController()
    isGeneratingRef.current = true

    // Use getState() to directly update store
    const store = useEditorStore.getState()
    store.setIsGenerating(true)
    store.setError(null)

    try {
      const response = await fetch('/api/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
        signal: abortControllerRef.current.signal,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `API error: ${response.status}`)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let newContent = ''

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const chunk = decoder.decode(value)
          newContent += chunk
        }
      }

      newContent = newContent.trim()

      if (newContent) {
        const diff = computeDiff(content, newContent)

        if (hasChanges(diff)) {
          useEditorStore.getState().setSuggestion({
            id: crypto.randomUUID(),
            originalContent: content,
            newContent,
            diff,
            type: 'edit',
          })
        } else {
          useEditorStore.getState().setSuggestion(null)
        }
      } else {
        useEditorStore.getState().setError('No suggestion generated')
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Suggestion error:', error)
        useEditorStore.getState().setError((error as Error).message || 'Failed to generate suggestion')
      }
    } finally {
      isGeneratingRef.current = false
      useEditorStore.getState().setIsGenerating(false)
    }
  }, [])

  const triggerSuggestion = useCallback(
    (content: string, _position: number, isManualEdit: boolean = true) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }

      if (blockedUntilManualEditRef.current) {
        if (isManualEdit) {
          blockedUntilManualEditRef.current = false
        } else {
          return
        }
      }

      if (content.length < MIN_CONTENT_LENGTH) {
        return
      }

      debounceRef.current = setTimeout(() => {
        fetchSuggestion(content)
      }, DEBOUNCE_MS)
    },
    [fetchSuggestion]
  )

  const blockUntilManualEdit = useCallback(() => {
    blockedUntilManualEditRef.current = true
  }, [])

  const cancelSuggestion = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    useEditorStore.getState().setSuggestion(null)
    useEditorStore.getState().setIsGenerating(false)
  }, [])

  return { triggerSuggestion, cancelSuggestion, blockUntilManualEdit }
}
