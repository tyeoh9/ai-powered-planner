'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { PAGE_CONTENT_HEIGHT } from '@/lib/pagination-engine'

interface PageContent {
  content: string
  height: number
}

/**
 * Hook to manage multiple page editors.
 * Handles content splitting and redistribution across pages.
 */
export function useMultiPageEditor(
  onContentChange: (content: string) => void,
  initialContent: string = ''
) {
  // Convert initial content to HTML if it's plain text
  const getInitialContent = () => {
    if (!initialContent.trim()) return ''
    // If it looks like HTML, return as-is, otherwise convert to HTML
    if (initialContent.includes('<p>') || initialContent.includes('<div>')) {
      return initialContent
    }
    // Convert plain text to HTML paragraphs
    return initialContent
      .split(/\n\n+/)
      .filter(p => p.trim())
      .map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`)
      .join('')
  }

  const [pageContents, setPageContents] = useState<PageContent[]>([
    { content: getInitialContent(), height: 0 },
  ])
  const [pageCount, setPageCount] = useState(1)
  const isUpdatingRef = useRef(false)
  const measureTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Get all content from all pages as plain text (for AI suggestions)
  const getAllContent = useCallback((): string => {
    // Convert HTML content to plain text, preserving paragraph breaks
    return pageContents
      .map((page) => {
        if (!page.content.trim()) return ''
        // Convert HTML to plain text, preserving paragraph structure
        const tempDiv = document.createElement('div')
        tempDiv.innerHTML = page.content
        // Get text and preserve paragraph breaks
        const text = Array.from(tempDiv.querySelectorAll('p'))
          .map(p => p.textContent?.trim() || '')
          .filter(t => t.length > 0)
          .join('\n\n')
        return text || tempDiv.textContent?.trim() || ''
      })
      .filter((text) => text.trim().length > 0)
      .join('\n\n')
  }, [pageContents])

  // Handle content update from a specific page
  const handlePageUpdate = useCallback(
    (content: string, pageIndex: number, height: number) => {
      if (isUpdatingRef.current) return

      setPageContents((prev) => {
        const updated = [...prev]
        if (!updated[pageIndex]) {
          updated[pageIndex] = { content: '', height: 0 }
        }
        updated[pageIndex].content = content
        updated[pageIndex].height = height

        // Check if this page overflows
        if (height > PAGE_CONTENT_HEIGHT) {
          // Trigger immediate redistribution - no delay
          measureAndRedistribute(updated)
        } else {
          // Normal update - delay redistribution slightly to avoid flicker
          if (measureTimeoutRef.current) {
            clearTimeout(measureTimeoutRef.current)
          }
          measureTimeoutRef.current = setTimeout(() => {
            measureAndRedistribute(updated)
          }, 200)
        }

        return updated
      })

      // Immediately notify parent of content change
      const allContent = getAllContent()
      onContentChange(allContent)
    },
    [getAllContent, onContentChange]
  )

  // Handle overflow from a specific page
  const handlePageOverflow = useCallback(
    (pageIndex: number) => {
      if (isUpdatingRef.current) return

      setPageContents((prev) => {
        const updated = [...prev]
        // Trigger immediate redistribution - no delay
        measureAndRedistribute(updated)
        return updated
      })
    },
    []
  )

  // Measure page heights and redistribute if needed
  const measureAndRedistribute = useCallback((currentPages: PageContent[]) => {
    if (isUpdatingRef.current) return

    // Collect all content (already in HTML format)
    const allContent = currentPages
      .map((page) => page.content)
      .filter((html) => html.trim().length > 0)
      .join('')

    if (!allContent.trim()) {
      setPageContents([{ content: '', height: 0 }])
      setPageCount(1)
      return
    }

    // Check if any page has overflowed
    const hasOverflow = currentPages.some((page) => page.height > PAGE_CONTENT_HEIGHT)

    // Split content into pages
    const redistributed = splitContentIntoPages(allContent)
    setPageContents(redistributed)
    setPageCount(redistributed.length)
    isUpdatingRef.current = true

    // If there was overflow, keep the flag set longer to allow cursor to move
    setTimeout(() => {
      isUpdatingRef.current = false
    }, hasOverflow ? 150 : 100)
  }, [])

  // Split content into pages based on estimated height
  // Content can be either HTML or plain text
  const splitContentIntoPages = useCallback((content: string): PageContent[] => {
    if (!content.trim()) return [{ content: '', height: 0 }]

    // Check if content is HTML or plain text
    const isHTML = content.includes('<p>') || content.includes('<div>') || content.trim().startsWith('<')

    let paragraphs: string[]
    if (isHTML) {
      // Parse HTML and extract paragraphs
      const tempDiv = document.createElement('div')
      tempDiv.innerHTML = content
      paragraphs = Array.from(tempDiv.querySelectorAll('p'))
        .map(p => p.outerHTML)
        .filter(p => p.trim().length > 0)
      
      // If no paragraphs found, treat as single block
      if (paragraphs.length === 0) {
        paragraphs = [content]
      }
    } else {
      // Plain text - split by double newlines
      paragraphs = content.split(/\n\n+/).filter((p) => p.trim())
      // Convert plain text paragraphs to HTML paragraphs
      paragraphs = paragraphs.map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`)
    }

    const pages: PageContent[] = []
    let currentPage: string[] = []
    let currentHeight = 0

    // Rough estimate: ~24px per line, ~16px spacing between paragraphs
    const LINE_HEIGHT = 24
    const PARAGRAPH_SPACING = 16

    for (const paragraph of paragraphs) {
      // Estimate height from paragraph HTML
      const tempDiv = document.createElement('div')
      tempDiv.innerHTML = paragraph
      const text = tempDiv.textContent || ''
      const lines = Math.max(1, text.split('\n').length || Math.ceil(text.length / 80))
      const paragraphHeight = lines * LINE_HEIGHT + PARAGRAPH_SPACING

      if (currentHeight + paragraphHeight > PAGE_CONTENT_HEIGHT && currentPage.length > 0) {
        // Start new page
        pages.push({
          content: currentPage.join(''),
          height: currentHeight,
        })
        currentPage = [paragraph]
        currentHeight = paragraphHeight
      } else {
        currentPage.push(paragraph)
        currentHeight += paragraphHeight
      }
    }

    if (currentPage.length > 0) {
      pages.push({
        content: currentPage.join(''),
        height: currentHeight,
      })
    }

    return pages.length > 0 ? pages : [{ content: '', height: 0 }]
  }, [])

  // Set page contents from outside (e.g., when accepting a suggestion)
  const setPageContentsFromString = useCallback(
    (content: string) => {
      isUpdatingRef.current = true
      const redistributed = splitContentIntoPages(content)
      setPageContents(redistributed)
      setPageCount(redistributed.length)
      setTimeout(() => {
        isUpdatingRef.current = false
      }, 100)
    },
    [splitContentIntoPages]
  )

  // Cleanup
  useEffect(() => {
    return () => {
      if (measureTimeoutRef.current) {
        clearTimeout(measureTimeoutRef.current)
      }
    }
  }, [])

  return {
    pageContents,
    pageCount,
    handlePageUpdate,
    handlePageOverflow,
    getAllContent,
    isUpdatingRef,
    setPageContents: setPageContentsFromString,
  }
}
