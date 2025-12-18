import type { CursorContext } from '@/types'

/**
 * Application-wide constants and configuration values
 */

// Suggestion generation settings
export const SUGGESTION_DEBOUNCE_MS = 500
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

// FIM (Fill-in-the-Middle) configuration
// Note: Anthropic requires stop sequences to contain non-whitespace characters
export const FIM_CONFIG: Record<
  CursorContext,
  { maxTokens: number; stopSequences: string[] }
> = {
  'mid-sentence': { maxTokens: 20, stopSequences: ['. ', '! ', '? '] },
  'end-of-sentence': { maxTokens: 50, stopSequences: [] },
  'end-of-line': { maxTokens: 100, stopSequences: [] },
  'new-block': { maxTokens: 200, stopSequences: [] },
}

// AI System prompt for FIM completion
export const FIM_SYSTEM_PROMPT = `You are a planning assistant that completes text at the cursor position.

You will receive:
- PREFIX: Text before the cursor
- SUFFIX: Text after the cursor (if any)

Your job: Generate ONLY the text that goes between prefix and suffix.

CRITICAL RULES:
- Do NOT repeat any part of the prefix
- Do NOT repeat any part of the suffix
- Output ONLY the new middle content
- Include necessary spacing: if prefix ends without a space and your text starts with a word, begin with a space
- Stop naturally - don't over-generate
- Match the style and tone of surrounding text
- Be concise and practical
- Write in plain text, no markdown formatting symbols
- Use bullet points (•) for lists if appropriate`

/**
 * Generates the FIM prompt with prefix and suffix
 */
export function generateFIMPrompt(prefix: string, suffix: string): string {
  if (suffix.trim()) {
    return `PREFIX:
"""
${prefix}
"""

SUFFIX:
"""
${suffix}
"""

Generate the text that connects the prefix to the suffix. Output ONLY the middle content.`
  }

  return `PREFIX:
"""
${prefix}
"""

Continue the text naturally. Output ONLY the continuation.`
}
