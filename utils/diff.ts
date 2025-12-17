import { DiffSegment } from '@/types'

/**
 * Simple word-level diff algorithm
 * Computes the differences between two strings
 */
export function computeDiff(original: string, modified: string): DiffSegment[] {
  const originalWords = tokenize(original)
  const modifiedWords = tokenize(modified)

  // Use Longest Common Subsequence to find matches
  const lcs = computeLCS(originalWords, modifiedWords)

  const segments: DiffSegment[] = []
  let origIdx = 0
  let modIdx = 0
  let lcsIdx = 0

  while (origIdx < originalWords.length || modIdx < modifiedWords.length) {
    // Check if current positions match LCS
    const origMatchesLCS =
      lcsIdx < lcs.length && origIdx < originalWords.length && originalWords[origIdx] === lcs[lcsIdx]
    const modMatchesLCS =
      lcsIdx < lcs.length && modIdx < modifiedWords.length && modifiedWords[modIdx] === lcs[lcsIdx]

    if (origMatchesLCS && modMatchesLCS) {
      // Both match - unchanged
      addSegment(segments, 'unchanged', originalWords[origIdx])
      origIdx++
      modIdx++
      lcsIdx++
    } else if (!origMatchesLCS && origIdx < originalWords.length) {
      // Original doesn't match - it was removed
      addSegment(segments, 'removed', originalWords[origIdx])
      origIdx++
    } else if (!modMatchesLCS && modIdx < modifiedWords.length) {
      // Modified doesn't match - it was added
      addSegment(segments, 'added', modifiedWords[modIdx])
      modIdx++
    } else {
      // Edge case - just advance
      if (origIdx < originalWords.length) {
        addSegment(segments, 'removed', originalWords[origIdx])
        origIdx++
      }
      if (modIdx < modifiedWords.length) {
        addSegment(segments, 'added', modifiedWords[modIdx])
        modIdx++
      }
    }
  }

  return mergeSegments(segments)
}

/**
 * Tokenize string into words while preserving whitespace
 */
function tokenize(text: string): string[] {
  const tokens: string[] = []
  let current = ''

  for (const char of text) {
    if (char === ' ' || char === '\n' || char === '\t') {
      if (current) {
        tokens.push(current)
        current = ''
      }
      tokens.push(char)
    } else {
      current += char
    }
  }

  if (current) {
    tokens.push(current)
  }

  return tokens
}

/**
 * Compute Longest Common Subsequence
 */
function computeLCS(a: string[], b: string[]): string[] {
  const m = a.length
  const n = b.length

  // Create DP table
  const dp: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0))

  // Fill DP table
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1])
      }
    }
  }

  // Backtrack to find LCS
  const lcs: string[] = []
  let i = m
  let j = n

  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) {
      lcs.unshift(a[i - 1])
      i--
      j--
    } else if (dp[i - 1][j] > dp[i][j - 1]) {
      i--
    } else {
      j--
    }
  }

  return lcs
}

/**
 * Add a segment, merging with previous if same type
 */
function addSegment(segments: DiffSegment[], type: DiffSegment['type'], text: string) {
  const last = segments[segments.length - 1]
  if (last && last.type === type) {
    last.text += text
  } else {
    segments.push({ type, text })
  }
}

/**
 * Merge adjacent segments of the same type
 */
function mergeSegments(segments: DiffSegment[]): DiffSegment[] {
  if (segments.length === 0) return segments

  const merged: DiffSegment[] = [segments[0]]

  for (let i = 1; i < segments.length; i++) {
    const last = merged[merged.length - 1]
    const current = segments[i]

    if (last.type === current.type) {
      last.text += current.text
    } else {
      merged.push(current)
    }
  }

  return merged
}

/**
 * Check if there are any actual changes in the diff
 */
export function hasChanges(diff: DiffSegment[]): boolean {
  return diff.some((seg) => seg.type !== 'unchanged')
}
