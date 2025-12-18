import { Extension } from '@tiptap/core'
import { Plugin, PluginKey, Transaction } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import { TextSelection } from '@tiptap/pm/state'
import { measureLinesWithSpacers, calculatePageBreaks, getPageCount, PageBreak, areBreaksEqual } from './pagination-layout'

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

          const updatePageCount = (lines: any[], breaks: any[]) => {
            const newPageCount = getPageCount(lines, breaks)
            if (newPageCount !== lastPageCount) {
              lastPageCount = newPageCount
              onPageCountChange?.(newPageCount)
            }
          }

          const createSpacerWidget = (pageBreak: PageBreak) => {
            const spacer = document.createElement('div')
            spacer.className = 'page-break-spacer'
            spacer.style.height = `${pageBreak.spacerHeight}px`
            spacer.setAttribute('data-page', String(pageBreak.pageNumber))
            spacer.contentEditable = 'false'
            return spacer
          }

          const calculateLayout = () => {
            rafId = null

            if (isCalculating) {
              pendingCalculation = true
              return
            }
            isCalculating = true
            pendingCalculation = false

            try {
              const currentState = paginationPluginKey.getState(editorView.state)
              const existingBreaks = currentState?.pageBreaks || []
              const lines = measureLinesWithSpacers(editorView, existingBreaks)
              const pageBreaks = calculatePageBreaks(lines)

              if (!areBreaksEqual(existingBreaks, pageBreaks)) {
                const decorations = pageBreaks.map((pageBreak) =>
                  Decoration.widget(pageBreak.pos, () => createSpacerWidget(pageBreak), {
                    side: -1,
                    key: `page-break-${pageBreak.pageNumber}`,
                  })
                )

                const decorationSet = DecorationSet.create(editorView.state.doc, decorations)
                const tr = editorView.state.tr
                  .setMeta(paginationPluginKey, { decorations: decorationSet, pageBreaks })
                  .setMeta('addToHistory', false)
                editorView.dispatch(tr)
              }

              updatePageCount(lines, pageBreaks)
            } finally {
              isCalculating = false
              if (pendingCalculation) {
                rafId = requestAnimationFrame(calculateLayout)
              }
            }
          }

          const scheduleLayout = () => {
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
            const isArrowKey = event.key === 'ArrowDown' || event.key === 'ArrowUp'
            if (!isArrowKey) return false

            const { state } = view
            const pluginState = paginationPluginKey.getState(state)
            if (!pluginState?.pageBreaks?.length) return false

            const coords = view.coordsAtPos(state.selection.head)
            const editorRect = view.dom.getBoundingClientRect()
            const relativeY = coords.top - editorRect.top

            for (const pageBreak of pluginState.pageBreaks) {
              const breakCoords = view.coordsAtPos(pageBreak.pos)
              const breakY = breakCoords.top - editorRect.top
              const afterBreakY = breakY + pageBreak.spacerHeight

              const shouldJumpDown = event.key === 'ArrowDown' &&
                relativeY >= breakY - 30 && relativeY < afterBreakY
              const shouldJumpUp = event.key === 'ArrowUp' &&
                state.selection.head >= pageBreak.pos &&
                relativeY >= afterBreakY &&
                relativeY <= afterBreakY + 50

              if (shouldJumpDown || shouldJumpUp) {
                const targetY = shouldJumpDown
                  ? editorRect.top + afterBreakY + 10
                  : editorRect.top + breakY - 10
                const targetPos = view.posAtCoords({ left: coords.left, top: targetY })

                if (targetPos) {
                  const tr = state.tr.setSelection(TextSelection.near(state.doc.resolve(targetPos.pos)))
                  view.dispatch(tr)
                  return true
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
