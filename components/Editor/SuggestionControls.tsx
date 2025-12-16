'use client'

interface SuggestionControlsProps {
  onAccept: () => void
  onReject: () => void
}

export function SuggestionControls({ onAccept, onReject }: SuggestionControlsProps) {
  return (
    <div className="mt-3 flex items-center justify-end gap-2">
      <button
        onClick={onReject}
        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-md transition-colors flex items-center gap-2"
      >
        Reject
        <kbd className="px-1.5 py-0.5 text-xs bg-gray-100 border border-gray-200 rounded font-mono">
          Esc
        </kbd>
      </button>
      <button
        onClick={onAccept}
        className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors flex items-center gap-2"
      >
        Accept Suggestion
        <kbd className="px-1.5 py-0.5 text-xs bg-green-500 rounded font-mono">Tab</kbd>
      </button>
    </div>
  )
}
