'use client'

import { useEditor, EditorContent, Editor as TipTapEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { useEffect, useRef } from 'react'
import { EDITOR_PLACEHOLDER } from '@/lib/constants'
import { PAGE_CONTENT_HEIGHT } from '@/lib/pagination-engine'

interface PageEditorProps {
  content: string
  pageIndex: number
  onUpdate: (content: string, pageIndex: number, height: number) => void
  isUpdating: React.MutableRefObject<boolean>
  onOverflow?: (pageIndex: number) => void
  editorRef?: React.MutableRefObject<TipTapEditor | null>
}

export function PageEditor({ content, pageIndex, onUpdate, isUpdating, onOverflow, editorRef }: PageEditorProps) {
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: pageIndex === 0 ? EDITOR_PLACEHOLDER : '',
      }),
    ],
    content,
    immediatelyRender: false,
    onCreate: ({ editor }) => {
      if (editorRef) {
        editorRef.current = editor
      }
    },
    onUpdate: ({ editor }) => {
      if (isUpdating.current) return

      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current)
      }

      updateTimeoutRef.current = setTimeout(async () => {
        // Wait for fonts to load before measuring
        await document.fonts.ready

        // Get HTML content to preserve paragraph structure
        const newContent = editor.getHTML()
        // Measure actual height
        const editorElement = editor.view.dom
        const height = editorElement.scrollHeight
        onUpdate(newContent, pageIndex, height)

        // Check for overflow immediately and trigger redistribution
        if (height > PAGE_CONTENT_HEIGHT) {
          // Trigger overflow handler immediately
          onOverflow?.(pageIndex)
        }
      }, 30) // Very short delay for responsive updates
    },
  })

  // Update editor content when prop changes (but not from user edits)
  useEffect(() => {
    if (editor && editor.getHTML() !== content) {
      // Set updating flag to prevent onUpdate from firing during programmatic update
      const wasUpdating = isUpdating.current
      isUpdating.current = true
      // Content is HTML, so set it directly
      editor.commands.setContent(content)
      setTimeout(() => {
        isUpdating.current = wasUpdating // Restore previous state
      }, 100)
    }
  }, [content, editor, isUpdating])

  // Measure height periodically to catch overflow
  useEffect(() => {
    if (!editor) return

    const measureHeight = async () => {
      if (isUpdating.current) return

      await document.fonts.ready

      const height = editor.view.dom.scrollHeight
      if (height > PAGE_CONTENT_HEIGHT) {
        onOverflow?.(pageIndex)
      }
    }

    const interval = setInterval(measureHeight, 100)
    const resizeObserver = new ResizeObserver(measureHeight)
    const mutationObserver = new MutationObserver(measureHeight)

    if (editor.view.dom) {
      resizeObserver.observe(editor.view.dom)
      mutationObserver.observe(editor.view.dom, {
        childList: true,
        subtree: true,
        characterData: true,
      })
    }

    return () => {
      clearInterval(interval)
      resizeObserver.disconnect()
      mutationObserver.disconnect()
    }
  }, [editor, pageIndex, onOverflow, isUpdating])

  // Store editor in ref
  useEffect(() => {
    if (editor && editorRef) {
      editorRef.current = editor
    }
    return () => {
      if (editorRef) {
        editorRef.current = null
      }
    }
  }, [editor, editorRef])

  // Cleanup
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current)
      }
      editor?.destroy()
    }
  }, [editor])

  if (!editor) return null

  return (
    <div
      style={{
        height: '100%',
        overflow: 'hidden',
        maxHeight: PAGE_CONTENT_HEIGHT,
        position: 'relative',
      }}
    >
      <div style={{ 
        height: '100%',
        overflow: 'hidden',
      }}>
        <EditorContent
          editor={editor}
          className="prose prose-lg max-w-none focus:outline-none [&_.ProseMirror]:outline-none [&_.ProseMirror]:h-full [&_.ProseMirror]:overflow-hidden"
        />
      </div>
    </div>
  )
}
