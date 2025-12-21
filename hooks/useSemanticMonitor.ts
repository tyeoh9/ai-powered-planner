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
        console.error('[AUDIT] Analyze API error:', response.status)
        return []
      }

      return await response.json()
    } catch (error) {
      if ((error as Error).name === 'AbortError') return []
      console.error('[AUDIT] Analyze error:', error)
      return []
    }
  }

  /**
   * Main audit function - called after accepting a suggestion
   * Simple flow: chunk → ask LLM which need updating → add to dirty queue
   */
  const auditAfterAccept = useCallback(
    async (oldContent: string, newContent: string, _editPosition: number) => {
      console.log('[AUDIT] Starting audit...')

      if (typeof window === 'undefined') return

      setIsAuditing(true)

      try {
        // 1. Chunk both old and new content
        const oldChunks = chunkDocument(oldContent)
        const newChunks = chunkDocument(newContent)
        console.log('[AUDIT] Chunks:', { old: oldChunks.length, new: newChunks.length })

        setChunks(newChunks)

        // 2. Find which chunk was modified
        const modifiedChunkIds = findModifiedChunkIds(oldChunks, newChunks)
        console.log('[AUDIT] Modified chunks:', modifiedChunkIds)

        if (modifiedChunkIds.length === 0) {
          console.log('[AUDIT] No modified chunks')
          setIsAuditing(false)
          return
        }

        // 3. Get the edited chunk content (before and after)
        const modifiedId = modifiedChunkIds[0]
        const editedChunkBefore = getChunkById(oldChunks, modifiedId)?.content || ''
        const editedChunkAfter = getChunkById(newChunks, modifiedId)?.content || ''

        console.log('[AUDIT] Edit:', {
          before: editedChunkBefore.slice(0, 50) + '...',
          after: editedChunkAfter.slice(0, 50) + '...',
        })

        // 4. Get all OTHER chunks (not the edited one)
        const otherChunks = newChunks
          .filter((c) => !modifiedChunkIds.includes(c.id))
          .map((c) => ({ chunkId: c.id, content: c.content }))

        console.log('[AUDIT] Other chunks to check:', otherChunks.length)

        if (otherChunks.length === 0) {
          console.log('[AUDIT] No other chunks to check')
          setIsAuditing(false)
          return
        }

        // 5. Ask LLM which chunks need updating
        console.log('[AUDIT] Calling analyze API...')
        const analyses = await analyzeChunks(editedChunkBefore, editedChunkAfter, otherChunks)
        console.log('[AUDIT] Analysis results:', analyses)

        // 6. Filter to only chunks that need updating
        const needsUpdate = analyses.filter((a) => a.conflictType === 'needs_update')
        console.log('[AUDIT] Chunks needing update:', needsUpdate.length)

        if (needsUpdate.length === 0) {
          console.log('[AUDIT] All chunks are consistent')
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

        console.log('[AUDIT] Dirty queue:', dirtyChunks.length)

        // 8. Store context for patch generation
        setPatchContext(
          `The user changed: "${editedChunkBefore.slice(0, 100)}..." to "${editedChunkAfter.slice(0, 100)}..."`
        )

        // 9. Set dirty queue
        setDirtyQueue(dirtyChunks)
      } catch (error) {
        console.error('[AUDIT] Error:', error)
      } finally {
        setIsAuditing(false)
      }
    },
    [setChunks, setDirtyQueue, setIsAuditing, setPatchContext]
  )

  /**
   * Debug audit - for testing via Check Consistency button
   * Uses lastEditPosition from store to find the anchor chunk
   */
  const debugAudit = useCallback(
    async (content: string) => {
      console.log('[DEBUG AUDIT] Starting...')

      if (typeof window === 'undefined') return

      setIsAuditing(true)

      try {
        const allChunks = chunkDocument(content)
        console.log('[DEBUG AUDIT] Total chunks:', allChunks.length)

        if (allChunks.length < 2) {
          console.log('[DEBUG AUDIT] Need at least 2 chunks')
          alert('Need at least 2 paragraphs to check consistency')
          setIsAuditing(false)
          return
        }

        setChunks(allChunks)

        // Find anchor chunk based on last edit position
        const { lastEditPosition } = useEditorStore.getState()
        const anchorChunk = allChunks.find(
          (c) => lastEditPosition >= c.startOffset && lastEditPosition <= c.endOffset
        ) || allChunks[0]

        const otherChunks = allChunks
          .filter((c) => c.id !== anchorChunk.id)
          .map((c) => ({
            chunkId: c.id,
            content: c.content,
          }))

        console.log('[DEBUG AUDIT] Anchor chunk:', anchorChunk.content.slice(0, 50))
        console.log('[DEBUG AUDIT] Checking', otherChunks.length, 'other chunks')

        // Ask LLM which chunks are inconsistent with the anchor chunk
        const analyses = await analyzeChunks('', anchorChunk.content, otherChunks)
        console.log('[DEBUG AUDIT] Analysis:', analyses)

        const needsUpdate = analyses.filter((a) => a.conflictType === 'needs_update')
        console.log('[DEBUG AUDIT] Need update:', needsUpdate.length)

        if (needsUpdate.length === 0) {
          alert('All chunks are consistent with the anchor paragraph')
          setIsAuditing(false)
          return
        }

        const dirtyChunks: DirtyChunk[] = needsUpdate.map((a) => {
          const chunk = getChunkById(allChunks, a.chunkId)
          return {
            chunkId: a.chunkId,
            priority: 'P0' as const,
            reason: a.details,
            similarity: 1,
            originalContent: chunk?.content || '',
            conflictAnalysis: a,
          }
        })

        setPatchContext(`Checking consistency with: "${anchorChunk.content.slice(0, 100)}..."`)
        setDirtyQueue(dirtyChunks)
      } catch (error) {
        console.error('[DEBUG AUDIT] Error:', error)
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
    debugAudit,
  }
}
