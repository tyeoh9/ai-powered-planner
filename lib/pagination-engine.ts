export const PAGE_WIDTH = 816
export const PAGE_HEIGHT = 1056
export const PAGE_PADDING_LEFT = 96
export const PAGE_PADDING_RIGHT = 96
export const PAGE_PADDING_TOP = 72
export const PAGE_PADDING_BOTTOM = 72
export const PAGE_CONTENT_HEIGHT = PAGE_HEIGHT - PAGE_PADDING_TOP - PAGE_PADDING_BOTTOM
export const PAGE_GAP = 16

export function calculateTotalHeight(pageCount: number): number {
  return pageCount * PAGE_HEIGHT + (pageCount - 1) * PAGE_GAP
}
