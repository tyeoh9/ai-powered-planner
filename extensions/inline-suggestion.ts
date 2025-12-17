import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'

export interface InlineSuggestionOptions {
  isGenerating: boolean
}

export const InlineSuggestionPluginKey = new PluginKey('inlineSuggestion')

// Store state externally so decorations can always access latest values
let currentState: InlineSuggestionOptions = {
  isGenerating: false,
}

export function updateInlineSuggestionState(newState: Partial<InlineSuggestionOptions>) {
  currentState = { ...currentState, ...newState }
}

export const InlineSuggestion = Extension.create<InlineSuggestionOptions>({
  name: 'inlineSuggestion',

  addOptions() {
    return {
      isGenerating: false,
    }
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: InlineSuggestionPluginKey,
        props: {
          decorations(state) {
            const { isGenerating } = currentState
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

            return DecorationSet.create(state.doc, decorations)
          },
        },
      }),
    ]
  },
})
