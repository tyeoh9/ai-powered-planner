'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { useEffect, useCallback, useRef } from 'react'
import { useEditorStore } from '@/store/editor-store'
import { useSuggestion } from '@/hooks/useSuggestion'
import { DiffPreview } from './DiffPreview'

export function Editor() {
  const setContent = useEditorStore((state) => state.setContent)
  const suggestion = useEditorStore((state) => state.suggestion)
  const acceptSuggestion = useEditorStore((state) => state.acceptSuggestion)
  const rejectSuggestion = useEditorStore((state) => state.rejectSuggestion)
  const isGenerating = useEditorStore((state) => state.isGenerating)
  const error = useEditorStore((state) => state.error)
  const { triggerSuggestion, cancelSuggestion, blockUntilManualEdit } = useSuggestion()

  // Track if we're inserting suggestion text (not manual edit)
  const isInsertingSuggestionRef = useRef(false)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder:
          'Describe your project... (e.g., "My project is a social media app for dog owners")',
      }),
    ],
    content: '',
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      const newContent = editor.getText()
      setContent(newContent)

      const docSize = editor.state.doc.content.size

      // Pass whether this is a manual edit or not
      const isManualEdit = !isInsertingSuggestionRef.current
      triggerSuggestion(newContent, docSize, isManualEdit)
    },
  })

  const handleAccept = useCallback(() => {
    if (!editor || !suggestion) return

    // Block re-triggering until user manually types
    blockUntilManualEdit()

    // Mark that we're inserting suggestion (not manual edit)
    isInsertingSuggestionRef.current = true

    // Replace entire content with the new content from suggestion
    editor.chain().focus().clearContent().insertContent(suggestion.newContent).run()

    // Clear the suggestion
    acceptSuggestion()

    // Reset the flag after insertion
    isInsertingSuggestionRef.current = false
  }, [editor, suggestion, acceptSuggestion, blockUntilManualEdit])

  const handleReject = useCallback(() => {
    // Block re-triggering until user manually types
    blockUntilManualEdit()
    rejectSuggestion()
    cancelSuggestion()
  }, [rejectSuggestion, cancelSuggestion, blockUntilManualEdit])

  // Handle keyboard shortcuts (global listener for when diff is showing)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (suggestion) {
        if (e.key === 'Tab') {
          e.preventDefault()
          handleAccept()
        } else if (e.key === 'Escape') {
          e.preventDefault()
          handleReject()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [suggestion, handleAccept, handleReject])

  // Determine if we're showing a diff (to hide original content)
  const showingDiff = suggestion && suggestion.diff && suggestion.diff.length > 0

  return (
    <div className="relative w-full max-w-3xl mx-auto">
      <div className="relative border border-gray-200 rounded-lg shadow-sm bg-white overflow-hidden">
        {/* Show diff preview when we have a suggestion */}
        {showingDiff && (
          <DiffPreview diff={suggestion.diff} onAccept={handleAccept} onReject={handleReject} />
        )}

        {/* Hide editor when showing diff */}
        <div className={showingDiff ? 'hidden' : ''}>
          <EditorContent
            editor={editor}
            className="prose prose-sm max-w-none p-6 min-h-[400px] focus:outline-none [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[360px]"
          />
        </div>

        {/* Thinking indicator in bottom right */}
        {isGenerating && (
          <div className="absolute bottom-4 right-4 flex items-center gap-2 px-3 py-2 bg-blue-100 border border-blue-300 rounded-lg text-blue-700 text-sm shadow-md">
            <span className="thinking-dots">
              <span className="thinking-dot" />
              <span className="thinking-dot" />
              <span className="thinking-dot" />
            </span>
            <span>AI is thinking...</span>
          </div>
        )}
      </div>

      {/* Error display */}
      {error && !isGenerating && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <strong>Error:</strong> {error}
        </div>
      )}
    </div>
  )
}
