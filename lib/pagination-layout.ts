import { EditorView } from '@tiptap/pm/view'
import {
  PAGE_CONTENT_HEIGHT,
  PAGE_GAP,
  PAGE_PADDING_TOP,
  PAGE_PADDING_BOTTOM,
} from './pagination-engine'

export interface LineInfo {
  pos: number
  top: number
  bottom: number
  height: number
}

export interface PageBreak {
  pos: number
  spacerHeight: number
  pageNumber: number
}
export function areBreaksEqual(a: PageBreak[], b: PageBreak[]): boolean {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) {
    if (a[i].pos !== b[i].pos || Math.abs(a[i].spacerHeight - b[i].spacerHeight) > 1) {
      return false
    }
  }
  return true
}

function buildSpacerOffsetMap(breaks: PageBreak[]): Map<number, number> {
  const map = new Map<number, number>()
  let cumulativeOffset = 0
  for (const brk of breaks) {
    cumulativeOffset += brk.spacerHeight
    map.set(brk.pos, cumulativeOffset)
  }
  return map
}

function getSpacerOffsetBeforePosition(pos: number, breaks: PageBreak[], offsetMap: Map<number, number>): number {
  for (const brk of breaks) {
    if (brk.pos > pos) break
    const offset = offsetMap.get(brk.pos)
    if (offset !== undefined) return offset
  }
  return 0
}

export function measureLinesWithSpacers(view: EditorView, existingBreaks: PageBreak[]): LineInfo[] {
  const lines: LineInfo[] = []
  const editorRect = view.dom.getBoundingClientRect()
  const spacerOffsetMap = buildSpacerOffsetMap(existingBreaks)

  view.state.doc.descendants((node, pos) => {
    if (node.isBlock && node.isTextblock) {
      const domNode = view.nodeDOM(pos)
      if (domNode instanceof HTMLElement) {
        const rect = domNode.getBoundingClientRect()
        const offsetBefore = getSpacerOffsetBeforePosition(pos, existingBreaks, spacerOffsetMap)

        lines.push({
          pos,
          top: rect.top - editorRect.top - offsetBefore,
          bottom: rect.bottom - editorRect.top - offsetBefore,
          height: rect.height,
        })
      }
    }
    return true
  })

  return lines
}

export function calculatePageBreaks(lines: LineInfo[]): PageBreak[] {
  if (lines.length === 0) return []

  const breaks: PageBreak[] = []
  const spacerBase = PAGE_PADDING_BOTTOM + PAGE_GAP + PAGE_PADDING_TOP
  let totalSpacerOffset = 0
  let currentPageContentEnd = PAGE_CONTENT_HEIGHT
  let previousLineBottom = 0

  for (const line of lines) {
    const adjustedBottom = line.bottom + totalSpacerOffset

    if (adjustedBottom > currentPageContentEnd) {
      // Calculate remaining space from where content actually ends (previous line)
      // not from where the overflowing line starts
      const adjustedPrevBottom = previousLineBottom + totalSpacerOffset
      const spaceRemaining = Math.max(0, currentPageContentEnd - adjustedPrevBottom)
      const spacerHeight = spaceRemaining + spacerBase

      breaks.push({
        pos: line.pos,
        spacerHeight,
        pageNumber: breaks.length + 1,
      })

      totalSpacerOffset += spacerHeight
      // Next page boundary: current line's adjusted position + full page content height
      // The overflowing line starts at top of new page, so next boundary is that + PAGE_CONTENT_HEIGHT
      const adjustedLineTop = line.top + totalSpacerOffset
      currentPageContentEnd = adjustedLineTop + PAGE_CONTENT_HEIGHT
    }

    previousLineBottom = line.bottom
  }

  return breaks
}

export function getPageCount(lines: LineInfo[], breaks: PageBreak[]): number {
  if (lines.length === 0) return 1

  const lastLine = lines[lines.length - 1]
  const totalSpacerHeight = breaks.reduce((sum, b) => sum + b.spacerHeight, 0)
  const totalContentHeight = lastLine.bottom + totalSpacerHeight

  return totalContentHeight <= PAGE_CONTENT_HEIGHT ? 1 : breaks.length + 1
}
