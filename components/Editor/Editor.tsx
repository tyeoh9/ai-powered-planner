'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { useCallback, useRef } from 'react'
import { useEditorStore } from '@/store/editor-store'
import { useSuggestion } from '@/hooks/useSuggestion'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { DiffPreview } from './DiffPreview'
import { EDITOR_PLACEHOLDER } from '@/lib/constants'

export function Editor() {
  const { setContent, suggestion, acceptSuggestion, rejectSuggestion, isGenerating, error } =
    useEditorStore()
  const { triggerSuggestion, cancelSuggestion, blockUntilManualEdit } = useSuggestion()

  // Track whether we're programmatically inserting suggestion text (vs manual user edit)
  const isInsertingSuggestionRef = useRef(false)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: EDITOR_PLACEHOLDER,
      }),
    ],
    content: '',
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      const newContent = editor.getText()
      const documentSize = editor.state.doc.content.size
      const isManualEdit = !isInsertingSuggestionRef.current

      setContent(newContent)
      triggerSuggestion(newContent, documentSize, isManualEdit)
    },
  })

  const handleAcceptSuggestion = useCallback(() => {
    if (!editor || !suggestion) {
      return
    }

    blockUntilManualEdit()
    isInsertingSuggestionRef.current = true

    // Replace editor content with the suggested content
    editor.chain().focus().clearContent().insertContent(suggestion.newContent).run()
    acceptSuggestion()

    isInsertingSuggestionRef.current = false
  }, [editor, suggestion, acceptSuggestion, blockUntilManualEdit])

  const handleRejectSuggestion = useCallback(() => {
    blockUntilManualEdit()
    rejectSuggestion()
    cancelSuggestion()
  }, [rejectSuggestion, cancelSuggestion, blockUntilManualEdit])

  // Set up keyboard shortcuts for accepting/rejecting suggestions
  useKeyboardShortcuts(!!suggestion, {
    onAccept: handleAcceptSuggestion,
    onReject: handleRejectSuggestion,
  })

  const hasSuggestion = suggestion && suggestion.diff && suggestion.diff.length > 0

  return (
    <div className="relative w-full max-w-3xl mx-auto">
      <div className="relative border border-gray-200 rounded-lg shadow-sm bg-white overflow-hidden">
        {hasSuggestion && (
          <DiffPreview
            diff={suggestion.diff}
            onAccept={handleAcceptSuggestion}
            onReject={handleRejectSuggestion}
          />
        )}

        <div className={hasSuggestion ? 'hidden' : ''}>
          <EditorContent
            editor={editor}
            className="prose prose-sm max-w-none p-6 min-h-[400px] focus:outline-none [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[360px]"
          />
        </div>

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

      {error && !isGenerating && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <strong>Error:</strong> {error}
        </div>
      )}
    </div>
  )
}
