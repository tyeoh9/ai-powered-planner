import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import { DiffSegment } from '@/types'

export interface InlineSuggestionOptions {
  diff: DiffSegment[] | null
  isGenerating: boolean
  onAccept?: () => void
  onReject?: () => void
}

export const InlineSuggestionPluginKey = new PluginKey('inlineSuggestion')

// Store state externally so decorations can always access latest values
let currentState: InlineSuggestionOptions = {
  diff: null,
  isGenerating: false,
  onAccept: undefined,
  onReject: undefined,
}

export function updateInlineSuggestionState(newState: Partial<InlineSuggestionOptions>) {
  currentState = { ...currentState, ...newState }
}

export function getInlineSuggestionState(): InlineSuggestionOptions {
  return currentState
}

export const InlineSuggestion = Extension.create<InlineSuggestionOptions>({
  name: 'inlineSuggestion',

  addOptions() {
    return {
      diff: null,
      isGenerating: false,
      onAccept: undefined,
      onReject: undefined,
    }
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: InlineSuggestionPluginKey,
        props: {
          decorations(state) {
            const { diff, isGenerating, onAccept, onReject } = currentState
            const decorations: Decoration[] = []
            const docSize = state.doc.content.size

            // Show thinking indicator at end of content when generating
            if (isGenerating && docSize > 0) {
              const widget = Decoration.widget(
                docSize,
                () => {
                  const span = document.createElement('span')
                  span.className = 'inline-thinking-indicator'
                  span.innerHTML = `
                    <span class="thinking-dot"></span>
                    <span class="thinking-dot"></span>
                    <span class="thinking-dot"></span>
                    <span class="thinking-text">AI is thinking...</span>
                  `
                  return span
                },
                { side: 1 }
              )
              decorations.push(widget)
            }

            // Show diff preview at end of document
            if (diff && diff.length > 0 && !isGenerating && docSize > 0) {
              // First, add a decoration to dim/hide the original content
              // We'll use inline decorations on all text nodes
              state.doc.descendants((node, pos) => {
                if (node.isText) {
                  decorations.push(
                    Decoration.inline(pos, pos + node.nodeSize, {
                      class: 'original-content-hidden',
                    })
                  )
                }
                return true
              })

              // Add the diff preview widget at position 1 (after doc start)
              const widget = Decoration.widget(
                1,
                () => {
                  const container = document.createElement('div')
                  container.className = 'diff-preview-container'

                  // Diff content
                  const diffContent = document.createElement('div')
                  diffContent.className = 'diff-content'

                  diff.forEach((segment) => {
                    const span = document.createElement('span')
                    span.className = `diff-segment diff-${segment.type}`

                    // Handle newlines properly
                    const parts = segment.text.split('\n')
                    parts.forEach((part, i) => {
                      if (i > 0) {
                        span.appendChild(document.createElement('br'))
                      }
                      if (part) {
                        span.appendChild(document.createTextNode(part))
                      }
                    })

                    diffContent.appendChild(span)
                  })

                  container.appendChild(diffContent)

                  // Controls
                  const controls = document.createElement('div')
                  controls.className = 'diff-controls'

                  const acceptBtn = document.createElement('button')
                  acceptBtn.className = 'diff-btn diff-btn-accept'
                  acceptBtn.innerHTML = '✓ Accept <kbd>Tab</kbd>'
                  acceptBtn.addEventListener('click', (e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    onAccept?.()
                  })

                  const rejectBtn = document.createElement('button')
                  rejectBtn.className = 'diff-btn diff-btn-reject'
                  rejectBtn.innerHTML = '✕ Reject <kbd>Esc</kbd>'
                  rejectBtn.addEventListener('click', (e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    onReject?.()
                  })

                  controls.appendChild(acceptBtn)
                  controls.appendChild(rejectBtn)
                  container.appendChild(controls)

                  return container
                },
                { side: -1 }
              )
              decorations.push(widget)
            }

            return DecorationSet.create(state.doc, decorations)
          },
        },
      }),
    ]
  },
})
