import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'

export interface ThinkingIndicatorOptions {
  isThinking: boolean
}

export const ThinkingIndicatorPluginKey = new PluginKey('thinkingIndicator')

export const ThinkingIndicator = Extension.create<ThinkingIndicatorOptions>({
  name: 'thinkingIndicator',

  addOptions() {
    return {
      isThinking: false,
    }
  },

  addProseMirrorPlugins() {
    const extensionThis = this

    return [
      new Plugin({
        key: ThinkingIndicatorPluginKey,
        props: {
          decorations(state) {
            if (!extensionThis.options.isThinking) {
              return DecorationSet.empty
            }

            // Position at the end of the document
            const pos = state.doc.content.size

            const widget = Decoration.widget(
              pos,
              () => {
                const span = document.createElement('span')
                span.className = 'thinking-dots'
                span.innerHTML = '<span>.</span><span>.</span><span>.</span>'
                return span
              },
              { side: 1 }
            )

            return DecorationSet.create(state.doc, [widget])
          },
        },
      }),
    ]
  },
})
