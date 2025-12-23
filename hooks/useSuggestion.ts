'use client'

import { useCallback, useRef } from 'react'
import { useEditorStore } from '@/store/editor-store'
import { computeDiff, hasChanges } from '@/utils/diff'
import { SUGGESTION_DEBOUNCE_MS, MIN_CONTENT_LENGTH_FOR_SUGGESTION } from '@/lib/constants'
import type { CursorContext, FIMPayload } from '@/types'

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

/**
 * Detects cursor context based on surrounding text
 */
function detectCursorContext(prefix: string): CursorContext {
  // Check for new block (double newline at end)
  if (prefix.endsWith('\n\n')) {
    return 'new-block'
  }

  // Check for end of line (single newline)
  if (prefix.endsWith('\n')) {
    return 'end-of-line'
  }

  // Check for end of sentence or list header (colon)
  if (/[.!?:]\s*$/.test(prefix)) {
    return 'end-of-sentence'
  }

  // Default: mid-sentence
  return 'mid-sentence'
}

/**
 * Splits content into prefix and suffix at cursor position
 */
function splitContentAtCursor(content: string, cursorPosition: number): { prefix: string; suffix: string } {
  const safePosition = Math.min(Math.max(0, cursorPosition), content.length)
  return {
    prefix: content.slice(0, safePosition),
    suffix: content.slice(safePosition),
  }
}

export function useSuggestion() {
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const shouldBlockAutoTriggerRef = useRef(false)
  const isCurrentlyGeneratingRef = useRef(false)

  const fetchSuggestion = useCallback(async (payload: FIMPayload) => {
    if (isCurrentlyGeneratingRef.current) return

    abortControllerRef.current?.abort()
    abortControllerRef.current = new AbortController()
    isCurrentlyGeneratingRef.current = true

    const store = useEditorStore.getState()
    store.setIsGenerating(true)
    store.setError(null)

    const originalContent = payload.prefix + payload.suffix

    try {
      const response = await fetch('/api/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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

      let generatedMiddle = await readStreamResponse(reader)

      if (!generatedMiddle) {
        store.setSuggestion(null)
        return
      }

      // Remove duplicate prefix from generated text (AI sometimes repeats ending)
      const prefixWords = payload.prefix.split(/\s+/).filter(Boolean)
      const lastPrefixWord = prefixWords[prefixWords.length - 1]?.toLowerCase()
      if (lastPrefixWord) {
        const generatedLower = generatedMiddle.toLowerCase().trimStart()
        if (generatedLower.startsWith(lastPrefixWord)) {
          generatedMiddle = generatedMiddle.trimStart().slice(lastPrefixWord.length)
        }
      }

      // Ensure proper spacing at boundaries
      const prefixEndsWithSpace = /\s$/.test(payload.prefix)
      const middleStartsWithSpace = /^\s/.test(generatedMiddle)
      const middleStartsWithWord = /^\w/.test(generatedMiddle)

      // Add space before generated text if needed
      if (!prefixEndsWithSpace && middleStartsWithWord) {
        generatedMiddle = ' ' + generatedMiddle
      }
      // Remove double space if both have spaces
      if (prefixEndsWithSpace && middleStartsWithSpace) {
        generatedMiddle = generatedMiddle.trimStart()
      }

      // Construct the new full content: prefix + generated + suffix
      const newContent = payload.prefix + generatedMiddle + payload.suffix
      const diff = computeDiff(originalContent, newContent)

      if (hasChanges(diff)) {
        store.setSuggestion({
          id: crypto.randomUUID(),
          originalContent,
          newContent,
          diff,
          type: 'edit',
          cursorPosition: payload.prefix.length,
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
    (content: string, cursorPosition: number, isManualEdit: boolean = true) => {
      // Abort any in-flight request immediately when user types
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
        abortControllerRef.current = null
        isCurrentlyGeneratingRef.current = false
        useEditorStore.getState().setIsGenerating(false)
      }

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

      // Split content at cursor and detect context
      const { prefix, suffix } = splitContentAtCursor(content, cursorPosition)
      const cursorContext = detectCursorContext(prefix)

      const payload: FIMPayload = { prefix, suffix, cursorContext }

      debounceTimerRef.current = setTimeout(() => {
        fetchSuggestion(payload)
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
