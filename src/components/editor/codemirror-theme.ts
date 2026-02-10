import { EditorView } from '@codemirror/view';
import { HighlightStyle } from '@codemirror/language';
import { tags as t } from '@lezer/highlight';

export const strataTheme = EditorView.theme({
  '&': {
    color: 'var(--cm-text)',
    backgroundColor: 'transparent',
    fontSize: 'var(--editor-font-size, 16px)',
    fontFamily: 'var(--cm-font-family)',
  },
  '.cm-content': {
    caretColor: 'var(--cm-cursor)',
    padding: '4px 0 48px',
    lineHeight: 'var(--editor-line-height, 1.7)',
  },
  '.cm-cursor, .cm-dropCursor': {
    borderLeftColor: 'var(--cm-cursor)',
    borderLeftWidth: '1.5px',
  },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
    backgroundColor: 'var(--cm-selection)',
  },
  '.cm-panels': {
    backgroundColor: 'var(--cm-panel-bg)',
    color: 'var(--cm-text)',
  },
  '.cm-panels.cm-panels-top': {
    borderBottom: '1px solid var(--border)',
  },
  '.cm-panels.cm-panels-bottom': {
    borderTop: '1px solid var(--border)',
  },
  '.cm-searchMatch': {
    backgroundColor: 'var(--cm-search-match)',
    outline: '1px solid var(--cm-search-match-outline)',
  },
  '.cm-searchMatch.cm-searchMatch-selected': {
    backgroundColor: 'var(--cm-search-match-selected)',
  },
  '.cm-activeLine': {
    backgroundColor: 'var(--cm-active-line)',
  },
  '.cm-selectionMatch': {
    backgroundColor: 'var(--cm-selection-match)',
  },
  '&.cm-focused .cm-matchingBracket': {
    backgroundColor: 'var(--cm-matching-bracket)',
  },
  '&.cm-focused .cm-nonmatchingBracket': {
    backgroundColor: 'var(--cm-nonmatching-bracket)',
  },
  '.cm-gutters': {
    backgroundColor: 'transparent',
    color: 'var(--cm-gutter)',
    border: 'none',
    paddingRight: '8px',
  },
  '.cm-activeLineGutter': {
    backgroundColor: 'transparent',
    color: 'var(--cm-gutter-active)',
  },
  '.cm-foldPlaceholder': {
    backgroundColor: 'var(--cm-active-line)',
    color: 'var(--cm-gutter)',
    border: 'none',
  },
  '.cm-tooltip': {
    border: '1px solid var(--border)',
    backgroundColor: 'var(--cm-panel-bg)',
    color: 'var(--cm-text)',
  },
  '.cm-tooltip .cm-tooltip-arrow:before': {
    borderTopColor: 'var(--border)',
    borderBottomColor: 'var(--border)',
  },
  '.cm-tooltip .cm-tooltip-arrow:after': {
    borderTopColor: 'var(--cm-panel-bg)',
    borderBottomColor: 'var(--cm-panel-bg)',
  },
  '.cm-tooltip-autocomplete': {
    '& > ul > li[aria-selected]': {
      backgroundColor: 'var(--cm-selection)',
      color: 'var(--cm-text-bright)',
    },
  },
}, { dark: true });

export const strataHighlightStyle = HighlightStyle.define([
  { tag: t.keyword, color: 'var(--cm-keyword)' },
  { tag: [t.name, t.deleted, t.character, t.propertyName, t.macroName], color: 'var(--cm-text)' },
  { tag: [t.function(t.variableName), t.labelName], color: 'var(--cm-function)' },
  { tag: [t.color, t.constant(t.name), t.standard(t.name)], color: 'var(--cm-operator)' },
  { tag: [t.definition(t.name), t.separator], color: 'var(--cm-text)' },
  { tag: [t.typeName, t.className, t.number, t.changed, t.annotation, t.modifier, t.self, t.namespace], color: 'var(--cm-number)' },
  { tag: [t.operator, t.operatorKeyword, t.url, t.escape, t.regexp, t.link, t.special(t.string)], color: 'var(--cm-operator)' },
  { tag: [t.meta, t.comment], color: 'var(--cm-comment)', fontStyle: 'italic' },
  { tag: t.strong, fontWeight: 'bold', color: 'var(--cm-text-bright)' },
  { tag: t.emphasis, fontStyle: 'italic', color: 'var(--cm-text-bright)' },
  { tag: t.strikethrough, textDecoration: 'line-through' },
  { tag: t.link, color: 'var(--cm-link)', textDecoration: 'underline' },
  { tag: t.heading, fontWeight: 'bold', color: 'var(--cm-heading)' },
  { tag: [t.heading1, t.heading2], fontWeight: 'bold', color: 'var(--cm-heading)' },
  { tag: [t.heading3, t.heading4], fontWeight: 'bold', color: 'var(--cm-keyword)' },
  { tag: [t.heading5, t.heading6], color: 'var(--cm-keyword)' },
  { tag: [t.atom, t.bool, t.special(t.variableName)], color: 'var(--cm-atom)' },
  { tag: [t.processingInstruction, t.string, t.inserted], color: 'var(--cm-string)' },
  { tag: t.invalid, color: 'var(--cm-invalid)' },
  { tag: t.contentSeparator, color: 'var(--cm-comment)' },
  { tag: t.list, color: 'var(--cm-list)' },
  { tag: t.quote, color: 'var(--cm-quote)', fontStyle: 'italic' },
  { tag: t.monospace, color: 'var(--cm-monospace)' },
]);

// Keep old names as aliases for backward compatibility during migration
export const nordTheme = strataTheme;
export const nordHighlightStyle = strataHighlightStyle;
