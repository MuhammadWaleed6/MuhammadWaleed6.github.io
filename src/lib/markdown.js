/**
 * Minimal, safe markdown-to-HTML for blog content.
 *
 * Supported: ## / ### headings, paragraphs, **bold**, *italic*, `code`,
 * [links](url), and blank-line paragraph separation.
 *
 * Safety: HTML in the source is escaped first, so stored content can never
 * inject markup (XSS) — only the markdown patterns below produce tags.
 * Only admins (RLS-enforced) can write content, but we stay safe anyway.
 */

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function inline(text) {
  return text
    // links [label](https://url) — https only, no javascript: URLs
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
}

export function markdownToHtml(markdown) {
  const blocks = String(markdown || '')
    .replace(/\r\n/g, '\n')
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean)

  return blocks
    .map((block) => {
      const h = block.match(/^(#{2,3})\s+(.+)$/)
      if (h) {
        const level = h[1].length // ## → h2, ### → h3
        return `<h${level}>${inline(escapeHtml(h[2]))}</h${level}>`
      }
      const paragraphs = block.split(/\n/).map((line) => `<p>${inline(escapeHtml(line.trim()))}</p>`)
      return paragraphs.join('')
    })
    .join('\n')
}
