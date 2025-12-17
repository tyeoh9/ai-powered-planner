/**
 * Application-wide constants and configuration values
 */

// Suggestion generation settings
export const SUGGESTION_DEBOUNCE_MS = 1000
export const MIN_CONTENT_LENGTH_FOR_SUGGESTION = 10

// API configuration
export const DEFAULT_AI_MODEL = 'claude-haiku-4-5-20251001'

// Keyboard shortcuts
export const KEYBOARD_SHORTCUTS = {
  ACCEPT_SUGGESTION: 'Tab',
  REJECT_SUGGESTION: 'Escape',
} as const

// Editor placeholder text
export const EDITOR_PLACEHOLDER =
  'Describe your project... (e.g., "My project is a social media app for dog owners")'

// AI System prompt for planning assistant
export const PLANNING_ASSISTANT_SYSTEM_PROMPT = `You are a planning assistant that helps improve project planning documents.

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
- Use bullet points (•) for lists`

/**
 * Generates the prompt for document improvement suggestions
 */
export function generateImprovementPrompt(content: string): string {
  return `Here is the current document:

"""
${content}
"""

Suggest improvements or additions to this document. Return the complete edited version of the document.`
}
