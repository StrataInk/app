import { useState, useEffect, useRef, type KeyboardEvent } from 'react';
import type { Entry, Structure, Pressure } from '../types';
import { MarkdownEditor, type EditorMode } from '../components/editor/MarkdownEditor';

interface EditorViewProps {
  entry: Entry;
  notebooks: string[];
  onSave: (entry: Entry) => void;
  onTrash: (id: string) => void;
  onRestore: (id: string) => void;
  onDeletePermanently: (id: string) => void;
  onPin: (id: string) => void;
  onUnpin: (id: string) => void;
}

const STRUCTURES: Structure[] = ['thought', 'idea', 'question', 'decision', 'system', 'insight'];
const PRESSURES: Pressure[] = ['low', 'medium', 'high'];
const MODES: EditorMode[] = ['write', 'split', 'preview'];

export function EditorView({
  entry,
  notebooks,
  onSave,
  onTrash,
  onRestore,
  onDeletePermanently,
  onPin,
  onUnpin,
}: EditorViewProps) {
  const [title, setTitle] = useState(entry.title);
  const [body, setBody] = useState(entry.body);
  const [structure, setStructure] = useState<Structure>(entry.structure);
  const [pressure, setPressure] = useState<Pressure>(entry.pressure);
  const [notebook, setNotebook] = useState(entry.notebook);
  const [tags, setTags] = useState<string[]>(entry.tags);
  const [tagInput, setTagInput] = useState('');
  const [editorMode, setEditorMode] = useState<EditorMode>('write');
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

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
            Restore
          </button>
          <button className="btn btn-danger btn-sm" onClick={() => onDeletePermanently(entry.id)}>
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
    <div className="editor">
      <input
        className="editor-title"
        type="text"
        placeholder="Untitled"
        value={title}
        onChange={e => handleTitle(e.target.value)}
        autoFocus
      />

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
          title={entry.pinned ? 'Unpin' : 'Pin'}
        >
          {entry.pinned ? 'Unpin' : 'Pin'}
        </button>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => onTrash(entry.id)}
        >
          Trash
        </button>
      </div>

      {/* Tags */}
      <div className="editor-meta" style={{ marginBottom: 12 }}>
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

      {/* Mode Toggle */}
      <div className="md-editor-mode-toggle">
        {MODES.map(m => (
          <button
            key={m}
            className={`md-mode-btn ${editorMode === m ? 'active' : ''}`}
            onClick={() => setEditorMode(m)}
            type="button"
          >
            {m.charAt(0).toUpperCase() + m.slice(1)}
          </button>
        ))}
      </div>

      <MarkdownEditor
        markdown={body}
        onChange={handleBody}
        entryId={entry.id}
        mode={editorMode}
      />
    </div>
  );
}
