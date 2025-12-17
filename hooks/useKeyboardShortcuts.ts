'use client'

import { useEffect } from 'react'
import { KEYBOARD_SHORTCUTS } from '@/lib/constants'

interface KeyboardShortcutHandlers {
  onAccept: () => void
  onReject: () => void
}

/**
 * Sets up keyboard shortcuts for accepting/rejecting suggestions
 * Only active when shouldListen is true (e.g., when a suggestion is shown)
 */
export function useKeyboardShortcuts(
  shouldListen: boolean,
  handlers: KeyboardShortcutHandlers
): void {
  const { onAccept, onReject } = handlers

  useEffect(() => {
    if (!shouldListen) {
      return
    }

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === KEYBOARD_SHORTCUTS.ACCEPT_SUGGESTION) {
        event.preventDefault()
        onAccept()
      } else if (event.key === KEYBOARD_SHORTCUTS.REJECT_SUGGESTION) {
        event.preventDefault()
        onReject()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [shouldListen, onAccept, onReject])
}
