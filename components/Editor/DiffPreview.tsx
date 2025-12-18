'use client'

import { useEffect, useMemo } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { DiffSegment } from '@/types'
import { PaginationPlugin } from '@/lib/pagination-plugin'
import { Mark, mergeAttributes } from '@tiptap/core'

interface DiffPreviewProps {
  diff: DiffSegment[]
  onAccept: () => void
  onReject: () => void
  onPageCountChange?: (pageCount: number) => void
}

// Custom marks for diff highlighting
const DiffAdded = Mark.create({
  name: 'diffAdded',
  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes, { class: 'diff-added' }), 0]
  },
})

const DiffRemoved = Mark.create({
  name: 'diffRemoved',
  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes, { class: 'diff-removed' }), 0]
  },
})

export function DiffPreview({ diff, onAccept, onReject, onPageCountChange }: DiffPreviewProps) {
  // Convert diff segments to HTML with marks
  const htmlContent = useMemo(() => {
    const result: string[] = []

    diff.forEach((segment) => {
      const escapedText = segment.text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')

      // Split by double newlines for paragraphs
      const paragraphs = escapedText.split(/\n\n+/)

      paragraphs.forEach((para, index) => {
        // Convert single newlines to <br>
        const htmlPara = para.replace(/\n/g, '<br>')

        let wrappedPara: string
        if (segment.type === 'added') {
          wrappedPara = `<span class="diff-added">${htmlPara}</span>`
        } else if (segment.type === 'removed') {
          wrappedPara = `<span class="diff-removed">${htmlPara}</span>`
        } else {
          wrappedPara = htmlPara
        }

        if (index < paragraphs.length - 1) {
          result.push(`<p>${wrappedPara}</p>`)
        } else {
          // Last paragraph in this segment - don't close yet, might merge with next
          result.push(wrappedPara)
        }
      })
    })

    // Wrap everything in paragraphs properly
    const fullContent = result.join('')
    // If not starting with <p>, wrap it
    if (!fullContent.startsWith('<p>')) {
      return `<p>${fullContent}</p>`
    }
    return fullContent
  }, [diff])

  const editor = useEditor({
    extensions: [
      StarterKit,
      PaginationPlugin.configure({
        onPageCountChange: onPageCountChange,
      }),
    ],
    content: htmlContent,
    editable: false,
    immediatelyRender: false,
  })

  // Update content when diff changes
  useEffect(() => {
    if (editor && editor.getHTML() !== htmlContent) {
      editor.commands.setContent(htmlContent)
    }
  }, [editor, htmlContent])

  return (
    <div className="diff-preview-container">
      <EditorContent
        editor={editor}
        className="prose prose-lg max-w-none [&_.ProseMirror]:outline-none"
      />

      <div className="diff-controls">
        <button className="diff-btn diff-btn-accept" onClick={onAccept}>
          ✓ Accept <kbd>Tab</kbd>
        </button>
        <button className="diff-btn diff-btn-reject" onClick={onReject}>
          ✕ Reject <kbd>Esc</kbd>
        </button>
      </div>
    </div>
  )
}
