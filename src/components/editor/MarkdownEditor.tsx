import { useEffect, useRef, useState, useCallback } from 'react';
import { EditorState, Compartment } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter, drawSelection, rectangularSelection } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import { syntaxHighlighting, defaultHighlightStyle, bracketMatching, indentOnInput } from '@codemirror/language';
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search';
import { closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';
import { markdownToHtml } from './markdown-utils';
import { nordTheme, nordHighlightStyle } from './codemirror-theme';

export type EditorMode = 'write' | 'split' | 'preview';

interface MarkdownEditorProps {
  markdown: string;
  onChange: (md: string) => void;
  entryId: string;
  mode?: EditorMode;
  readOnly?: boolean;
  onEditorViewRef?: (view: EditorView | null) => void;
}

export function MarkdownEditor({
  markdown: initialMarkdown,
  onChange,
  entryId,
  mode = 'write',
  readOnly = false,
  onEditorViewRef,
}: MarkdownEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const readOnlyComp = useRef(new Compartment());
  const prevEntryId = useRef(entryId);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const [previewHtml, setPreviewHtml] = useState('');

  // Update preview HTML when content changes or mode changes
  const updatePreview = useCallback((md: string) => {
    if (mode === 'split' || mode === 'preview') {
      setPreviewHtml(markdownToHtml(md));
    }
  }, [mode]);

  // Create CodeMirror editor
  useEffect(() => {
    if (!editorRef.current) return;

    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        const doc = update.state.doc.toString();
        onChangeRef.current(doc);
        updatePreview(doc);
      }
    });

    const state = EditorState.create({
      doc: initialMarkdown,
      extensions: [
        nordTheme,
        syntaxHighlighting(nordHighlightStyle),
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        lineNumbers(),
        highlightActiveLine(),
        highlightActiveLineGutter(),
        drawSelection(),
        rectangularSelection(),
        bracketMatching(),
        closeBrackets(),
        indentOnInput(),
        highlightSelectionMatches(),
        history(),
        markdown({ base: markdownLanguage, codeLanguages: languages }),
        keymap.of([
          ...closeBracketsKeymap,
          ...defaultKeymap,
          ...searchKeymap,
          ...historyKeymap,
          indentWithTab,
        ]),
        updateListener,
        readOnlyComp.current.of(EditorState.readOnly.of(readOnly)),
        EditorView.lineWrapping,
      ],
    });

    const view = new EditorView({
      state,
      parent: editorRef.current,
    });

    viewRef.current = view;
    onEditorViewRef?.(view);

    // Initial preview
    updatePreview(initialMarkdown);

    return () => {
      onEditorViewRef?.(null);
      view.destroy();
      viewRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Mount once

  // Handle entry switch: replace content
  useEffect(() => {
    if (prevEntryId.current !== entryId && viewRef.current) {
      const view = viewRef.current;
      view.dispatch({
        changes: {
          from: 0,
          to: view.state.doc.length,
          insert: initialMarkdown,
        },
      });
      prevEntryId.current = entryId;
      updatePreview(initialMarkdown);
    }
  }, [entryId, initialMarkdown, updatePreview]);

  // Handle readOnly changes
  useEffect(() => {
    if (viewRef.current) {
      viewRef.current.dispatch({
        effects: readOnlyComp.current.reconfigure(EditorState.readOnly.of(readOnly)),
      });
    }
  }, [readOnly]);

  // Update preview when mode changes
  useEffect(() => {
    if (viewRef.current && (mode === 'split' || mode === 'preview')) {
      const doc = viewRef.current.state.doc.toString();
      setPreviewHtml(markdownToHtml(doc));
    }
  }, [mode]);

  const showEditor = mode === 'write' || mode === 'split';
  const showPreview = mode === 'preview' || mode === 'split';

  return (
    <div className="md-editor">
      <div className={`md-editor-body ${mode === 'split' ? 'md-editor-split' : ''}`}>
        {showEditor && (
          <div
            className={`md-editor-cm ${mode === 'split' ? 'md-editor-split-pane' : ''}`}
            ref={editorRef}
          />
        )}
        {showPreview && (
          <div
            className={`md-editor-preview ${mode === 'split' ? 'md-editor-split-pane' : ''}`}
            dangerouslySetInnerHTML={{ __html: previewHtml }}
          />
        )}
      </div>
    </div>
  );
}
