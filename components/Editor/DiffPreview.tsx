'use client'

import { useEffect, useMemo } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { DiffSegment } from '@/types'
import { PaginationPlugin } from '@/lib/pagination-plugin'

interface DiffPreviewProps {
  diff: DiffSegment[]
  onAccept: () => void
  onReject: () => void
  onPageCountChange?: (pageCount: number) => void
}

export function DiffPreview({ diff, onAccept, onReject, onPageCountChange }: DiffPreviewProps) {
  // Convert diff segments to HTML with proper paragraph structure
  const htmlContent = useMemo(() => {
    // First, reconstruct the full text with diff markers
    // We need to identify paragraph boundaries across all segments

    // Build a list of "chunks" where each chunk is either a paragraph break or text with its type
    interface Chunk {
      type: 'text' | 'paragraph-break'
      text?: string
      diffType?: 'unchanged' | 'added' | 'removed'
    }

    const chunks: Chunk[] = []

    diff.forEach((segment) => {
      // Split this segment by double newlines (paragraph breaks)
      const parts = segment.text.split(/(\n\n+)/)

      parts.forEach((part) => {
        if (/^\n\n+$/.test(part)) {
          // This is a paragraph break
          chunks.push({ type: 'paragraph-break' })
        } else if (part.length > 0) {
          // This is text content
          chunks.push({
            type: 'text',
            text: part,
            diffType: segment.type,
          })
        }
      })
    })

    // Now build paragraphs from chunks
    const paragraphs: { spans: { text: string; diffType: string }[] }[] = []
    let currentPara: { text: string; diffType: string }[] = []

    chunks.forEach((chunk) => {
      if (chunk.type === 'paragraph-break') {
        if (currentPara.length > 0) {
          paragraphs.push({ spans: currentPara })
          currentPara = []
        }
      } else if (chunk.type === 'text' && chunk.text) {
        currentPara.push({
          text: chunk.text,
          diffType: chunk.diffType || 'unchanged',
        })
      }
    })

    // Don't forget the last paragraph
    if (currentPara.length > 0) {
      paragraphs.push({ spans: currentPara })
    }

    // Convert to HTML
    const html = paragraphs.map((para) => {
      const spanHtml = para.spans.map((span) => {
        const escapedText = span.text
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/\n/g, '<br>')

        if (span.diffType === 'added') {
          return `<span class="diff-added">${escapedText}</span>`
        } else if (span.diffType === 'removed') {
          return `<span class="diff-removed">${escapedText}</span>`
        }
        return escapedText
      }).join('')

      return `<p>${spanHtml}</p>`
    }).join('')

    return html || '<p></p>'
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
