import { useState, useEffect, useRef, useCallback, type KeyboardEvent } from 'react';
import { Pin, PinOff, Trash2, RotateCcw, X } from 'lucide-react';
import type { Entry, Structure, Pressure } from '../types';
import { MarkdownEditor, type EditorMode } from '../components/editor/MarkdownEditor';
import type { RibbonCommand } from '../components/Ribbon';
import { DrawCanvas, type DrawTool } from '../components/DrawCanvas';

interface EditorViewProps {
  entry: Entry;
  notebooks: string[];
  onSave: (entry: Entry) => void;
  onTrash: (id: string) => void;
  onRestore: (id: string) => void;
  onDeletePermanently: (id: string) => void;
  onPin: (id: string) => void;
  onUnpin: (id: string) => void;
  editorMode: EditorMode;
  onRibbonCommandRef: (fn: (cmd: RibbonCommand) => void) => void;
  drawingActive: boolean;
}

const STRUCTURES: Structure[] = ['thought', 'idea', 'question', 'decision', 'system', 'insight'];
const PRESSURES: Pressure[] = ['low', 'medium', 'high'];

export function EditorView({
  entry,
  notebooks,
  onSave,
  onTrash,
  onRestore,
  onDeletePermanently,
  onPin,
  onUnpin,
  editorMode,
  onRibbonCommandRef,
  drawingActive,
}: EditorViewProps) {
  const [title, setTitle] = useState(entry.title);
  const [body, setBody] = useState(entry.body);
  const [structure, setStructure] = useState<Structure>(entry.structure);
  const [pressure, setPressure] = useState<Pressure>(entry.pressure);
  const [notebook, setNotebook] = useState(entry.notebook);
  const [tags, setTags] = useState<string[]>(entry.tags);
  const [tagInput, setTagInput] = useState('');
  const [drawTool, setDrawTool] = useState<DrawTool>('pen');
  const [drawColor, setDrawColor] = useState('#d8dee9');
  const [drawSize, setDrawSize] = useState(2);
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);

  // Reset state when entry changes
  useEffect(() => {
    setTitle(entry.title);
    setBody(entry.body);
    setStructure(entry.structure);
    setPressure(entry.pressure);
    setNotebook(entry.notebook);
    setTags(entry.tags);
    setTagInput('');
  }, [entry.id]);

  const queueSave = (updates: Partial<Entry>) => {
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      onSave({
        ...entry,
        title,
        body,
        structure,
        pressure,
        notebook,
        tags,
        ...updates,
      });
    }, 600);
  };

  const handleTitle = (val: string) => {
    setTitle(val);
    queueSave({ title: val });
  };

  const handleBody = (val: string) => {
    setBody(val);
    queueSave({ body: val });
  };

  const handleStructure = (val: Structure) => {
    setStructure(val);
    queueSave({ structure: val });
  };

  const handlePressure = (val: Pressure) => {
    setPressure(val);
    queueSave({ pressure: val });
  };

  const handleNotebook = (val: string) => {
    setNotebook(val);
    queueSave({ notebook: val });
  };

  const addTag = (tag: string) => {
    const t = tag.trim().toLowerCase();
    if (t && !tags.includes(t)) {
      const next = [...tags, t];
      setTags(next);
      queueSave({ tags: next });
    }
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    const next = tags.filter(t => t !== tag);
    setTags(next);
    queueSave({ tags: next });
  };

  const handleTagKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(tagInput);
    } else if (e.key === 'Backspace' && tagInput === '' && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  };

  // ── Ribbon Command Handler ─────────────────────────────────────────

  const handleRibbonCommand = useCallback((cmd: RibbonCommand) => {
    // TODO: Wire format/insert commands to CodeMirror when we have a ref
    // For now, handle insert commands by modifying body directly
    if (cmd.type === 'insert') {
      let snippet = '';
      switch (cmd.payload) {
        case 'table':
          snippet = '\n| Column 1 | Column 2 | Column 3 |\n|----------|----------|----------|\n| Cell     | Cell     | Cell     |\n';
          break;
        case 'link':
          snippet = '[link text](url)';
          break;
        case 'image':
          snippet = '![alt text](image-url)';
          break;
        case 'code-block':
          snippet = '\n```\ncode here\n```\n';
          break;
        case 'divider':
          snippet = '\n---\n';
          break;
        case 'date':
          snippet = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
          break;
      }
      if (snippet) {
        const newBody = body + snippet;
        setBody(newBody);
        queueSave({ body: newBody });
      }
    } else if (cmd.type === 'format') {
      // Wrap selection or append format markers
      let prefix = '';
      let suffix = '';
      switch (cmd.payload) {
        case 'bold': prefix = '**'; suffix = '**'; break;
        case 'italic': prefix = '_'; suffix = '_'; break;
        case 'underline': prefix = '<u>'; suffix = '</u>'; break;
        case 'strikethrough': prefix = '~~'; suffix = '~~'; break;
        case 'highlight': prefix = '=='; suffix = '=='; break;
        case 'h1': prefix = '\n# '; break;
        case 'h2': prefix = '\n## '; break;
        case 'h3': prefix = '\n### '; break;
        case 'bullet-list': prefix = '\n- '; break;
        case 'ordered-list': prefix = '\n1. '; break;
        case 'task-list': prefix = '\n- [ ] '; break;
        case 'paragraph': break;
      }
      if (prefix || suffix) {
        const newBody = body + prefix + (suffix ? 'text' + suffix : '');
        setBody(newBody);
        queueSave({ body: newBody });
      }
    } else if (cmd.type === 'draw-tool') {
      setDrawTool(cmd.payload as DrawTool);
    } else if (cmd.type === 'draw-color') {
      setDrawColor(cmd.payload!);
    } else if (cmd.type === 'draw-size') {
      setDrawSize(Number(cmd.payload));
    }
  }, [body]);

  useEffect(() => {
    onRibbonCommandRef(handleRibbonCommand);
  }, [handleRibbonCommand, onRibbonCommandRef]);

  if (entry.trashed) {
    return (
      <div className="editor">
        <input
          className="editor-title"
          type="text"
          value={title}
          disabled
        />
        <div className="editor-meta">
          <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>
            This note is in the trash.
          </span>
          <span style={{ flex: 1 }} />
          <button className="btn btn-primary btn-sm" onClick={() => onRestore(entry.id)}>
            <RotateCcw size={13} strokeWidth={1.5} />
            Restore
          </button>
          <button className="btn btn-danger btn-sm" onClick={() => onDeletePermanently(entry.id)}>
            <X size={13} strokeWidth={1.5} />
            Delete forever
          </button>
        </div>
        <MarkdownEditor
          markdown={body}
          onChange={() => {}}
          entryId={entry.id}
          mode="preview"
          readOnly
        />
      </div>
    );
  }

  return (
    <div className="editor" data-structure={structure} data-pressure={pressure} ref={editorContainerRef}>
      <input
        className="editor-title"
        type="text"
        placeholder="Untitled"
        value={title}
        onChange={e => handleTitle(e.target.value)}
        autoFocus
      />

      <div className="editor-chrome">
        <div className="editor-meta">
          <label>
            Structure
            <select value={structure} onChange={e => handleStructure(e.target.value as Structure)}>
              {STRUCTURES.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </label>
          <label>
            Pressure
            <select value={pressure} onChange={e => handlePressure(e.target.value as Pressure)}>
              {PRESSURES.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </label>
          <label>
            Notebook
            <input
              type="text"
              list="notebooks-list"
              placeholder="None"
              value={notebook}
              onChange={e => handleNotebook(e.target.value)}
            />
            <datalist id="notebooks-list">
              {notebooks.map(nb => (
                <option key={nb} value={nb} />
              ))}
            </datalist>
          </label>
          <span style={{ flex: 1 }} />
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => entry.pinned ? onUnpin(entry.id) : onPin(entry.id)}
          >
            {entry.pinned ? <PinOff size={13} strokeWidth={1.5} /> : <Pin size={13} strokeWidth={1.5} />}
            {entry.pinned ? 'Unpin' : 'Pin'}
          </button>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => onTrash(entry.id)}
          >
            <Trash2 size={13} strokeWidth={1.5} />
            Trash
          </button>
        </div>

        <div className="editor-meta">
          <label style={{ alignItems: 'flex-start' }}>
            Tags
            <div className="tag-input-wrap">
              {tags.map(tag => (
                <span key={tag} className="tag-chip">
                  #{tag}
                  <span className="tag-chip-remove" onClick={() => removeTag(tag)}>&times;</span>
                </span>
              ))}
              <input
                className="tag-input"
                type="text"
                placeholder="Add tag..."
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                onBlur={() => { if (tagInput.trim()) addTag(tagInput); }}
              />
            </div>
          </label>
        </div>
      </div>

      <div className="editor-canvas-wrap">
        <MarkdownEditor
          markdown={body}
          onChange={handleBody}
          entryId={entry.id}
          mode={editorMode}
        />
        {drawingActive && (
          <DrawCanvas tool={drawTool} color={drawColor} size={drawSize} />
        )}
      </div>
    </div>
  );
}
