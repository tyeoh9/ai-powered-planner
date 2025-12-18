'use client'

import { useEffect, useMemo } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Mark, mergeAttributes } from '@tiptap/core'
import { DiffSegment } from '@/types'
import { PaginationPlugin } from '@/lib/pagination-plugin'

interface DiffPreviewProps {
  diff: DiffSegment[]
  onAccept: () => void
  onReject: () => void
  onPageCountChange?: (pageCount: number) => void
}

const DiffAdded = Mark.create({
  name: 'diffAdded',
  parseHTML: () => [{ tag: 'span.diff-added' }, { tag: 'mark[data-diff="added"]' }],
  renderHTML: ({ HTMLAttributes }) => ['span', mergeAttributes(HTMLAttributes, { class: 'diff-added' }), 0],
})

const DiffRemoved = Mark.create({
  name: 'diffRemoved',
  parseHTML: () => [{ tag: 'span.diff-removed' }, { tag: 'mark[data-diff="removed"]' }],
  renderHTML: ({ HTMLAttributes }) => ['span', mergeAttributes(HTMLAttributes, { class: 'diff-removed' }), 0],
})

interface Chunk {
  type: 'text' | 'paragraph-break'
  text?: string
  diffType?: 'unchanged' | 'added' | 'removed'
}

interface Span {
  text: string
  diffType: string
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>')
}

function wrapWithDiffClass(text: string, diffType: string): string {
  const escaped = escapeHtml(text)
  if (diffType === 'added') return `<span class="diff-added">${escaped}</span>`
  if (diffType === 'removed') return `<span class="diff-removed">${escaped}</span>`
  return escaped
}

function buildChunksFromDiff(diff: DiffSegment[]): Chunk[] {
  const chunks: Chunk[] = []

  diff.forEach((segment) => {
    const parts = segment.text.split(/(\n\n+)/)
    parts.forEach((part) => {
      if (/^\n\n+$/.test(part)) {
        chunks.push({ type: 'paragraph-break' })
      } else if (part.length > 0) {
        chunks.push({ type: 'text', text: part, diffType: segment.type })
      }
    })
  })

  return chunks
}

function buildParagraphsFromChunks(chunks: Chunk[]): Span[][] {
  const paragraphs: Span[][] = []
  let currentPara: Span[] = []

  chunks.forEach((chunk) => {
    if (chunk.type === 'paragraph-break') {
      if (currentPara.length > 0) {
        paragraphs.push(currentPara)
        currentPara = []
      }
    } else if (chunk.type === 'text' && chunk.text) {
      currentPara.push({ text: chunk.text, diffType: chunk.diffType || 'unchanged' })
    }
  })

  if (currentPara.length > 0) {
    paragraphs.push(currentPara)
  }

  return paragraphs
}

function convertParagraphsToHtml(paragraphs: Span[][]): string {
  return paragraphs
    .map((spans) => {
      const spanHtml = spans.map((span) => wrapWithDiffClass(span.text, span.diffType)).join('')
      return `<p>${spanHtml}</p>`
    })
    .join('')
}

export function DiffPreview({ diff, onAccept, onReject, onPageCountChange }: DiffPreviewProps) {
  const htmlContent = useMemo(() => {
    const chunks = buildChunksFromDiff(diff)
    const paragraphs = buildParagraphsFromChunks(chunks)
    const html = convertParagraphsToHtml(paragraphs)
    return html || '<p></p>'
  }, [diff])

  const editor = useEditor({
    extensions: [
      StarterKit,
      DiffAdded,
      DiffRemoved,
      PaginationPlugin.configure({
        onPageCountChange: onPageCountChange,
      }),
    ],
    content: htmlContent,
    editable: false,
    immediatelyRender: false,
  })

  useEffect(() => {
    if (editor?.getHTML() !== htmlContent) {
      editor?.commands.setContent(htmlContent)
    }
  }, [editor, htmlContent])

  return (
    <div className="diff-preview-container">
      <EditorContent editor={editor} className="prose prose-lg max-w-none [&_.ProseMirror]:outline-none" />
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
