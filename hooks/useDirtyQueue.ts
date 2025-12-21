'use client'

import { useCallback } from 'react'
import { useEditorStore } from '@/store/editor-store'
import { applyPatch } from '@/lib/chunk-patcher'
import { chunkDocument } from '@/lib/chunking'

/**
 * Hook for managing the dirty chunk queue
 * Handles accept/skip/clear operations
 */
export function useDirtyQueue() {
  const {
    content,
    setContent,
    chunks,
    setChunks,
    dirtyQueue,
    currentDirtyIndex,
    advanceDirtyQueue,
    clearDirtyQueue,
    setDirtyQueue,
  } = useEditorStore()

  /**
   * Get current dirty chunk (if any)
   */
  const currentDirtyChunk = dirtyQueue[currentDirtyIndex] || null

  /**
   * Check if we have active dirty queue
   */
  const hasDirtyQueue = dirtyQueue.length > 0

  /**
   * Get queue progress info
   */
  const queueProgress = {
    current: currentDirtyIndex + 1,
    total: dirtyQueue.length,
  }

  /**
   * Accept current patch and apply it to document
   */
  const acceptCurrentPatch = useCallback(() => {
    if (!currentDirtyChunk?.patch) {
      // No patch available, just advance
      advanceDirtyQueue()
      return
    }

    const chunk = chunks.find((c) => c.id === currentDirtyChunk.chunkId)
    if (!chunk) {
      advanceDirtyQueue()
      return
    }

    // Apply patch to content
    const newContent = applyPatch(content, chunk, currentDirtyChunk.patch)
    setContent(newContent)

    // Re-chunk and update
    const newChunks = chunkDocument(newContent)
    setChunks(newChunks)

    // Advance to next dirty chunk
    advanceDirtyQueue()
  }, [currentDirtyChunk, chunks, content, setContent, setChunks, advanceDirtyQueue])

  /**
   * Skip current chunk without applying patch
   */
  const skipCurrentPatch = useCallback(() => {
    advanceDirtyQueue()
  }, [advanceDirtyQueue])

  /**
   * Clear entire dirty queue
   */
  const dismissAllDirty = useCallback(() => {
    clearDirtyQueue()
  }, [clearDirtyQueue])

  /**
   * Update patch for a specific dirty chunk
   */
  const updateChunkPatch = useCallback(
    (chunkId: string, patch: { before: string; after: string }) => {
      const updatedQueue = dirtyQueue.map((d) =>
        d.chunkId === chunkId ? { ...d, patch } : d
      )
      setDirtyQueue(updatedQueue)
    },
    [dirtyQueue, setDirtyQueue]
  )

  return {
    currentDirtyChunk,
    hasDirtyQueue,
    queueProgress,
    acceptCurrentPatch,
    skipCurrentPatch,
    dismissAllDirty,
    updateChunkPatch,
  }
}
