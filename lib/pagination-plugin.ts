import { Extension } from '@tiptap/core'
import { Plugin, PluginKey, Transaction } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import { TextSelection } from '@tiptap/pm/state'
import { measureLines, calculatePageBreaks, getPageCount, PageBreak } from './pagination-layout'
import {
  PAGE_GAP,
  PAGE_PADDING_TOP,
  PAGE_PADDING_BOTTOM,
} from './pagination-engine'

const paginationPluginKey = new PluginKey<PaginationPluginState>('paginationLayout')

interface PaginationPluginState {
  decorations: DecorationSet
  pageBreaks: PageBreak[]
}

export interface PaginationPluginOptions {
  onPageCountChange?: (pageCount: number) => void
}

export const PaginationPlugin = Extension.create<PaginationPluginOptions>({
  name: 'paginationLayout',

  addOptions() {
    return {
      onPageCountChange: undefined,
    }
  },

  addProseMirrorPlugins() {
    const { onPageCountChange } = this.options
    let lastPageCount = 1
    let isCalculating = false
    let pendingCalculation = false

    return [
      new Plugin<PaginationPluginState>({
        key: paginationPluginKey,

        state: {
          init(): PaginationPluginState {
            return { decorations: DecorationSet.empty, pageBreaks: [] }
          },

          apply(tr: Transaction, oldState: PaginationPluginState): PaginationPluginState {
            const meta = tr.getMeta(paginationPluginKey)
            if (meta) {
              return meta
            }

            if (tr.docChanged) {
              return {
                decorations: oldState.decorations.map(tr.mapping, tr.doc),
                pageBreaks: oldState.pageBreaks,
              }
            }

            return oldState
          },
        },

        view(editorView) {
          let rafId: number | null = null
          let stabilizationCount = 0
          const MAX_ITERATIONS = 5

          const calculateLayout = () => {
            rafId = null

            if (isCalculating) {
              pendingCalculation = true
              return
            }
            isCalculating = true
            pendingCalculation = false

            try {
              // Clear existing decorations first to get clean measurements
              const currentState = paginationPluginKey.getState(editorView.state)
              const hasExistingDecorations = (currentState?.pageBreaks?.length ?? 0) > 0

              if (hasExistingDecorations && stabilizationCount === 0) {
                // First pass: clear decorations to measure raw content
                const clearTr = editorView.state.tr.setMeta(paginationPluginKey, {
                  decorations: DecorationSet.empty,
                  pageBreaks: [],
                })
                clearTr.setMeta('addToHistory', false)
                editorView.dispatch(clearTr)

                // Schedule re-measurement after DOM updates
                stabilizationCount = 1
                rafId = requestAnimationFrame(calculateLayout)
                return
              }

              // Measure lines in current DOM state
              const lines = measureLines(editorView)
              const pageBreaks = calculatePageBreaks(lines)

              console.log('[Pagination] Lines:', lines.length, 'Page breaks:', pageBreaks.length)
              if (pageBreaks.length > 0) {
                console.log('[Pagination] Breaks:', pageBreaks)
              }

              // Create decorations
              const decorations = pageBreaks.map((pageBreak) => {
                return Decoration.widget(pageBreak.pos, (view, getPos) => {
                  const spacerWidget = document.createElement('div')
                  spacerWidget.className = 'page-break-spacer'
                  // spacerHeight = remaining space on page + PAGE_PADDING_BOTTOM + PAGE_GAP + PAGE_PADDING_TOP
                  // We render this as a single block that pushes content down
                  spacerWidget.style.height = `${pageBreak.spacerHeight}px`
                  spacerWidget.setAttribute('data-page', String(pageBreak.pageNumber))
                  spacerWidget.contentEditable = 'false'


                  return spacerWidget
                }, {
                  side: -1,
                  key: `page-break-${pageBreak.pageNumber}`,
                })
              })

              const decorationSet = DecorationSet.create(editorView.state.doc, decorations)

              const tr = editorView.state.tr.setMeta(paginationPluginKey, {
                decorations: decorationSet,
                pageBreaks,
              })
              tr.setMeta('addToHistory', false)
              editorView.dispatch(tr)

              // Check if layout is stable (same number of breaks)
              const prevBreakCount = currentState?.pageBreaks?.length || 0
              if (pageBreaks.length !== prevBreakCount && stabilizationCount < MAX_ITERATIONS) {
                // Layout changed, need to re-measure after DOM update
                stabilizationCount++
                rafId = requestAnimationFrame(calculateLayout)
              } else {
                // Layout is stable
                stabilizationCount = 0

                const newPageCount = getPageCount(lines, pageBreaks)
                if (newPageCount !== lastPageCount) {
                  lastPageCount = newPageCount
                  onPageCountChange?.(newPageCount)
                }
              }
            } finally {
              isCalculating = false

              if (pendingCalculation) {
                rafId = requestAnimationFrame(calculateLayout)
              }
            }
          }

          const scheduleLayout = () => {
            stabilizationCount = 0
            if (rafId === null) {
              rafId = requestAnimationFrame(calculateLayout)
            }
          }

          // Initial calculation
          setTimeout(scheduleLayout, 50)

          return {
            update(view, prevState) {
              if (view.state.doc !== prevState.doc) {
                scheduleLayout()
              }
            },
            destroy() {
              if (rafId !== null) {
                cancelAnimationFrame(rafId)
              }
            },
          }
        },

        props: {
          decorations(state) {
            return paginationPluginKey.getState(state)?.decorations || DecorationSet.empty
          },

          handleKeyDown(view, event) {
            if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') {
              return false
            }

            const { state } = view
            const { selection } = state
            const pluginState = paginationPluginKey.getState(state)

            if (!pluginState?.pageBreaks?.length) return false

            const coords = view.coordsAtPos(selection.head)
            const editorRect = view.dom.getBoundingClientRect()
            const relativeY = coords.top - editorRect.top

            for (const pageBreak of pluginState.pageBreaks) {
              const breakCoords = view.coordsAtPos(pageBreak.pos)
              const breakY = breakCoords.top - editorRect.top
              const afterBreakY = breakY + pageBreak.spacerHeight

              if (event.key === 'ArrowDown') {
                // If cursor is near the bottom of the page (before the spacer)
                if (relativeY >= breakY - 30 && relativeY < afterBreakY) {
                  const targetY = editorRect.top + afterBreakY + 10
                  const targetPos = view.posAtCoords({ left: coords.left, top: targetY })
                  if (targetPos) {
                    const resolvedPos = state.doc.resolve(targetPos.pos)
                    const tr = state.tr.setSelection(TextSelection.near(resolvedPos))
                    view.dispatch(tr)
                    return true
                  }
                }
              }

              if (event.key === 'ArrowUp') {
                // If cursor is on the first line after the spacer (within ~50px of spacer end)
                // Check if cursor position is right after this page break
                if (selection.head >= pageBreak.pos && relativeY >= afterBreakY && relativeY <= afterBreakY + 50) {
                  const targetY = editorRect.top + breakY - 10
                  const targetPos = view.posAtCoords({ left: coords.left, top: targetY })
                  if (targetPos) {
                    const resolvedPos = state.doc.resolve(targetPos.pos)
                    const tr = state.tr.setSelection(TextSelection.near(resolvedPos))
                    view.dispatch(tr)
                    return true
                  }
                }
              }
            }

            return false
          },
        },
      }),
    ]
  },
})

export function getPageBreaksFromState(state: any): PageBreak[] {
  const pluginState = paginationPluginKey.getState(state)
  return pluginState?.pageBreaks || []
}
