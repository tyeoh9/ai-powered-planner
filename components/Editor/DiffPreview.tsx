'use client'

import { DiffSegment } from '@/types'

interface DiffPreviewProps {
  diff: DiffSegment[]
  onAccept: () => void
  onReject: () => void
}

export function DiffPreview({ diff, onAccept, onReject }: DiffPreviewProps) {
  return (
    <div className="p-6 min-h-[400px]">
      <div className="diff-content">
        {diff.map((segment, index) => (
          <span key={index} className={`diff-segment diff-${segment.type}`}>
            {segment.text.split('\n').map((line, lineIndex) => (
              <span key={lineIndex}>
                {lineIndex > 0 && <br />}
                {line}
              </span>
            ))}
          </span>
        ))}
      </div>

      <div className="diff-controls">
        <button className="diff-btn diff-btn-accept" onClick={onAccept}>
          ✓ Accept <kbd>Tab</kbd>
        </button>
        <button className="diff-btn diff-btn-reject" onClick={onReject}>
          ✕ Reject <kbd>Esc</kbd>
        </button>
      </div>
    </div>
  )
}
