import { EditorView } from '@tiptap/pm/view'
import {
  PAGE_CONTENT_HEIGHT,
  PAGE_GAP,
  PAGE_PADDING_TOP,
  PAGE_PADDING_BOTTOM,
} from './pagination-engine'

export interface LineInfo {
  pos: number // ProseMirror position at start of line
  top: number // Y position relative to editor dom
  bottom: number // Y + height
  height: number
}

export interface PageBreak {
  pos: number // Position to insert spacer before
  spacerHeight: number // Height of spacer to insert
  pageNumber: number // Which page this break leads to
}

/**
 * Compare two break arrays to see if they're equivalent
 */
export function areBreaksEqual(a: PageBreak[], b: PageBreak[]): boolean {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) {
    if (a[i].pos !== b[i].pos || Math.abs(a[i].spacerHeight - b[i].spacerHeight) > 1) {
      return false
    }
  }
  return true
}

/**
 * Measure all visual lines (paragraphs) in the editor,
 * subtracting the height of any existing spacers to get "raw" positions.
 */
export function measureLinesWithSpacers(view: EditorView, existingBreaks: PageBreak[]): LineInfo[] {
  const lines: LineInfo[] = []
  const { doc } = view.state
  const editorRect = view.dom.getBoundingClientRect()

  // Build a map of spacer offsets by position
  const spacerOffsetMap = new Map<number, number>()
  let cumulativeOffset = 0
  for (const brk of existingBreaks) {
    cumulativeOffset += brk.spacerHeight
    spacerOffsetMap.set(brk.pos, cumulativeOffset)
  }

  doc.descendants((node, pos) => {
    if (node.isBlock && node.isTextblock) {
      const domNode = view.nodeDOM(pos)
      if (domNode && domNode instanceof HTMLElement) {
        const rect = domNode.getBoundingClientRect()
        const rawTop = rect.top - editorRect.top
        const rawBottom = rect.bottom - editorRect.top

        // Find cumulative spacer offset before this position
        let offsetBefore = 0
        for (const brk of existingBreaks) {
          if (brk.pos <= pos) {
            offsetBefore = spacerOffsetMap.get(brk.pos) || 0
          } else {
            break
          }
        }

        // Subtract spacer offset to get "natural" position without spacers
        lines.push({
          pos,
          top: rawTop - offsetBefore,
          bottom: rawBottom - offsetBefore,
          height: rect.height,
        })
      }
    }
    return true
  })

  return lines
}

/**
 * Calculate page breaks needed to prevent lines from crossing page boundaries.
 *
 * Strategy: If a line's bottom would exceed the current page's content area,
 * insert a spacer BEFORE it to push the entire line to the next page.
 *
 * Line positions are measured relative to the ProseMirror editor's DOM.
 * The ProseMirror editor content starts at y=0 (relative to itself).
 */
export function calculatePageBreaks(lines: LineInfo[]): PageBreak[] {
  if (lines.length === 0) return []

  const breaks: PageBreak[] = []

  // Spacer = bottom padding + gap + top padding (to reach content area of next page)
  const spacerBase = PAGE_PADDING_BOTTOM + PAGE_GAP + PAGE_PADDING_TOP

  // Track cumulative offset from spacers we've added
  let totalSpacerOffset = 0

  // The first page content area ends at PAGE_CONTENT_HEIGHT (measured from editor top)
  let currentPageContentEnd = PAGE_CONTENT_HEIGHT

  for (const line of lines) {
    // Where would this line be after accounting for all spacers inserted so far?
    const adjustedBottom = line.bottom + totalSpacerOffset

    // Check if this line would overflow the current page
    if (adjustedBottom > currentPageContentEnd) {
      // Line would overflow - we need to push it to the next page

      // How much space is left on current page before this line?
      const adjustedTop = line.top + totalSpacerOffset
      const spaceRemaining = Math.max(0, currentPageContentEnd - adjustedTop)

      // Spacer height = remaining space on page + base spacer (padding/gap/padding)
      const spacerHeight = spaceRemaining + spacerBase

      breaks.push({
        pos: line.pos,
        spacerHeight,
        pageNumber: breaks.length + 1,
      })

      // Update tracking variables
      totalSpacerOffset += spacerHeight
      // Next page content ends at: where the line will now start + PAGE_CONTENT_HEIGHT
      currentPageContentEnd = adjustedTop + spacerHeight + PAGE_CONTENT_HEIGHT
    }
  }

  return breaks
}

/**
 * Get total page count based on content height and breaks.
 */
export function getPageCount(lines: LineInfo[], breaks: PageBreak[]): number {
  if (lines.length === 0) return 1

  const lastLine = lines[lines.length - 1]
  const totalSpacerHeight = breaks.reduce((sum, b) => sum + b.spacerHeight, 0)
  const totalContentHeight = lastLine.bottom + totalSpacerHeight

  if (totalContentHeight <= PAGE_CONTENT_HEIGHT) return 1

  // Each page after first adds: PAGE_CONTENT_HEIGHT + spacerBase
  // Count = 1 + number of breaks
  return breaks.length + 1
}
