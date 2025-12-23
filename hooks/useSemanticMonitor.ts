'use client'

import { useCallback } from 'react'
import { useEditorStore } from '@/store/editor-store'
import { chunkDocument, findModifiedChunkIds, getChunkById } from '@/lib/chunking'
import { generateChunkPatch } from '@/lib/chunk-patcher'
import type { DirtyChunk, ConflictAnalysis } from '@/types'

/**
 * Hook for semantic monitoring and consistency auditing
 * Uses LLM to check if chunks are consistent with edits
 */
export function useSemanticMonitor() {
  const {
    setChunks,
    setDirtyQueue,
    setIsAuditing,
    setPatchContext,
  } = useEditorStore()

  /**
   * Call analyze API to check which chunks need updating
   */
  const analyzeChunks = async (
    editedChunkBefore: string,
    editedChunkAfter: string,
    chunksToCheck: Array<{ chunkId: string; content: string }>,
    signal?: AbortSignal
  ): Promise<ConflictAnalysis[]> => {
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          editedChunkBefore,
          editedChunkAfter,
          chunks: chunksToCheck,
        }),
        signal,
      })

      if (!response.ok) {
        return []
      }

      return await response.json()
    } catch (error) {
      if ((error as Error).name === 'AbortError') return []
      return []
    }
  }

  /**
   * Main audit function - called after accepting a suggestion
   * Simple flow: chunk → ask LLM which need updating → add to dirty queue
   */
  const auditAfterAccept = useCallback(
    async (oldContent: string, newContent: string, _editPosition: number) => {
      if (typeof window === 'undefined') return

      setIsAuditing(true)

      try {
        // 1. Chunk both old and new content
        const oldChunks = chunkDocument(oldContent)
        const newChunks = chunkDocument(newContent)

        setChunks(newChunks)

        // 2. Find which chunk was modified
        const modifiedChunkIds = findModifiedChunkIds(oldChunks, newChunks)

        if (modifiedChunkIds.length === 0) {
          setIsAuditing(false)
          return
        }

        // 3. Get the edited chunk content (before and after)
        const modifiedId = modifiedChunkIds[0]
        const editedChunkBefore = getChunkById(oldChunks, modifiedId)?.content || ''
        const editedChunkAfter = getChunkById(newChunks, modifiedId)?.content || ''

        // 4. Get all OTHER chunks (not the edited one)
        const otherChunks = newChunks
          .filter((c) => !modifiedChunkIds.includes(c.id))
          .map((c) => ({ chunkId: c.id, content: c.content }))

        if (otherChunks.length === 0) {
          setIsAuditing(false)
          return
        }

        // 5. Ask LLM which chunks need updating
        const analyses = await analyzeChunks(editedChunkBefore, editedChunkAfter, otherChunks)

        // 6. Filter to only chunks that need updating
        const needsUpdate = analyses.filter((a) => a.conflictType === 'needs_update')

        if (needsUpdate.length === 0) {
          setIsAuditing(false)
          return
        }

        // 7. Create dirty queue
        const dirtyChunks: DirtyChunk[] = needsUpdate.map((a) => {
          const chunk = getChunkById(newChunks, a.chunkId)
          return {
            chunkId: a.chunkId,
            priority: 'P0' as const,
            reason: a.details,
            similarity: 1, // Not using similarity anymore
            originalContent: chunk?.content || '',
            conflictAnalysis: a,
          }
        })

        // 8. Store context for patch generation
        setPatchContext(
          `The user changed: "${editedChunkBefore.slice(0, 100)}..." to "${editedChunkAfter.slice(0, 100)}..."`
        )

        // 9. Set dirty queue
        setDirtyQueue(dirtyChunks)
      } finally {
        setIsAuditing(false)
      }
    },
    [setChunks, setDirtyQueue, setIsAuditing, setPatchContext]
  )

  /**
   * Generate patch for a specific dirty chunk
   */
  const generatePatchForChunk = useCallback(
    async (dirtyChunk: DirtyChunk, globalContext: string): Promise<DirtyChunk> => {
      const { chunks } = useEditorStore.getState()

      if (dirtyChunk.patch) {
        return dirtyChunk
      }

      const patch = await generateChunkPatch(dirtyChunk, chunks, globalContext)

      return {
        ...dirtyChunk,
        patch: patch || undefined,
      }
    },
    []
  )

  return {
    auditAfterAccept,
    generatePatchForChunk,
  }
}
