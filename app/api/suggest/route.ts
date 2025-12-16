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
      system: `You are a planning assistant that helps generate tech stack suggestions for software projects.
When given a project description, suggest an appropriate tech stack.
Format your response as a concise markdown section.
Only suggest technologies that are relevant to the described project.
Keep suggestions brief and actionable.
Do not include any preamble or explanation - just output the tech stack section directly.`,
      prompt: `Based on this project description, suggest an appropriate tech stack:

"${content}"

Output a brief tech stack suggestion formatted exactly like this:

## Suggested Tech Stack

- **Frontend**: [technology]
- **Backend**: [technology]
- **Database**: [technology]
- **Key Libraries**: [libraries]`,
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
