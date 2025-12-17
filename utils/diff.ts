import { DiffSegment } from '@/types'

/**
 * Computes word-level differences between two strings using the
 * Longest Common Subsequence (LCS) algorithm
 */
export function computeDiff(original: string, modified: string): DiffSegment[] {
  const originalTokens = tokenizeText(original)
  const modifiedTokens = tokenizeText(modified)
  const commonSequence = findLongestCommonSubsequence(originalTokens, modifiedTokens)

  const segments = buildDiffSegments(originalTokens, modifiedTokens, commonSequence)
  return mergeAdjacentSegments(segments)
}

/**
 * Builds diff segments by comparing original and modified tokens against
 * their longest common subsequence
 */
function buildDiffSegments(
  originalTokens: string[],
  modifiedTokens: string[],
  commonSequence: string[]
): DiffSegment[] {
  const segments: DiffSegment[] = []
  let originalIndex = 0
  let modifiedIndex = 0
  let commonIndex = 0

  while (originalIndex < originalTokens.length || modifiedIndex < modifiedTokens.length) {
    const originalMatchesCommon =
      commonIndex < commonSequence.length &&
      originalIndex < originalTokens.length &&
      originalTokens[originalIndex] === commonSequence[commonIndex]

    const modifiedMatchesCommon =
      commonIndex < commonSequence.length &&
      modifiedIndex < modifiedTokens.length &&
      modifiedTokens[modifiedIndex] === commonSequence[commonIndex]

    if (originalMatchesCommon && modifiedMatchesCommon) {
      // Both match the common sequence - text is unchanged
      appendSegment(segments, 'unchanged', originalTokens[originalIndex])
      originalIndex++
      modifiedIndex++
      commonIndex++
    } else if (!originalMatchesCommon && originalIndex < originalTokens.length) {
      // Original token doesn't match - it was removed
      appendSegment(segments, 'removed', originalTokens[originalIndex])
      originalIndex++
    } else if (!modifiedMatchesCommon && modifiedIndex < modifiedTokens.length) {
      // Modified token doesn't match - it was added
      appendSegment(segments, 'added', modifiedTokens[modifiedIndex])
      modifiedIndex++
    } else {
      // Edge case: advance both indices
      if (originalIndex < originalTokens.length) {
        appendSegment(segments, 'removed', originalTokens[originalIndex])
        originalIndex++
      }
      if (modifiedIndex < modifiedTokens.length) {
        appendSegment(segments, 'added', modifiedTokens[modifiedIndex])
        modifiedIndex++
      }
    }
  }

  return segments
}

/**
 * Splits text into tokens (words and whitespace characters)
 * Preserves whitespace for accurate diff reconstruction
 */
function tokenizeText(text: string): string[] {
  const tokens: string[] = []
  let currentWord = ''
  const whitespaceChars = new Set([' ', '\n', '\t'])

  for (const char of text) {
    if (whitespaceChars.has(char)) {
      if (currentWord) {
        tokens.push(currentWord)
        currentWord = ''
      }
      tokens.push(char)
    } else {
      currentWord += char
    }
  }

  if (currentWord) {
    tokens.push(currentWord)
  }

  return tokens
}

/**
 * Finds the longest common subsequence between two token arrays
 * using dynamic programming
 */
function findLongestCommonSubsequence(tokensA: string[], tokensB: string[]): string[] {
  const lengthA = tokensA.length
  const lengthB = tokensB.length

  // Build dynamic programming table
  const dpTable = createLCSTable(tokensA, tokensB)

  // Backtrack through table to reconstruct the LCS
  return backtrackLCS(tokensA, tokensB, dpTable)
}

/**
 * Creates the dynamic programming table for LCS computation
 */
function createLCSTable(tokensA: string[], tokensB: string[]): number[][] {
  const lengthA = tokensA.length
  const lengthB = tokensB.length
  const table: number[][] = Array(lengthA + 1)
    .fill(null)
    .map(() => Array(lengthB + 1).fill(0))

  for (let i = 1; i <= lengthA; i++) {
    for (let j = 1; j <= lengthB; j++) {
      if (tokensA[i - 1] === tokensB[j - 1]) {
        table[i][j] = table[i - 1][j - 1] + 1
      } else {
        table[i][j] = Math.max(table[i - 1][j], table[i][j - 1])
      }
    }
  }

  return table
}

/**
 * Reconstructs the LCS by backtracking through the DP table
 */
function backtrackLCS(tokensA: string[], tokensB: string[], dpTable: number[][]): string[] {
  const lcs: string[] = []
  let i = tokensA.length
  let j = tokensB.length

  while (i > 0 && j > 0) {
    if (tokensA[i - 1] === tokensB[j - 1]) {
      lcs.unshift(tokensA[i - 1])
      i--
      j--
    } else if (dpTable[i - 1][j] > dpTable[i][j - 1]) {
      i--
    } else {
      j--
    }
  }

  return lcs
}

/**
 * Appends a segment to the array, merging with the previous segment
 * if it has the same type
 */
function appendSegment(segments: DiffSegment[], type: DiffSegment['type'], text: string): void {
  const lastSegment = segments[segments.length - 1]

  if (lastSegment && lastSegment.type === type) {
    lastSegment.text += text
  } else {
    segments.push({ type, text })
  }
}

/**
 * Merges adjacent segments of the same type to reduce redundancy
 */
function mergeAdjacentSegments(segments: DiffSegment[]): DiffSegment[] {
  if (segments.length === 0) {
    return segments
  }

  const merged: DiffSegment[] = [segments[0]]

  for (let i = 1; i < segments.length; i++) {
    const lastMerged = merged[merged.length - 1]
    const currentSegment = segments[i]

    if (lastMerged.type === currentSegment.type) {
      lastMerged.text += currentSegment.text
    } else {
      merged.push(currentSegment)
    }
  }

  return merged
}

/**
 * Checks if the diff contains any actual changes (additions or removals)
 */
export function hasChanges(diff: DiffSegment[]): boolean {
  return diff.some((segment) => segment.type !== 'unchanged')
}
