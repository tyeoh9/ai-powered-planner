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
  'mid-sentence': { maxTokens: 50, stopSequences: [] },
  'end-of-sentence': { maxTokens: 75, stopSequences: [] },
  'end-of-line': { maxTokens: 100, stopSequences: [] },
  'new-block': { maxTokens: 200, stopSequences: [] },
}

// AI System prompt for FIM completion
export const FIM_SYSTEM_PROMPT = `You are a text completion assistant. Complete the text at the cursor position.

CRITICAL: Output ONLY the completion text. NEVER output:
- Explanations or reasoning
- Descriptions of what you're doing
- Any text that isn't the actual completion

Your job: Generate ONLY the missing text between PREFIX and SUFFIX.

Rules:
- Do NOT repeat the prefix or suffix
- Output ONLY the new middle content
- Add spacing if needed (space at start if prefix doesn't end with space)
- Match surrounding style and tone
- Be concise
- PLAIN TEXT ONLY: No markdown. Use • for bullets. Plain text for headings.
- NEVER explain what you're doing - just output the completion`

/**
 * Generates the FIM prompt with prefix and suffix
 */
export function generateFIMPrompt(prefix: string, suffix: string): string {
  if (suffix.trim()) {
    return `PREFIX:"""${prefix}"""
SUFFIX:"""${suffix}"""
Generate the text that connects the prefix to the suffix. Output ONLY the middle content.`
  }
  return `PREFIX:"""${prefix}"""
Continue the text naturally. Output ONLY the continuation.`
}
