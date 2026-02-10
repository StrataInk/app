import { marked, type TokenizerExtension, type RendererExtension } from 'marked';

// ── Marked: Markdown → HTML ─────────────────────────────────────────

const highlightExtension: TokenizerExtension & RendererExtension = {
  name: 'highlight',
  level: 'inline',
  start(src: string) {
    return src.indexOf('==');
  },
  tokenizer(src: string) {
    const match = src.match(/^==([^=]+)==/);
    if (match) {
      return {
        type: 'highlight',
        raw: match[0],
        text: match[1],
      };
    }
  },
  renderer(token) {
    return `<mark>${(token as unknown as { text: string }).text}</mark>`;
  },
};

marked.use({
  gfm: true,
  breaks: false,
  extensions: [highlightExtension],
});

// ── Public API ──────────────────────────────────────────────────────

export function markdownToHtml(md: string): string {
  if (!md || md.trim() === '') return '';
  return marked.parse(md, { async: false }) as string;
}

export function stripMarkdown(md: string): string {
  return md
    .replace(/^#{1,6}\s+/gm, '')       // headings
    .replace(/\*\*([^*]+)\*\*/g, '$1')  // bold
    .replace(/\*([^*]+)\*/g, '$1')      // italic
    .replace(/__([^_]+)__/g, '$1')      // bold alt
    .replace(/_([^_]+)_/g, '$1')        // italic alt
    .replace(/~~([^~]+)~~/g, '$1')      // strikethrough
    .replace(/==([^=]+)==/g, '$1')       // highlight
    .replace(/`([^`]+)`/g, '$1')        // inline code
    .replace(/```[\s\S]*?```/g, '')     // code blocks
    .replace(/!\[.*?\]\(.*?\)/g, '')    // images
    .replace(/\[([^\]]+)\]\(.*?\)/g, '$1') // links
    .replace(/^[-*+]\s+/gm, '')         // unordered lists
    .replace(/^\d+\.\s+/gm, '')         // ordered lists
    .replace(/^>\s+/gm, '')             // blockquotes
    .replace(/^---+$/gm, '')            // horizontal rules
    .replace(/- \[[ x]\]\s*/gm, '')     // task items
    .replace(/\n{2,}/g, '\n')           // collapse blank lines
    .trim();
}
