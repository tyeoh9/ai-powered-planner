import { anthropic } from '@ai-sdk/anthropic'
import { streamText } from 'ai'
import { DEFAULT_AI_MODEL } from '@/lib/constants'
import type { ConflictAnalysis, CursorContext } from '@/types'

export const runtime = 'edge'

const PATCH_SYSTEM_PROMPT = `You are a document consistency assistant. Update text to match recent changes.

RULES:
- Output ONLY the updated text
- No explanations or metadata
- Preserve style, tone, formatting
- Minimal changes for consistency
- PLAIN TEXT ONLY (no markdown)
- Follow output length guidance in user prompt`

const POSITION_PROMPTS: Record<CursorContext, string> = {
  'mid-sentence': `OUTPUT LENGTH: Complete the current sentence naturally. 1-10 words max.
Do not start new sentences. Blend seamlessly.`,

  'end-of-sentence': `OUTPUT LENGTH: Generate 1-2 new sentences. 15-30 words.
Keep same style and tone.`,

  'end-of-line': `OUTPUT LENGTH: Generate 1-2 sentences at paragraph end. 15-30 words.`,

  'new-block': `OUTPUT LENGTH: Generate a new paragraph (2-4 sentences, 30-60 words).
Start fresh but maintain document consistency.`,
}

interface PatchRequest {
  chunkContent: string
  prefix: string
  suffix: string
  globalContext: string
  reason: string
  conflictAnalysis?: ConflictAnalysis
  cursorContext?: CursorContext
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

function buildPatchPrompt(req: PatchRequest): string {
  // Add position-based output length guidance
  const positionPrompt = req.cursorContext && POSITION_PROMPTS[req.cursorContext]
    ? POSITION_PROMPTS[req.cursorContext]
    : POSITION_PROMPTS['end-of-sentence']

  let prompt = `${positionPrompt}\n\nPRIMARY INTENT: ${req.globalContext}\nREASON: ${req.reason}\n\n`

  // Add conflict analysis with refactoring directives
  if (req.conflictAnalysis && req.conflictAnalysis.conflictType === 'needs_update') {
    const { conflictAnalysis: ca } = req
    prompt += `CONFLICT: ${ca.details}\n\n`

    // Add refactoring directives as explicit instructions
    if (ca.refactoringDirectives && ca.refactoringDirectives.length > 0) {
      prompt += `DIRECTIVES:\n`
      for (const directive of ca.refactoringDirectives) {
        if (directive.action === 'replace' && directive.replacement) {
          prompt += `  • REPLACE "${directive.target}" WITH "${directive.replacement}" — ${directive.rationale}\n`
        } else if (directive.action === 'rephrase') {
          prompt += `  • REPHRASE "${directive.target}" — ${directive.rationale}\n`
        } else if (directive.action === 'remove') {
          prompt += `  • REMOVE "${directive.target}" — ${directive.rationale}\n`
        } else if (directive.action === 'keep') {
          prompt += `  • KEEP "${directive.target}" unchanged — ${directive.rationale}\n`
        }
      }
      prompt += `\n`
    }
  }

  if (req.prefix.trim()) {
    prompt += `TEXT BEFORE:\n"""\n${req.prefix}\n"""\n\n`
  }

  prompt += `CHUNK TO UPDATE:\n"""\n${req.chunkContent}\n"""\n\n`

  if (req.suffix.trim()) {
    prompt += `TEXT AFTER:\n"""\n${req.suffix}\n"""\n\n`
  }

  prompt += `Output ONLY the updated text.`

  return prompt
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as PatchRequest

    if (!validateApiKey()) {
      return createErrorResponse('ANTHROPIC_API_KEY is not configured')
    }

    if (!body.chunkContent) {
      return createErrorResponse('Missing chunkContent', 400)
    }

    const result = streamText({
      model: anthropic(getAiModel()),
      system: PATCH_SYSTEM_PROMPT,
      prompt: buildPatchPrompt(body),
      maxOutputTokens: 600,
      abortSignal: req.signal,
    })

    return result.toTextStreamResponse()
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return new Response(null, { status: 499 })
    }
    console.error('Patch API Error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return createErrorResponse(message)
  }
}
