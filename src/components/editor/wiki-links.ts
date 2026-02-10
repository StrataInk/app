import {
  EditorView,
  Decoration,
  type DecorationSet,
  ViewPlugin,
  type ViewUpdate,
} from '@codemirror/view';
import { RangeSetBuilder } from '@codemirror/state';
import {
  autocompletion,
  type CompletionContext,
  type CompletionResult,
} from '@codemirror/autocomplete';

const WIKI_LINK_RE = /\[\[([^\]]+)\]\]/g;

const wikiLinkMark = Decoration.mark({ class: 'cm-wiki-link' });

function buildDecorations(view: EditorView): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();
  for (const { from, to } of view.visibleRanges) {
    const text = view.state.sliceDoc(from, to);
    WIKI_LINK_RE.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = WIKI_LINK_RE.exec(text)) !== null) {
      const start = from + match.index;
      const end = start + match[0].length;
      builder.add(start, end, wikiLinkMark);
    }
  }
  return builder.finish();
}

const wikiLinkDecorations = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;
    constructor(view: EditorView) {
      this.decorations = buildDecorations(view);
    }
    update(update: ViewUpdate) {
      if (update.docChanged || update.viewportChanged) {
        this.decorations = buildDecorations(update.view);
      }
    }
  },
  { decorations: (v) => v.decorations }
);

export function wikiLinksExtension(
  getPageTitles: () => { title: string; id: string }[],
  onNavigate: (id: string) => void
) {
  const wikiLinkCompletion = autocompletion({
    override: [
      (context: CompletionContext): CompletionResult | null => {
        const line = context.state.doc.lineAt(context.pos);
        const textBefore = line.text.slice(0, context.pos - line.from);
        const bracketIdx = textBefore.lastIndexOf('[[');
        if (bracketIdx === -1) return null;

        const afterBracket = textBefore.slice(bracketIdx + 2);
        if (afterBracket.includes(']]')) return null;

        const from = line.from + bracketIdx + 2;
        const query = afterBracket.toLowerCase();

        const pages = getPageTitles();
        const options = pages
          .filter(p => p.title && p.title.toLowerCase().includes(query))
          .map(p => ({
            label: p.title,
            apply: p.title + ']]',
          }));

        return {
          from,
          to: context.pos,
          options,
          filter: false,
        };
      },
    ],
  });

  const clickHandler = EditorView.domEventHandlers({
    click(event: MouseEvent, view: EditorView) {
      if (!event.ctrlKey && !event.metaKey) return false;

      const pos = view.posAtCoords({ x: event.clientX, y: event.clientY });
      if (pos === null) return false;

      const line = view.state.doc.lineAt(pos);
      const text = line.text;
      WIKI_LINK_RE.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = WIKI_LINK_RE.exec(text)) !== null) {
        const start = line.from + match.index;
        const end = start + match[0].length;
        if (pos >= start && pos <= end) {
          const linkTitle = match[1];
          const pages = getPageTitles();
          const target = pages.find(
            p => p.title.toLowerCase() === linkTitle.toLowerCase()
          );
          if (target) {
            event.preventDefault();
            onNavigate(target.id);
            return true;
          }
        }
      }
      return false;
    },
  });

  return [wikiLinkDecorations, wikiLinkCompletion, clickHandler];
}
