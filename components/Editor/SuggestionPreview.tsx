'use client'

interface SuggestionPreviewProps {
  content: string
}

export function SuggestionPreview({ content }: SuggestionPreviewProps) {
  // Parse the markdown-like content and render with highlighting
  const lines = content.split('\n')

  return (
    <div className="mt-2 border-l-4 border-green-500 bg-green-50 rounded-r-lg p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded">
          + AI Suggestion
        </span>
      </div>
      <div className="prose prose-sm max-w-none text-green-900">
        {lines.map((line, i) => {
          const trimmed = line.trim()
          if (!trimmed) return <br key={i} />

          // Heading
          if (trimmed.startsWith('## ')) {
            return (
              <h3 key={i} className="text-base font-semibold mt-2 mb-1 text-green-800">
                {trimmed.slice(3)}
              </h3>
            )
          }

          // List item with bold
          if (trimmed.startsWith('- **')) {
            const match = trimmed.match(/^- \*\*(.+?)\*\*:?\s*(.*)$/)
            if (match) {
              return (
                <div key={i} className="flex gap-2 ml-2 my-0.5">
                  <span className="text-green-600">•</span>
                  <span>
                    <strong className="text-green-800">{match[1]}:</strong>{' '}
                    <span className="text-green-700">{match[2]}</span>
                  </span>
                </div>
              )
            }
          }

          // Regular list item
          if (trimmed.startsWith('- ')) {
            return (
              <div key={i} className="flex gap-2 ml-2 my-0.5">
                <span className="text-green-600">•</span>
                <span className="text-green-700">{trimmed.slice(2)}</span>
              </div>
            )
          }

          // Regular text
          return (
            <p key={i} className="text-green-700 my-0.5">
              {trimmed}
            </p>
          )
        })}
      </div>
    </div>
  )
}
