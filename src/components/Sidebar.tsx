import type { RefObject } from 'react';

export type View = 'notes' | 'observe' | 'settings';

export type SidebarFilter =
  | { type: 'all' }
  | { type: 'pinned' }
  | { type: 'archive' }
  | { type: 'trash' }
  | { type: 'notebook'; name: string }
  | { type: 'tag'; name: string }
  | { type: 'search'; query: string };

interface SidebarProps {
  filter: SidebarFilter;
  onFilterChange: (filter: SidebarFilter) => void;
  view: View;
  onViewChange: (view: View) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  notebooks: string[];
  tags: string[];
  searchInputRef: RefObject<HTMLInputElement | null>;
}

function isFilterActive(current: SidebarFilter, check: SidebarFilter): boolean {
  if (current.type !== check.type) return false;
  if (current.type === 'notebook' && check.type === 'notebook') return current.name === check.name;
  if (current.type === 'tag' && check.type === 'tag') return current.name === check.name;
  return true;
}

export function Sidebar({
  filter,
  onFilterChange,
  view,
  onViewChange,
  searchQuery,
  onSearchChange,
  notebooks,
  tags,
  searchInputRef,
}: SidebarProps) {
  const handleSearch = (value: string) => {
    onSearchChange(value);
    if (value.trim()) {
      onFilterChange({ type: 'search', query: value.trim() });
      onViewChange('notes');
    } else {
      onFilterChange({ type: 'all' });
    }
  };

  const handleFilterClick = (f: SidebarFilter) => {
    onFilterChange(f);
    onSearchChange('');
    onViewChange('notes');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">Strata</div>

      <div className="sidebar-search">
        <input
          ref={searchInputRef}
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onChange={e => handleSearch(e.target.value)}
        />
      </div>

      <div className="sidebar-body">
        {/* Navigation */}
        <div className="sidebar-section">
          <SidebarItem
            label="All Notes"
            active={view === 'notes' && isFilterActive(filter, { type: 'all' })}
            onClick={() => handleFilterClick({ type: 'all' })}
            icon={<IconNotes />}
          />
          <SidebarItem
            label="Pinned"
            active={view === 'notes' && isFilterActive(filter, { type: 'pinned' })}
            onClick={() => handleFilterClick({ type: 'pinned' })}
            icon={<IconPin />}
          />
          <SidebarItem
            label="Archive"
            active={view === 'notes' && isFilterActive(filter, { type: 'archive' })}
            onClick={() => handleFilterClick({ type: 'archive' })}
            icon={<IconArchive />}
          />
          <SidebarItem
            label="Trash"
            active={view === 'notes' && isFilterActive(filter, { type: 'trash' })}
            onClick={() => handleFilterClick({ type: 'trash' })}
            icon={<IconTrash />}
          />
        </div>

        {/* Notebooks */}
        {notebooks.length > 0 && (
          <div className="sidebar-section">
            <div className="sidebar-section-header">Notebooks</div>
            {notebooks.map(nb => (
              <SidebarItem
                key={nb}
                label={nb}
                active={view === 'notes' && isFilterActive(filter, { type: 'notebook', name: nb })}
                onClick={() => handleFilterClick({ type: 'notebook', name: nb })}
                icon={<IconNotebook />}
              />
            ))}
          </div>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <div className="sidebar-section">
            <div className="sidebar-section-header">Tags</div>
            {tags.map(tag => (
              <SidebarItem
                key={tag}
                label={`#${tag}`}
                active={view === 'notes' && isFilterActive(filter, { type: 'tag', name: tag })}
                onClick={() => handleFilterClick({ type: 'tag', name: tag })}
              />
            ))}
          </div>
        )}

        <div style={{ flex: 1 }} />

        <div className="sidebar-divider" />

        <SidebarItem
          label="Observe"
          active={view === 'observe'}
          onClick={() => onViewChange('observe')}
          icon={<IconObserve />}
        />
        <SidebarItem
          label="Settings"
          active={view === 'settings'}
          onClick={() => onViewChange('settings')}
          icon={<IconSettings />}
        />
      </div>

      <div className="sidebar-footer">v0.2.0</div>
    </aside>
  );
}

// ── Sidebar Item ─────────────────────────────────────────────────────

function SidebarItem({
  label,
  active,
  onClick,
  icon,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
}) {
  return (
    <div
      className={`sidebar-item${active ? ' active' : ''}`}
      onClick={onClick}
    >
      {icon && <span className="sidebar-item-icon">{icon}</span>}
      <span className="sidebar-item-label">{label}</span>
    </div>
  );
}

// ── Inline Icons (16x16, currentColor) ───────────────────────────────

function IconNotes() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="2" width="10" height="12" rx="1" />
      <line x1="5.5" y1="5" x2="10.5" y2="5" />
      <line x1="5.5" y1="7.5" x2="10.5" y2="7.5" />
      <line x1="5.5" y1="10" x2="8.5" y2="10" />
    </svg>
  );
}

function IconPin() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.5 2.5L13.5 6.5L10 10L9.5 13.5L6.5 10.5L2.5 14" />
      <path d="M6 6L2.5 2.5" />
      <line x1="6" y1="10" x2="10" y2="6" />
    </svg>
  );
}

function IconArchive() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="12" height="3" rx="0.5" />
      <path d="M3 6V12.5C3 12.7761 3.22386 13 3.5 13H12.5C12.7761 13 13 12.7761 13 12.5V6" />
      <line x1="6.5" y1="9" x2="9.5" y2="9" />
    </svg>
  );
}

function IconTrash() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 4.5H13" />
      <path d="M6 4.5V3C6 2.72386 6.22386 2.5 6.5 2.5H9.5C9.77614 2.5 10 2.72386 10 3V4.5" />
      <path d="M4.5 4.5L5 13H11L11.5 4.5" />
    </svg>
  );
}

function IconNotebook() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="9" height="12" rx="1" />
      <line x1="4" y1="2" x2="4" y2="14" />
      <line x1="3" y1="5" x2="5" y2="5" />
      <line x1="3" y1="8" x2="5" y2="8" />
      <line x1="3" y1="11" x2="5" y2="11" />
    </svg>
  );
}

function IconObserve() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="5.5" />
      <circle cx="8" cy="8" r="2" />
    </svg>
  );
}

function IconSettings() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="2" />
      <path d="M8 2V4M8 12V14M2 8H4M12 8H14M3.75 3.75L5.17 5.17M10.83 10.83L12.25 12.25M12.25 3.75L10.83 5.17M5.17 10.83L3.75 12.25" />
    </svg>
  );
}
