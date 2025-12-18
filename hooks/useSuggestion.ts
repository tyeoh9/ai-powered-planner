'use client'

import { useCallback, useRef } from 'react'
import { useEditorStore } from '@/store/editor-store'
import { computeDiff, hasChanges } from '@/utils/diff'
import { SUGGESTION_DEBOUNCE_MS, MIN_CONTENT_LENGTH_FOR_SUGGESTION } from '@/lib/constants'

async function readStreamResponse(reader: ReadableStreamDefaultReader<Uint8Array>): Promise<string> {
  const decoder = new TextDecoder()
  let content = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    content += decoder.decode(value)
  }

  return content.trim()
}

function handleSuggestionError(error: unknown): void {
  if ((error as Error).name === 'AbortError') return

  console.error('Suggestion error:', error)
  const message = error instanceof Error ? error.message : 'Failed to generate suggestion'
  useEditorStore.getState().setError(message)
}

export function useSuggestion() {
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const shouldBlockAutoTriggerRef = useRef(false)
  const isCurrentlyGeneratingRef = useRef(false)

  const fetchSuggestion = useCallback(async (content: string) => {
    if (isCurrentlyGeneratingRef.current) return

    abortControllerRef.current?.abort()
    abortControllerRef.current = new AbortController()
    isCurrentlyGeneratingRef.current = true

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
      if (!reader) {
        throw new Error('No response body received')
      }

      const newContent = await readStreamResponse(reader)

      if (!newContent) {
        store.setError('No suggestion generated')
        return
      }

      const diff = computeDiff(content, newContent)

      if (hasChanges(diff)) {
        store.setSuggestion({
          id: crypto.randomUUID(),
          originalContent: content,
          newContent,
          diff,
          type: 'edit',
        })
      } else {
        store.setSuggestion(null)
      }
    } catch (error) {
      handleSuggestionError(error)
    } finally {
      isCurrentlyGeneratingRef.current = false
      store.setIsGenerating(false)
    }
  }, [])

  const triggerSuggestion = useCallback(
    (content: string, _position: number, isManualEdit: boolean = true) => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)

      const store = useEditorStore.getState()
      if (!store.isAutocompleteEnabled) return

      if (shouldBlockAutoTriggerRef.current) {
        if (isManualEdit) {
          shouldBlockAutoTriggerRef.current = false
        } else {
          return
        }
      }

      if (content.length < MIN_CONTENT_LENGTH_FOR_SUGGESTION) return

      debounceTimerRef.current = setTimeout(() => {
        fetchSuggestion(content)
      }, SUGGESTION_DEBOUNCE_MS)
    },
    [fetchSuggestion]
  )

  const blockUntilManualEdit = useCallback(() => {
    shouldBlockAutoTriggerRef.current = true
  }, [])

  const cancelSuggestion = useCallback(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    abortControllerRef.current?.abort()

    const store = useEditorStore.getState()
    store.setSuggestion(null)
    store.setIsGenerating(false)
  }, [])

  return { triggerSuggestion, cancelSuggestion, blockUntilManualEdit }
}
