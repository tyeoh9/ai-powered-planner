import { anthropic } from '@ai-sdk/anthropic'
import { streamText } from 'ai'

export const runtime = 'edge'

export async function POST(req: Request) {
  try {
    const { content } = await req.json()

    if (!process.env.ANTHROPIC_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'ANTHROPIC_API_KEY is not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const result = streamText({
      model: anthropic(process.env.ANTHROPIC_API_MODEL ?? 'claude-haiku-4-5-20251001'),
      maxOutputTokens: 80,
      system: `You are a planning assistant that helps improve project planning documents.

Your job is to suggest edits to the document. You can:
- Add new content (like tech stack suggestions)
- Modify existing content to improve it
- Remove content that's no longer relevant

IMPORTANT: Return the COMPLETE edited document, not just the changes.

Guidelines:
- Keep the user's original intent and voice
- Be concise and practical
- If the document describes a project, you may suggest a tech stack
- If tech stack already exists and project scope changes, update the tech stack accordingly
- Write in plain text, no markdown formatting symbols
- Use bullet points (•) for lists`,
      prompt: `Here is the current document:

"""
${content}
"""

Suggest improvements or additions to this document. Return the complete edited version of the document.`,
    })

    return result.toTextStreamResponse()
  } catch (error) {
    console.error('API Error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
