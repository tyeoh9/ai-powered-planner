'use client'

import { useCallback, useRef } from 'react'
import { useEditorStore } from '@/store/editor-store'

const DEBOUNCE_MS = 1000 // 1 second as requested
const MIN_CONTENT_LENGTH = 20

const TRIGGER_PATTERNS = [
  /my project is/i,
  /building a/i,
  /creating a/i,
  /i want to build/i,
  /application for/i,
  /app for/i,
  /i(')?m making/i,
  /we(')?re building/i,
]

export function useSuggestion() {
  const {
    setSuggestion,
    setIsGenerating,
    isGenerating,
    setError,
  } = useEditorStore()
  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Block suggestions until user manually types
  const blockedUntilManualEditRef = useRef<boolean>(false)

  const shouldTriggerSuggestion = (content: string): boolean => {
    if (content.length < MIN_CONTENT_LENGTH) return false
    return TRIGGER_PATTERNS.some((pattern) => pattern.test(content))
  }

  const fetchSuggestion = useCallback(
    async (content: string, position: number) => {
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
        let fullText = ''

        if (reader) {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const chunk = decoder.decode(value)
            fullText += chunk
          }
        }

        if (fullText.trim()) {
          setSuggestion({
            id: crypto.randomUUID(),
            content: '\n\n' + fullText.trim(),
            position,
            type: 'tech-stack',
          })
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
    (content: string, position: number, isManualEdit: boolean = true) => {
      // Clear any pending debounce
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }

      // If blocked, only unblock on manual edits
      if (blockedUntilManualEditRef.current) {
        if (isManualEdit) {
          // User manually typed - unblock
          blockedUntilManualEditRef.current = false
        } else {
          // This is from accepting a suggestion - stay blocked
          return
        }
      }

      if (!shouldTriggerSuggestion(content)) return

      debounceRef.current = setTimeout(() => {
        fetchSuggestion(content, position)
      }, DEBOUNCE_MS)
    },
    [fetchSuggestion]
  )

  // Call this after accepting/rejecting to block until manual edit
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
