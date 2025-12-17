'use client'

import { useCallback, useRef } from 'react'
import { useEditorStore } from '@/store/editor-store'
import { computeDiff, hasChanges } from '@/utils/diff'

const DEBOUNCE_MS = 1000
const MIN_CONTENT_LENGTH = 10

export function useSuggestion() {
  const { setSuggestion, setIsGenerating, isGenerating, setError } = useEditorStore()
  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Block suggestions until user manually types
  const blockedUntilManualEditRef = useRef<boolean>(false)

  const fetchSuggestion = useCallback(
    async (content: string) => {
      if (isGenerating) return

      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      abortControllerRef.current = new AbortController()
      setIsGenerating(true)
      setError(null)

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
          // Compute diff between original and new content
          const diff = computeDiff(content, newContent)

          // Only create suggestion if there are actual changes
          if (hasChanges(diff)) {
            setSuggestion({
              id: crypto.randomUUID(),
              originalContent: content,
              newContent,
              diff,
              type: 'edit',
            })
          } else {
            // No changes needed
            setSuggestion(null)
          }
        } else {
          setError('No suggestion generated')
        }
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Suggestion error:', error)
          setError((error as Error).message || 'Failed to generate suggestion')
        }
      } finally {
        setIsGenerating(false)
      }
    },
    [isGenerating, setIsGenerating, setSuggestion, setError]
  )

  const triggerSuggestion = useCallback(
    (content: string, _position: number, isManualEdit: boolean = true) => {
      // Clear any pending debounce
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }

      // If blocked, only unblock on manual edits
      if (blockedUntilManualEditRef.current) {
        if (isManualEdit) {
          blockedUntilManualEditRef.current = false
        } else {
          return
        }
      }

      // Need some minimum content
      if (content.length < MIN_CONTENT_LENGTH) return

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
    setSuggestion(null)
    setIsGenerating(false)
  }, [setSuggestion, setIsGenerating])

  return { triggerSuggestion, cancelSuggestion, blockUntilManualEdit }
}
