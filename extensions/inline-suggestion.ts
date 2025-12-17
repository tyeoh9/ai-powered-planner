import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'

export interface InlineSuggestionOptions {
  suggestion: string | null
  isGenerating: boolean
  suggestionStartPos: number
  onAccept?: () => void
  onReject?: () => void
}

export const InlineSuggestionPluginKey = new PluginKey('inlineSuggestion')

// Store state externally so decorations can always access latest values
let currentState: InlineSuggestionOptions = {
  suggestion: null,
  isGenerating: false,
  suggestionStartPos: 0,
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
      suggestion: null,
      isGenerating: false,
      suggestionStartPos: 0,
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
            // Always read from the external state
            const { suggestion, isGenerating, suggestionStartPos, onAccept, onReject } = currentState
            const decorations: Decoration[] = []

            // Show thinking indicator at end of document when generating
            if (isGenerating) {
              const pos = state.doc.content.size
              const thinkingWidget = Decoration.widget(
                pos,
                () => {
                  const span = document.createElement('span')
                  span.className = 'inline-thinking-indicator'
                  span.innerHTML = `
                    <span class="thinking-dot"></span>
                    <span class="thinking-dot"></span>
                    <span class="thinking-dot"></span>
                  `
                  return span
                },
                { side: 1 }
              )
              decorations.push(thinkingWidget)
            }

            // Show suggestion as inline green highlighted text
            if (suggestion && !isGenerating) {
              const pos = Math.min(suggestionStartPos, state.doc.content.size)

              const suggestionWidget = Decoration.widget(
                pos,
                () => {
                  const container = document.createElement('span')
                  container.className = 'inline-suggestion-container'

                  // Create the suggestion text with green highlight
                  const suggestionSpan = document.createElement('span')
                  suggestionSpan.className = 'inline-suggestion-text'

                  // Render suggestion as plain text with line breaks
                  const lines = suggestion.split('\n')
                  lines.forEach((line, index) => {
                    if (index > 0) {
                      suggestionSpan.appendChild(document.createElement('br'))
                    }
                    if (line.trim()) {
                      suggestionSpan.appendChild(document.createTextNode(line))
                    }
                  })

                  container.appendChild(suggestionSpan)

                  // Add the floating controls
                  const controls = document.createElement('span')
                  controls.className = 'inline-suggestion-controls'

                  const acceptBtn = document.createElement('button')
                  acceptBtn.className = 'suggestion-btn suggestion-btn-accept'
                  acceptBtn.innerHTML = '✓ <kbd>Tab</kbd>'
                  acceptBtn.addEventListener('click', (e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    onAccept?.()
                  })

                  const rejectBtn = document.createElement('button')
                  rejectBtn.className = 'suggestion-btn suggestion-btn-reject'
                  rejectBtn.innerHTML = '✕ <kbd>Esc</kbd>'
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
                { side: 1 }
              )
              decorations.push(suggestionWidget)
            }

            return DecorationSet.create(state.doc, decorations)
          },
        },
      }),
    ]
  },
})
