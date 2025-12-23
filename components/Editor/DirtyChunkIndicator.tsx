'use client'

import type { DirtyChunk } from '@/types'
import { computeDiff } from '@/utils/diff'

interface DirtyChunkIndicatorProps {
  dirtyChunk: DirtyChunk
  queueProgress: { current: number; total: number }
  onAccept: () => void
  onSkip: () => void
  onDismissAll: () => void
}

/**
 * Shows inline indicator for current dirty chunk with ghost text preview
 */
export function DirtyChunkIndicator({
  dirtyChunk,
  queueProgress,
  onAccept,
  onSkip,
  onDismissAll,
}: DirtyChunkIndicatorProps) {
  const hasPatch = !!dirtyChunk.patch

  return (
    <div className="dirty-chunk-indicator">
      <div className="dirty-chunk-header">
        <span className="dirty-chunk-badge">
          {queueProgress.current} of {queueProgress.total} inconsistencies
        </span>
        <span className={`dirty-chunk-priority priority-${dirtyChunk.priority.toLowerCase()}`}>
          {dirtyChunk.priority}
        </span>
      </div>

      <div className="dirty-chunk-reason">{dirtyChunk.reason}</div>

      {hasPatch && dirtyChunk.patch && (
        <div className="dirty-chunk-preview">
          <div className="dirty-chunk-diff">
            <DiffDisplay before={dirtyChunk.patch.before} after={dirtyChunk.patch.after} />
          </div>
        </div>
      )}

      {!hasPatch && (
        <div className="dirty-chunk-loading">Generating suggestion...</div>
      )}

      <div className="dirty-chunk-actions">
        <button
          onClick={onAccept}
          disabled={!hasPatch}
          className="dirty-chunk-btn accept"
          title="Accept (Tab)"
        >
          Accept
        </button>
        <button onClick={onSkip} className="dirty-chunk-btn skip" title="Skip (Shift+Tab)">
          Skip
        </button>
        <button onClick={onDismissAll} className="dirty-chunk-btn dismiss" title="Dismiss all (Esc)">
          Dismiss All
        </button>
      </div>

      <div className="dirty-chunk-hint">
        Tab to accept • Shift+Tab to skip • Esc to dismiss
      </div>
    </div>
  )
}

/**
 * Simple diff display for before/after
 */
function DiffDisplay({ before, after }: { before: string; after: string }) {
  const diff = computeDiff(before, after)

  return (
    <div className="diff-inline">
      {diff.map((segment, index) => {
        if (segment.type === 'removed') {
          return (
            <span key={index} className="diff-removed">
              {segment.text}
            </span>
          )
        }
        if (segment.type === 'added') {
          return (
            <span key={index} className="diff-added">
              {segment.text}
            </span>
          )
        }
        return <span key={index}>{segment.text}</span>
      })}
    </div>
  )
}
