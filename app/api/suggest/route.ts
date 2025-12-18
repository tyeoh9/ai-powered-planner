import { anthropic } from '@ai-sdk/anthropic'
import { streamText } from 'ai'
import {
  DEFAULT_AI_MODEL,
  PLANNING_ASSISTANT_SYSTEM_PROMPT,
  generateImprovementPrompt,
} from '@/lib/constants'

export const runtime = 'edge'

/**
 * Creates an error response with proper headers
 */
function createErrorResponse(error: string, status: number = 500): Response {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

/**
 * Validates that the Anthropic API key is configured
 */
function validateApiKey(): boolean {
  return !!process.env.ANTHROPIC_API_KEY
}

/**
 * Gets the AI model to use, with fallback to default
 */
function getAiModel(): string {
  return process.env.ANTHROPIC_API_MODEL ?? DEFAULT_AI_MODEL
}

export async function POST(req: Request) {
  try {
    const { content } = await req.json()

    if (!validateApiKey()) {
      return createErrorResponse('ANTHROPIC_API_KEY is not configured')
    }

    const result = streamText({
      model: anthropic(getAiModel()),
      system: PLANNING_ASSISTANT_SYSTEM_PROMPT,
      prompt: generateImprovementPrompt(content),
      abortSignal: req.signal,
    })

    return result.toTextStreamResponse()
  } catch (error) {
    // Silently ignore aborted requests (user interrupted)
    if (error instanceof Error && error.name === 'AbortError') {
      return new Response(null, { status: 499 })
    }
    console.error('API Error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return createErrorResponse(message)
  }
}
