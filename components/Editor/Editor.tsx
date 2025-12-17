'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { useEffect, useCallback, useRef } from 'react'
import { useEditorStore } from '@/store/editor-store'
import { useSuggestion } from '@/hooks/useSuggestion'
import { InlineSuggestion, updateInlineSuggestionState } from '@/extensions/inline-suggestion'

export function Editor() {
  const { setContent, suggestion, acceptSuggestion, rejectSuggestion, isGenerating, error } =
    useEditorStore()
  const { triggerSuggestion, cancelSuggestion, blockUntilManualEdit } = useSuggestion()

  // Track if we're inserting suggestion text (not manual edit)
  const isInsertingSuggestionRef = useRef(false)

  // Use refs for callbacks so they can be updated
  const acceptCallbackRef = useRef<(() => void) | undefined>(undefined)
  const rejectCallbackRef = useRef<(() => void) | undefined>(undefined)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder:
          'Describe your project... (e.g., "My project is a social media app for dog owners")',
      }),
      InlineSuggestion,
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
    editor
      .chain()
      .focus()
      .clearContent()
      .insertContent(suggestion.newContent)
      .run()

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

  // Update callback refs
  useEffect(() => {
    acceptCallbackRef.current = handleAccept
    rejectCallbackRef.current = handleReject
  }, [handleAccept, handleReject])

  // Update the inline suggestion state when suggestion/isGenerating changes
  useEffect(() => {
    if (!editor) return

    // Update the external state that decorations read from
    updateInlineSuggestionState({
      diff: suggestion?.diff || null,
      isGenerating,
      onAccept: () => acceptCallbackRef.current?.(),
      onReject: () => rejectCallbackRef.current?.(),
    })

    // Force a view update to re-render decorations
    editor.view.dispatch(editor.state.tr.setMeta('forceUpdate', true))
  }, [editor, suggestion, isGenerating])

  // Handle keyboard shortcuts
  useEffect(() => {
    if (!editor) return

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

    const editorElement = editor.view.dom
    editorElement.addEventListener('keydown', handleKeyDown)
    return () => editorElement.removeEventListener('keydown', handleKeyDown)
  }, [editor, suggestion, handleAccept, handleReject])

  return (
    <div className="relative w-full max-w-3xl mx-auto">
      <div className="border border-gray-200 rounded-lg shadow-sm bg-white overflow-hidden">
        <EditorContent
          editor={editor}
          className="prose prose-sm max-w-none p-6 min-h-[400px] focus:outline-none [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[360px]"
        />
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
