import { useState, useEffect, useRef, useMemo } from 'react';
import type { EntryMeta } from '../types';

interface CommandPaletteAction {
  id: string;
  label: string;
  category: 'action' | 'page';
  onExecute: () => void;
}

interface CommandPaletteProps {
  entries: EntryMeta[];
  onClose: () => void;
  onNewPage: () => void;
  onJumpToPage: (id: string) => void;
}

export function CommandPalette({ entries, onClose, onNewPage, onJumpToPage }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const actions: CommandPaletteAction[] = useMemo(() => {
    const staticActions: CommandPaletteAction[] = [
      { id: 'new-page', label: 'New Page', category: 'action', onExecute: onNewPage },
    ];

    const pageActions: CommandPaletteAction[] = entries
      .filter(e => !e.trashed)
      .map(e => ({
        id: `page-${e.id}`,
        label: e.title || 'Untitled',
        category: 'page' as const,
        onExecute: () => onJumpToPage(e.id),
      }));

    const all = [...staticActions, ...pageActions];
    if (!query.trim()) return all;

    const q = query.toLowerCase();
    return all.filter(a => a.label.toLowerCase().includes(q));
  }, [query, entries, onNewPage, onJumpToPage]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, actions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (actions[selectedIndex]) {
        actions[selectedIndex].onExecute();
        onClose();
      }
    }
  };

  // Scroll selected item into view
  useEffect(() => {
    const item = listRef.current?.children[selectedIndex] as HTMLElement | undefined;
    item?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  return (
    <div className="command-palette-overlay" onClick={onClose}>
      <div className="command-palette" onClick={e => e.stopPropagation()}>
        <input
          ref={inputRef}
          className="command-palette-input"
          type="text"
          placeholder="Type a command or page name..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <div className="command-palette-list" ref={listRef}>
          {actions.length === 0 ? (
            <div className="command-palette-empty">No results</div>
          ) : (
            actions.map((action, i) => (
              <div
                key={action.id}
                className={`command-palette-item${i === selectedIndex ? ' selected' : ''}`}
                onClick={() => {
                  action.onExecute();
                  onClose();
                }}
                onMouseEnter={() => setSelectedIndex(i)}
              >
                <span className="command-palette-item-label">{action.label}</span>
                <span className="command-palette-item-category">{action.category}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
