import { useState, useRef, useEffect } from 'react';
import { Plus, Pin, PinOff, Trash2 } from 'lucide-react';
import type { EntryMeta } from '../types';
import type { SidebarFilter } from './Sidebar';

interface NoteListProps {
  entries: EntryMeta[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onPin: (id: string) => void;
  onUnpin: (id: string) => void;
  onTrash: (id: string) => void;
  filter: SidebarFilter;
  onReorder?: (updates: { id: string; sortOrder: number }[]) => void;
}

function filterLabel(filter: SidebarFilter): string {
  switch (filter.type) {
    case 'all': return 'Pages';
    case 'pinned': return 'Pinned';
    case 'archive': return 'Archive';
    case 'trash': return 'Trash';
    case 'notebook': return filter.name;
    case 'tag': return `#${filter.name}`;
    case 'search': return `Search: ${filter.query}`;
  }
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const hours = diff / (1000 * 60 * 60);

  if (hours < 1) return 'Just now';
  if (hours < 24) return `${Math.floor(hours)}h ago`;
  if (hours < 48) return 'Yesterday';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function NoteList({ entries, activeId, onSelect, onCreate, onPin, onUnpin, onTrash, filter, onReorder }: NoteListProps) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);

  // Scroll active card into view (for keyboard navigation)
  useEffect(() => {
    if (!activeId || !bodyRef.current) return;
    const card = bodyRef.current.querySelector(`[data-entry-id="${activeId}"]`);
    if (card) {
      card.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [activeId]);

  const canDrag = filter.type !== 'trash' && !!onReorder;
  const showActions = filter.type !== 'trash';

  const handleDrop = (targetId: string) => {
    if (!dragId || dragId === targetId || !onReorder) return;
    const ids = entries.map(e => e.id);
    const fromIdx = ids.indexOf(dragId);
    const toIdx = ids.indexOf(targetId);
    if (fromIdx === -1 || toIdx === -1) return;
    const reordered = [...ids];
    reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, dragId);
    const updates = reordered.map((id, i) => ({ id, sortOrder: (i + 1) * 100 }));
    onReorder(updates);
  };

  return (
    <div className="notelist">
      <div className="notelist-header">
        <span className="notelist-info">
          {filterLabel(filter)} ({entries.length})
        </span>
        <div className="notelist-actions">
          {filter.type !== 'trash' && (
            <button className="btn btn-primary btn-sm" onClick={onCreate}>
              <Plus size={14} strokeWidth={1.5} />
              New
            </button>
          )}
        </div>
      </div>
      <div className="notelist-body" ref={bodyRef}>
        {entries.length === 0 ? (
          <div className="empty" style={{ minHeight: 200 }}>
            <p>
              {filter.type === 'trash'
                ? 'Trash is empty.'
                : filter.type === 'search'
                  ? 'No notes match your search.'
                  : 'No notes yet.'}
            </p>
          </div>
        ) : (
          entries.map(entry => (
            <div
              key={entry.id}
              data-entry-id={entry.id}
              className={`note-card${activeId === entry.id ? ' selected' : ''}${dragId === entry.id ? ' dragging' : ''}${dropTargetId === entry.id ? ' drop-target' : ''}`}
              data-structure={entry.structure}
              onClick={() => onSelect(entry.id)}
              draggable={canDrag}
              onDragStart={(e) => {
                setDragId(entry.id);
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', entry.id);
              }}
              onDragEnd={() => { setDragId(null); setDropTargetId(null); }}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                if (entry.id !== dragId) setDropTargetId(entry.id);
              }}
              onDragLeave={() => setDropTargetId(null)}
              onDrop={(e) => {
                e.preventDefault();
                setDropTargetId(null);
                handleDrop(entry.id);
                setDragId(null);
              }}
            >
              <div className="note-card-top">
                <span className="note-card-title">
                  {entry.title || 'Untitled'}
                </span>
                {entry.pinned && (
                  <Pin size={12} className="note-card-pin" />
                )}
              </div>
              <div className="note-card-bottom">
                <span className="note-card-structure" data-structure={entry.structure}>{entry.structure}</span>
                <span
                  className="note-card-pressure"
                  data-pressure={entry.pressure}
                />
                <span className="note-card-date">{formatDate(entry.modified)}</span>
                {showActions && (
                  <div className="note-card-actions">
                    <button
                      className="note-card-action"
                      onClick={(e) => { e.stopPropagation(); entry.pinned ? onUnpin(entry.id) : onPin(entry.id); }}
                    >
                      {entry.pinned ? <PinOff size={12} strokeWidth={1.5} /> : <Pin size={12} strokeWidth={1.5} />}
                      {entry.pinned ? 'Unpin' : 'Pin'}
                    </button>
                    <button
                      className="note-card-action note-card-action--danger"
                      onClick={(e) => { e.stopPropagation(); onTrash(entry.id); }}
                    >
                      <Trash2 size={12} strokeWidth={1.5} />
                      Trash
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
