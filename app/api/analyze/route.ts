import { anthropic } from '@ai-sdk/anthropic'
import { generateObject } from 'ai'
import { z } from 'zod'
import { DEFAULT_AI_MODEL } from '@/lib/constants'
import { auth } from '@/lib/auth'
import type { ConflictAnalysis, ConflictType } from '@/types'

export const runtime = 'nodejs'

// Debug: log API key presence at module load
console.log('[analyze] ANTHROPIC_API_KEY at module load:', process.env.ANTHROPIC_API_KEY ? `${process.env.ANTHROPIC_API_KEY.slice(0, 20)}...` : 'NOT SET')

const ANALYZE_SYSTEM_PROMPT = `You are a document consistency analyzer. The user has made an edit to their document. Your job is to check if other parts of the document are now inconsistent with this edit.

IMPORTANT: Focus on LOGICAL consistency, not just word matching. For example:
- If user changes "React" to "Vue.js", any chunk mentioning React-specific concepts (useState, JSX syntax, etc.) needs updating
- If user changes "2023" to "2024", dates and timeframes may need updating
- If user changes a character's name, all references to that character need updating
- If user changes a technical approach, related explanations may be outdated

For each chunk, determine:
- needs_update: The chunk contains information that conflicts with or is inconsistent with the edit
- consistent: The chunk is fine as-is, no conflicts

Be thorough but precise. Only mark chunks that truly conflict.`

const ConflictAnalysisSchema = z.object({
  analyses: z.array(
    z.object({
      chunkId: z.string(),
      conflictType: z.enum(['needs_update', 'consistent']),
      reason: z.string().describe('Brief explanation of why this chunk needs/doesn\'t need updating'),
      suggestedChange: z.string().optional().describe('If needs_update, what should change'),
    })
  ),
})

interface AnalyzeRequest {
  // The change that was made
  editedChunkBefore: string
  editedChunkAfter: string
  // All other chunks to check
  chunks: Array<{
    chunkId: string
    content: string
  }>
}

function createErrorResponse(error: string, status: number = 500): Response {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function validateApiKey(): boolean {
  return !!process.env.ANTHROPIC_API_KEY
}

function getAiModel(): string {
  return process.env.ANTHROPIC_API_MODEL ?? DEFAULT_AI_MODEL
}

function buildAnalyzePrompt(req: AnalyzeRequest): string {
  let prompt = `THE EDIT THAT WAS MADE:

BEFORE:
"""
${req.editedChunkBefore || '(new content added)'}
"""

AFTER:
"""
${req.editedChunkAfter}
"""

OTHER CHUNKS TO CHECK FOR CONSISTENCY:
`

  for (const chunk of req.chunks) {
    prompt += `
---
Chunk ID: ${chunk.chunkId}
Content:
"""
${chunk.content}
"""
`
  }

  prompt += `
Analyze each chunk. Does it contain anything that now conflicts with or is inconsistent with the edit above?`

  return prompt
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session) {
      return createErrorResponse('Unauthorized', 401)
    }

    const body = (await req.json()) as AnalyzeRequest

    if (!validateApiKey()) {
      return createErrorResponse('ANTHROPIC_API_KEY is not configured')
    }

    if (!body.editedChunkAfter || !body.chunks || body.chunks.length === 0) {
      return createErrorResponse('Missing editedChunkAfter or chunks', 400)
    }

    const result = await generateObject({
      model: anthropic(getAiModel()),
      system: ANALYZE_SYSTEM_PROMPT,
      prompt: buildAnalyzePrompt(body),
      schema: ConflictAnalysisSchema,
      maxOutputTokens: 2000,
      abortSignal: req.signal,
    })

    const analyses: ConflictAnalysis[] = result.object.analyses.map((a) => ({
      chunkId: a.chunkId,
      conflictType: a.conflictType as ConflictType,
      details: a.reason,
      refactoringDirectives: a.suggestedChange
        ? [{ action: 'rephrase' as const, target: 'chunk', replacement: a.suggestedChange, rationale: a.reason }]
        : [],
    }))

    return new Response(JSON.stringify(analyses), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return new Response(null, { status: 499 })
    }
    console.error('Analyze API Error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return createErrorResponse(message)
  }
}
