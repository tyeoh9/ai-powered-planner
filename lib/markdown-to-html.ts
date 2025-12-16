/**
 * Convert simple markdown to HTML for TipTap insertion
 */
export function markdownToHtml(markdown: string): string {
  const lines = markdown.trim().split('\n')
  const htmlParts: string[] = []

  for (const line of lines) {
    const trimmed = line.trim()

    if (!trimmed) {
      htmlParts.push('<p></p>')
      continue
    }

    // ## Heading
    if (trimmed.startsWith('## ')) {
      htmlParts.push(`<h2>${trimmed.slice(3)}</h2>`)
      continue
    }

    // # Heading
    if (trimmed.startsWith('# ')) {
      htmlParts.push(`<h1>${trimmed.slice(2)}</h1>`)
      continue
    }

    // List item with bold: - **Label**: value
    if (trimmed.startsWith('- **')) {
      const match = trimmed.match(/^- \*\*(.+?)\*\*:?\s*(.*)$/)
      if (match) {
        htmlParts.push(`<li><strong>${match[1]}:</strong> ${match[2]}</li>`)
        continue
      }
    }

    // Regular list item: - text
    if (trimmed.startsWith('- ')) {
      htmlParts.push(`<li>${trimmed.slice(2)}</li>`)
      continue
    }

    // Regular paragraph - handle inline bold
    let text = trimmed
    text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    htmlParts.push(`<p>${text}</p>`)
  }

  // Wrap consecutive <li> items in <ul>
  let result = htmlParts.join('')
  result = result.replace(/(<li>.*?<\/li>)+/g, (match) => `<ul>${match}</ul>`)

  return result
}
