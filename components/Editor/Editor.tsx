'use client'

import { useCallback, useRef, useState, useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { useEditorStore } from '@/store/editor-store'
import { useSuggestion } from '@/hooks/useSuggestion'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { DiffPreview } from './DiffPreview'
import { PaginationPlugin } from '@/lib/pagination-plugin'
import { EDITOR_PLACEHOLDER } from '@/lib/constants'
import {
  PAGE_HEIGHT,
  PAGE_GAP,
  PAGE_PADDING_TOP,
  PAGE_PADDING_BOTTOM,
  PAGE_WIDTH,
  calculateTotalHeight,
} from '@/lib/pagination-engine'

export function Editor() {
  const { setContent, suggestion, acceptSuggestion, rejectSuggestion, isGenerating, error } =
    useEditorStore()
  const { triggerSuggestion, cancelSuggestion, blockUntilManualEdit } = useSuggestion()
  const isInsertingSuggestionRef = useRef(false)
  const [pageCount, setPageCount] = useState(1)

  const handleContentChange = useCallback(
    (content: string, isManualEdit: boolean) => {
      setContent(content)
      triggerSuggestion(content, content.length, isManualEdit)
    },
    [setContent, triggerSuggestion]
  )

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: EDITOR_PLACEHOLDER,
      }),
      PaginationPlugin.configure({
        onPageCountChange: (count) => {
          setPageCount(count)
        },
      }),
    ],
    content: '',
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      if (isInsertingSuggestionRef.current) return
      const text = editor.getText()
      handleContentChange(text, true)
    },
  })

  const handleAcceptSuggestion = useCallback(() => {
    if (!suggestion || !editor) return

    blockUntilManualEdit()
    isInsertingSuggestionRef.current = true

    // Convert plain text to HTML paragraphs
    const htmlContent = suggestion.newContent
      .split(/\n\n+/)
      .filter(p => p.trim())
      .map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`)
      .join('')

    editor.commands.setContent(htmlContent)

    setTimeout(() => {
      isInsertingSuggestionRef.current = false
    }, 200)

    acceptSuggestion()
  }, [suggestion, editor, acceptSuggestion, blockUntilManualEdit])

  const handleRejectSuggestion = useCallback(() => {
    blockUntilManualEdit()
    rejectSuggestion()
    cancelSuggestion()
  }, [rejectSuggestion, cancelSuggestion, blockUntilManualEdit])

  useKeyboardShortcuts(!!suggestion, {
    onAccept: handleAcceptSuggestion,
    onReject: handleRejectSuggestion,
  })

  const hasSuggestion = suggestion && suggestion.diff && suggestion.diff.length > 0

  // Calculate the total height needed for all pages + gaps
  const totalPagesHeight = calculateTotalHeight(pageCount)

  return (
    <div className="relative">
      {/* Fixed AI thinking indicator pill */}
      {isGenerating && (
        <div className="thinking-pill">
          <span className="thinking-dots">
            <span className="thinking-dot" />
            <span className="thinking-dot" />
            <span className="thinking-dot" />
          </span>
          <span>AI is thinking...</span>
        </div>
      )}

      {/* Pages container */}
      <div className="pages-container" style={{ minHeight: totalPagesHeight }}>
        {/* Page backgrounds (white paper shadows) */}
        {Array.from({ length: pageCount }, (_, i) => (
          <div
            key={i}
            className="page-shadow"
            style={{
              top: i * (PAGE_HEIGHT + PAGE_GAP),
              height: PAGE_HEIGHT,
            }}
          >
            <span className="page-number">{i + 1}</span>
          </div>
        ))}

        {/* Content area - single continuous editor */}
        {hasSuggestion ? (
          <div
            className="pages-content"
            style={{
              paddingTop: PAGE_PADDING_TOP,
              paddingLeft: 96,
              paddingRight: 96,
            }}
          >
            <DiffPreview
              diff={suggestion.diff}
              onAccept={handleAcceptSuggestion}
              onReject={handleRejectSuggestion}
              onPageCountChange={setPageCount}
            />
          </div>
        ) : (
          <div
            className="pages-content editor-content-area"
            style={{
              paddingTop: PAGE_PADDING_TOP,
              paddingLeft: 96,
              paddingRight: 96,
            }}
          >
            <EditorContent
              editor={editor}
              className="prose prose-lg max-w-none focus:outline-none [&_.ProseMirror]:outline-none"
            />
          </div>
        )}
      </div>

      {error && !isGenerating && (
        <div className="max-w-xl mx-auto mt-4 p-4 bg-red-50 border border-red-200 rounded-full text-red-700 text-sm text-center">
          <strong>Error:</strong> {error}
        </div>
      )}
    </div>
  )
}
