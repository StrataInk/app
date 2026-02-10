import { useMemo } from 'react';
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
}

function filterLabel(filter: SidebarFilter): string {
  switch (filter.type) {
    case 'all': return 'All Notes';
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

export function NoteList({ entries, activeId, onSelect, onCreate, onPin, onUnpin, onTrash, filter }: NoteListProps) {
  const sorted = useMemo(() => {
    return [...entries].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return new Date(b.modified).getTime() - new Date(a.modified).getTime();
    });
  }, [entries]);

  const showActions = filter.type !== 'trash';

  return (
    <div className="notelist">
      <div className="notelist-header">
        <span className="notelist-info">
          {filterLabel(filter)} ({entries.length})
        </span>
        <div className="notelist-actions">
          {filter.type !== 'trash' && (
            <button className="btn btn-primary btn-sm" onClick={onCreate}>
              <Plus size={14} />
              New
            </button>
          )}
        </div>
      </div>
      <div className="notelist-body">
        {sorted.length === 0 ? (
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
          sorted.map(entry => (
            <div
              key={entry.id}
              className={`note-card${activeId === entry.id ? ' selected' : ''}`}
              onClick={() => onSelect(entry.id)}
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
                      title={entry.pinned ? 'Unpin' : 'Pin'}
                      onClick={(e) => { e.stopPropagation(); entry.pinned ? onUnpin(entry.id) : onPin(entry.id); }}
                    >
                      {entry.pinned ? <PinOff size={14} /> : <Pin size={14} />}
                    </button>
                    <button
                      className="note-card-action"
                      title="Trash"
                      onClick={(e) => { e.stopPropagation(); onTrash(entry.id); }}
                    >
                      <Trash2 size={14} />
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
