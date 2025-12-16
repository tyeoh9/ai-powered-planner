import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'

export interface GhostTextOptions {
  suggestion: string | null
}

export const GhostTextPluginKey = new PluginKey('ghostText')

export const GhostText = Extension.create<GhostTextOptions>({
  name: 'ghostText',

  addOptions() {
    return {
      suggestion: null,
    }
  },

  addProseMirrorPlugins() {
    const { options } = this

    return [
      new Plugin({
        key: GhostTextPluginKey,
        props: {
          decorations(state) {
            if (!options.suggestion) {
              return DecorationSet.empty
            }

            // Place ghost text at the end of the document
            const pos = state.doc.content.size

            const widget = Decoration.widget(
              pos,
              () => {
                const container = document.createElement('span')
                container.className = 'ghost-text'
                container.textContent = options.suggestion
                return container
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
