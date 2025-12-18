// Page dimensions (US Letter @ 96 DPI)
export const PAGE_WIDTH = 816
export const PAGE_HEIGHT = 1056
export const PAGE_PADDING_LEFT = 96
export const PAGE_PADDING_RIGHT = 96
export const PAGE_PADDING_TOP = 72
export const PAGE_PADDING_BOTTOM = 72
export const PAGE_CONTENT_HEIGHT = PAGE_HEIGHT - PAGE_PADDING_TOP - PAGE_PADDING_BOTTOM // 912
export const PAGE_GAP = 16

// Calculate number of pages needed for content height
export function calculatePageCount(contentHeight: number): number {
  if (contentHeight <= PAGE_CONTENT_HEIGHT) return 1
  return Math.ceil(contentHeight / PAGE_CONTENT_HEIGHT)
}

// Get page index (0-based) for a global Y position
export function getPageForY(y: number): number {
  const pageWithGap = PAGE_HEIGHT + PAGE_GAP
  return Math.floor(y / pageWithGap)
}

// Convert global Y to local position within page
export function getYPositionInPage(globalY: number): { page: number; localY: number } {
  const pageWithGap = PAGE_HEIGHT + PAGE_GAP
  const page = Math.floor(globalY / pageWithGap)
  const localY = globalY - page * pageWithGap
  return { page, localY }
}

// Check if Y position falls within a gap between pages
export function isInGap(y: number, pageCount: number): boolean {
  if (pageCount <= 1) return false

  for (let i = 0; i < pageCount - 1; i++) {
    const gapStart = (i + 1) * PAGE_HEIGHT + i * PAGE_GAP
    const gapEnd = gapStart + PAGE_GAP
    if (y >= gapStart && y < gapEnd) return true
  }
  return false
}

// Get the Y position just after a gap (for cursor navigation)
export function getYAfterGap(y: number, pageCount: number): number {
  for (let i = 0; i < pageCount - 1; i++) {
    const gapStart = (i + 1) * PAGE_HEIGHT + i * PAGE_GAP
    const gapEnd = gapStart + PAGE_GAP
    if (y >= gapStart && y < gapEnd) {
      return gapEnd + PAGE_PADDING_TOP
    }
  }
  return y
}

// Get the Y position just before a gap (for cursor navigation)
export function getYBeforeGap(y: number, pageCount: number): number {
  for (let i = 0; i < pageCount - 1; i++) {
    const gapStart = (i + 1) * PAGE_HEIGHT + i * PAGE_GAP
    const gapEnd = gapStart + PAGE_GAP
    if (y >= gapStart && y < gapEnd) {
      return gapStart - PAGE_PADDING_BOTTOM - 1
    }
  }
  return y
}

// Calculate total height including all pages and gaps
export function calculateTotalHeight(pageCount: number): number {
  return pageCount * PAGE_HEIGHT + (pageCount - 1) * PAGE_GAP
}
