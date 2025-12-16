import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'

export interface InlineSuggestionState {
  suggestion: string | null
  isGenerating: boolean
  suggestionStartPos: number
  onAccept?: () => void
  onReject?: () => void
}

export interface InlineSuggestionOptions {
  suggestion: string | null
  isGenerating: boolean
  suggestionStartPos: number
  onAccept?: () => void
  onReject?: () => void
}

export const InlineSuggestionPluginKey = new PluginKey<InlineSuggestionState>('inlineSuggestion')

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
    const extensionThis = this

    return [
      new Plugin<InlineSuggestionState>({
        key: InlineSuggestionPluginKey,
        state: {
          init() {
            return {
              suggestion: extensionThis.options.suggestion,
              isGenerating: extensionThis.options.isGenerating,
              suggestionStartPos: extensionThis.options.suggestionStartPos,
              onAccept: extensionThis.options.onAccept,
              onReject: extensionThis.options.onReject,
            }
          },
          apply(tr, value, oldState, newState) {
            // Update state from extension options if they changed
            const newSuggestion = extensionThis.options.suggestion
            const newIsGenerating = extensionThis.options.isGenerating
            const newSuggestionStartPos = extensionThis.options.suggestionStartPos
            const newOnAccept = extensionThis.options.onAccept
            const newOnReject = extensionThis.options.onReject

            // Check if anything changed
            if (
              value.suggestion !== newSuggestion ||
              value.isGenerating !== newIsGenerating ||
              value.suggestionStartPos !== newSuggestionStartPos ||
              value.onAccept !== newOnAccept ||
              value.onReject !== newOnReject
            ) {
              return {
                suggestion: newSuggestion,
                isGenerating: newIsGenerating,
                suggestionStartPos: newSuggestionStartPos,
                onAccept: newOnAccept,
                onReject: newOnReject,
              }
            }

            return value
          },
        },
        props: {
          decorations(state) {
            const pluginState = InlineSuggestionPluginKey.getState(state)
            if (!pluginState) {
              return DecorationSet.empty
            }

            const { suggestion, isGenerating, suggestionStartPos } = pluginState
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
              // Capture callbacks from plugin state
              const onAccept = pluginState.onAccept
              const onReject = pluginState.onReject

              const suggestionWidget = Decoration.widget(
                pos,
                () => {
                  const container = document.createElement('span')
                  container.className = 'inline-suggestion-container'

                  // Create the suggestion text with green highlight
                  const suggestionSpan = document.createElement('span')
                  suggestionSpan.className = 'inline-suggestion-text'
                  suggestionSpan.setAttribute('data-suggestion', 'true')

                  // Parse and render the suggestion content
                  // Convert markdown-ish content to simple HTML
                  const lines = suggestion.split('\n')
                  lines.forEach((line, index) => {
                    if (index > 0) {
                      suggestionSpan.appendChild(document.createElement('br'))
                    }

                    const trimmed = line.trim()
                    if (!trimmed) {
                      suggestionSpan.appendChild(document.createElement('br'))
                      return
                    }

                    // Handle ## headings
                    if (trimmed.startsWith('## ')) {
                      const heading = document.createElement('strong')
                      heading.className = 'suggestion-heading'
                      heading.textContent = trimmed.slice(3)
                      suggestionSpan.appendChild(heading)
                      return
                    }

                    // Handle bold text in list items
                    if (trimmed.startsWith('- **')) {
                      const listItem = document.createElement('span')
                      listItem.className = 'suggestion-list-item'

                      // Parse **bold**: rest pattern
                      const match = trimmed.match(/^- \*\*(.+?)\*\*:?\s*(.*)$/)
                      if (match) {
                        const bullet = document.createTextNode('• ')
                        const bold = document.createElement('strong')
                        bold.textContent = match[1] + ': '
                        const rest = document.createTextNode(match[2])
                        listItem.appendChild(bullet)
                        listItem.appendChild(bold)
                        listItem.appendChild(rest)
                      } else {
                        listItem.textContent = '• ' + trimmed.slice(2)
                      }
                      suggestionSpan.appendChild(listItem)
                      return
                    }

                    // Handle regular list items
                    if (trimmed.startsWith('- ')) {
                      const listItem = document.createElement('span')
                      listItem.className = 'suggestion-list-item'
                      listItem.textContent = '• ' + trimmed.slice(2)
                      suggestionSpan.appendChild(listItem)
                      return
                    }

                    // Regular text
                    suggestionSpan.appendChild(document.createTextNode(trimmed))
                  })

                  container.appendChild(suggestionSpan)

                  // Add the floating controls
                  const controls = document.createElement('span')
                  controls.className = 'inline-suggestion-controls'
                  
                  const acceptBtn = document.createElement('button')
                  acceptBtn.className = 'suggestion-btn suggestion-btn-accept'
                  acceptBtn.setAttribute('data-action', 'accept')
                  acceptBtn.setAttribute('title', 'Accept (Tab)')
                  acceptBtn.innerHTML = '✓ <kbd>Tab</kbd>'
                  acceptBtn.addEventListener('click', (e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    onAccept?.()
                  })
                  
                  const rejectBtn = document.createElement('button')
                  rejectBtn.className = 'suggestion-btn suggestion-btn-reject'
                  rejectBtn.setAttribute('data-action', 'reject')
                  rejectBtn.setAttribute('title', 'Reject (Esc)')
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
