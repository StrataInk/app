import { EditorView } from '@codemirror/view';
import { HighlightStyle } from '@codemirror/language';
import { tags as t } from '@lezer/highlight';

// Nord palette
const nord1 = '#3b4252';
const nord2 = '#434c5e';
const nord3 = '#4c566a';
const nord4 = '#d8dee9';
const nord6 = '#eceff4';
const nord7 = '#8fbcbb';
const nord8 = '#88c0d0';
const nord9 = '#81a1c1';
const nord11 = '#bf616a';
const nord12 = '#d08770';
const nord13 = '#ebcb8b';
const nord14 = '#a3be8c';

export const nordTheme = EditorView.theme({
  '&': {
    color: nord4,
    backgroundColor: 'transparent',
    fontSize: '16px',
    fontFamily: "'Consolas', 'Monaco', 'Fira Code', monospace",
  },
  '.cm-content': {
    caretColor: nord4,
    padding: '4px 0 48px',
    lineHeight: '1.7',
  },
  '.cm-cursor, .cm-dropCursor': {
    borderLeftColor: nord4,
    borderLeftWidth: '1.5px',
  },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
    backgroundColor: 'rgba(129, 161, 193, 0.15)',
  },
  '.cm-panels': {
    backgroundColor: nord1,
    color: nord4,
  },
  '.cm-panels.cm-panels-top': {
    borderBottom: `1px solid ${nord2}`,
  },
  '.cm-panels.cm-panels-bottom': {
    borderTop: `1px solid ${nord2}`,
  },
  '.cm-searchMatch': {
    backgroundColor: 'rgba(136, 192, 208, 0.2)',
    outline: '1px solid rgba(136, 192, 208, 0.4)',
  },
  '.cm-searchMatch.cm-searchMatch-selected': {
    backgroundColor: 'rgba(136, 192, 208, 0.35)',
  },
  '.cm-activeLine': {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  '.cm-selectionMatch': {
    backgroundColor: 'rgba(136, 192, 208, 0.1)',
  },
  '&.cm-focused .cm-matchingBracket': {
    backgroundColor: 'rgba(136, 192, 208, 0.2)',
  },
  '&.cm-focused .cm-nonmatchingBracket': {
    backgroundColor: 'rgba(191, 97, 106, 0.2)',
  },
  '.cm-gutters': {
    backgroundColor: 'transparent',
    color: 'rgba(76, 86, 106, 0.4)',
    border: 'none',
    paddingRight: '8px',
  },
  '.cm-activeLineGutter': {
    backgroundColor: 'transparent',
    color: nord3,
  },
  '.cm-foldPlaceholder': {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    color: nord3,
    border: 'none',
  },
  '.cm-tooltip': {
    border: '1px solid rgba(255, 255, 255, 0.08)',
    backgroundColor: nord1,
    color: nord4,
  },
  '.cm-tooltip .cm-tooltip-arrow:before': {
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  '.cm-tooltip .cm-tooltip-arrow:after': {
    borderTopColor: nord1,
    borderBottomColor: nord1,
  },
  '.cm-tooltip-autocomplete': {
    '& > ul > li[aria-selected]': {
      backgroundColor: nord2,
      color: nord6,
    },
  },
}, { dark: true });

export const nordHighlightStyle = HighlightStyle.define([
  { tag: t.keyword, color: nord9 },
  { tag: [t.name, t.deleted, t.character, t.propertyName, t.macroName], color: nord4 },
  { tag: [t.function(t.variableName), t.labelName], color: nord8 },
  { tag: [t.color, t.constant(t.name), t.standard(t.name)], color: nord7 },
  { tag: [t.definition(t.name), t.separator], color: nord4 },
  { tag: [t.typeName, t.className, t.number, t.changed, t.annotation, t.modifier, t.self, t.namespace], color: nord13 },
  { tag: [t.operator, t.operatorKeyword, t.url, t.escape, t.regexp, t.link, t.special(t.string)], color: nord7 },
  { tag: [t.meta, t.comment], color: nord3, fontStyle: 'italic' },
  { tag: t.strong, fontWeight: 'bold', color: nord6 },
  { tag: t.emphasis, fontStyle: 'italic', color: nord6 },
  { tag: t.strikethrough, textDecoration: 'line-through' },
  { tag: t.link, color: nord8, textDecoration: 'underline' },
  { tag: t.heading, fontWeight: 'bold', color: nord8 },
  { tag: [t.heading1, t.heading2], fontWeight: 'bold', color: nord8 },
  { tag: [t.heading3, t.heading4], fontWeight: 'bold', color: nord9 },
  { tag: [t.heading5, t.heading6], color: nord9 },
  { tag: [t.atom, t.bool, t.special(t.variableName)], color: nord12 },
  { tag: [t.processingInstruction, t.string, t.inserted], color: nord14 },
  { tag: t.invalid, color: nord11 },
  // Markdown-specific
  { tag: t.contentSeparator, color: nord3 },
  { tag: t.list, color: nord12 },
  { tag: t.quote, color: nord3, fontStyle: 'italic' },
  { tag: t.monospace, color: nord7 },
]);
