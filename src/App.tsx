import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Sidebar, type View, type SidebarFilter } from './components/Sidebar';
import { NoteList } from './components/NoteList';
import { TitleBar } from './components/TitleBar';
import { Ribbon, type RibbonTab, type RibbonCommand } from './components/Ribbon';
import { SectionTabs } from './components/SectionTabs';
import { EditorView } from './views/EditorView';
import { CommandPalette } from './components/CommandPalette';
import { ObserveView } from './views/ObserveView';
import { SettingsView } from './views/SettingsView';
import { usePreferences } from './state/PreferencesContext';
import type { EntryMeta, Entry, Structure, Pressure } from './types';
import type { EditorMode } from './components/editor/MarkdownEditor';
import { getSectionsForNotebook, parseNotebookPath, buildNotebookPath } from './utils/notebook-hierarchy';
import { v4 as uuid } from 'uuid';

export default function App() {
  const { prefs } = usePreferences();
  const [view, setView] = useState<View>('notes');
  const [filter, setFilter] = useState<SidebarFilter>({ type: 'all' });
  const [searchQuery, setSearchQuery] = useState('');
  const [entries, setEntries] = useState<EntryMeta[]>([]);
  const [activeEntry, setActiveEntry] = useState<Entry | null>(null);
  const [notebooks, setNotebooks] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showDebugBar, setShowDebugBar] = useState(false);

  // ── Notebook / Section Hierarchy ──────────────────────────────────
  const [selectedNotebook, setSelectedNotebook] = useState<string | null>(null);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);

  const sectionsForNotebook = useMemo(() => {
    if (!selectedNotebook) return [];
    return getSectionsForNotebook(notebooks, selectedNotebook);
  }, [notebooks, selectedNotebook]);

  const handleNotebookSelect = (nb: string | null) => {
    setSelectedNotebook(nb);
    setSelectedSection(null);
  };

  // ── Ribbon State ─────────────────────────────────────────────────────
  const [ribbonTab, setRibbonTab] = useState<RibbonTab>('home');
  const [ribbonCollapsed, setRibbonCollapsed] = useState(true);
  const [editorMode, setEditorMode] = useState<EditorMode>(prefs.editorModeDefault);
  const [drawingActive, setDrawingActive] = useState(false);
  const ribbonCommandRef = useRef<((cmd: RibbonCommand) => void) | null>(null);

  const handleRibbonCommand = (cmd: RibbonCommand) => {
    ribbonCommandRef.current?.(cmd);
  };

  // ── Data Loading ───────────────────────────────────────────────────

  const loadEntries = useCallback(async () => {
    const list = await window.strata.listEntries();
    setEntries(list);
  }, []);

  const loadMeta = useCallback(async () => {
    const [nb, tg] = await Promise.all([
      window.strata.listNotebooks(),
      window.strata.listTags(),
    ]);
    setNotebooks(nb);
    setTags(tg);
  }, []);

  useEffect(() => {
    loadEntries();
    loadMeta();
  }, [loadEntries, loadMeta]);

  // ── Filtered Entries ───────────────────────────────────────────────

  const [searchResults, setSearchResults] = useState<EntryMeta[] | null>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (filter.type === 'search' && filter.query) {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
      searchTimeout.current = setTimeout(async () => {
        const results = await window.strata.searchEntries(filter.query);
        setSearchResults(results);
      }, 300);
    } else {
      setSearchResults(null);
    }
  }, [filter]);

  const filteredEntries = useMemo(() => {
    let base: EntryMeta[];

    if (filter.type === 'search') {
      base = searchResults ?? [];
    } else {
      base = entries.filter(e => {
        switch (filter.type) {
          case 'all':
            return !e.trashed && !e.archived;
          case 'pinned':
            return e.pinned && !e.trashed && !e.archived;
          case 'archive':
            return e.archived && !e.trashed;
          case 'trash':
            return e.trashed;
          case 'notebook':
            return e.notebook === filter.name && !e.trashed && !e.archived;
          case 'tag':
            return e.tags.includes(filter.name) && !e.trashed && !e.archived;
          default:
            return true;
        }
      });
    }

    // Apply notebook/section hierarchy filter
    if (selectedNotebook && (filter.type === 'all' || filter.type === 'pinned' || filter.type === 'archive')) {
      base = base.filter(e => {
        const { notebook, section } = parseNotebookPath(e.notebook);
        if (notebook !== selectedNotebook) return false;
        if (selectedSection && section !== selectedSection) return false;
        return true;
      });
    }

    return base;
  }, [entries, filter, searchResults, selectedNotebook, selectedSection]);

  const sortedEntries = useMemo(() => {
    return [...filteredEntries].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      const aOrder = a.sortOrder ?? Infinity;
      const bOrder = b.sortOrder ?? Infinity;
      if (aOrder !== Infinity || bOrder !== Infinity) {
        if (aOrder !== bOrder) return aOrder - bOrder;
      }
      return new Date(b.modified).getTime() - new Date(a.modified).getTime();
    });
  }, [filteredEntries]);

  // ── Selection Guard ─────────────────────────────────────────────────
  // If the active entry is no longer visible in the filtered list, clear it.
  // This replaces the old aggressive `setActiveEntry(null)` on section change.

  useEffect(() => {
    if (activeEntry && sortedEntries.length >= 0) {
      const stillVisible = sortedEntries.some(e => e.id === activeEntry.id);
      if (!stillVisible) setActiveEntry(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortedEntries]);

  // ── Entry Actions ──────────────────────────────────────────────────

  const openEntry = async (id: string) => {
    const entry = await window.strata.readEntry(id);
    if (entry) {
      // If entry is in a different notebook/section, switch context
      if (entry.notebook) {
        const { notebook, section } = parseNotebookPath(entry.notebook);
        if (notebook !== selectedNotebook) {
          setSelectedNotebook(notebook);
          setSelectedSection(section || null);
          // Ensure we're not stuck in a narrow filter
          if (filter.type === 'notebook' || filter.type === 'tag') {
            setFilter({ type: 'all' });
          }
        } else if (section && section !== selectedSection) {
          setSelectedSection(section || null);
        }
      }
      setActiveEntry(entry);
    }
  };

  const createEntry = useCallback(async () => {
    const now = new Date().toISOString();
    // Use selected notebook/section hierarchy for new entries
    let nb = '';
    if (filter.type === 'notebook') {
      nb = filter.name;
    } else if (selectedNotebook) {
      nb = buildNotebookPath(selectedNotebook, selectedSection ?? '');
    }
    const tg = filter.type === 'tag' ? [filter.name] : [];
    const entry: Entry = {
      id: uuid(),
      title: '',
      structure: prefs.defaultStructure as Structure,
      pressure: prefs.defaultPressure as Pressure,
      pinned: false,
      archived: false,
      trashed: false,
      notebook: nb,
      tags: tg,
      created: now,
      modified: now,
      body: '',
    };
    await window.strata.writeEntry(entry);
    setActiveEntry(entry);
    setView('notes');
    await loadEntries();
    await loadMeta();
  }, [filter, selectedNotebook, selectedSection, prefs.defaultStructure, prefs.defaultPressure, loadEntries, loadMeta]);

  const saveEntry = async (entry: Entry) => {
    await window.strata.writeEntry(entry);
    setActiveEntry(entry);
    await loadEntries();
    await loadMeta();
  };

  const trashEntry = async (id: string) => {
    await window.strata.trashEntry(id);
    setActiveEntry(null);
    await loadEntries();
  };

  const restoreEntry = async (id: string) => {
    await window.strata.restoreEntry(id);
    setActiveEntry(null);
    await loadEntries();
  };

  const deleteEntryPermanently = async (id: string) => {
    await window.strata.deleteEntryPermanently(id);
    setActiveEntry(null);
    await loadEntries();
    await loadMeta();
  };

  const pinEntry = async (id: string) => {
    await window.strata.pinEntry(id);
    if (activeEntry && activeEntry.id === id) {
      setActiveEntry({ ...activeEntry, pinned: true });
    }
    await loadEntries();
  };

  const unpinEntry = async (id: string) => {
    await window.strata.unpinEntry(id);
    if (activeEntry && activeEntry.id === id) {
      setActiveEntry({ ...activeEntry, pinned: false });
    }
    await loadEntries();
  };

  // ── Section Create / Rename ────────────────────────────────────────

  const handleCreateSection = useCallback(async (sectionName: string) => {
    if (!selectedNotebook || !sectionName.trim()) return;
    const nb = buildNotebookPath(selectedNotebook, sectionName.trim());
    const now = new Date().toISOString();
    const entry: Entry = {
      id: uuid(),
      title: '',
      structure: prefs.defaultStructure as Structure,
      pressure: prefs.defaultPressure as Pressure,
      pinned: false,
      archived: false,
      trashed: false,
      notebook: nb,
      tags: [],
      created: now,
      modified: now,
      body: '',
    };
    await window.strata.writeEntry(entry);
    await loadEntries();
    await loadMeta();
    setSelectedSection(sectionName.trim());
  }, [selectedNotebook, prefs.defaultStructure, prefs.defaultPressure, loadEntries, loadMeta]);

  const handleRenameSection = useCallback(async (oldName: string, newName: string) => {
    if (!selectedNotebook || !newName.trim() || oldName === newName) return;
    await window.strata.renameSection(selectedNotebook, oldName, newName.trim());
    await loadEntries();
    await loadMeta();
    if (selectedSection === oldName) {
      setSelectedSection(newName.trim());
    }
    // Fix: update activeEntry's notebook if it was in the renamed section
    if (activeEntry) {
      const oldPath = (!oldName || oldName === 'General') ? selectedNotebook : `${selectedNotebook}/${oldName}`;
      const newPath = (!newName.trim() || newName.trim() === 'General') ? selectedNotebook : `${selectedNotebook}/${newName.trim()}`;
      if (activeEntry.notebook === oldPath) {
        setActiveEntry({ ...activeEntry, notebook: newPath });
      }
    }
  }, [selectedNotebook, selectedSection, activeEntry, loadEntries, loadMeta]);

  // ── Page Reorder ──────────────────────────────────────────────────

  const handleReorder = useCallback(async (updates: { id: string; sortOrder: number }[]) => {
    await window.strata.reorderEntries(updates);
    await loadEntries();
  }, [loadEntries]);

  // ── Keyboard Navigation ──────────────────────────────────────────

  const navigateEntryList = useCallback((delta: number) => {
    if (sortedEntries.length === 0) return;
    const currentIndex = activeEntry
      ? sortedEntries.findIndex(e => e.id === activeEntry.id)
      : -1;
    let nextIndex: number;
    if (currentIndex === -1) {
      nextIndex = delta > 0 ? 0 : sortedEntries.length - 1;
    } else {
      nextIndex = currentIndex + delta;
      if (nextIndex < 0) nextIndex = 0;
      if (nextIndex >= sortedEntries.length) nextIndex = sortedEntries.length - 1;
    }
    const target = sortedEntries[nextIndex];
    if (target && target.id !== activeEntry?.id) {
      openEntry(target.id);
    }
  }, [sortedEntries, activeEntry, openEntry]);

  // ── Keyboard Shortcuts ─────────────────────────────────────────────

  useEffect(() => {
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;

      if (mod && e.key === 'n') {
        e.preventDefault();
        createEntry();
      } else if (mod && e.key === 'f') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (mod && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette(prev => !prev);
      } else if (e.altKey && e.key === 'ArrowUp') {
        e.preventDefault();
        navigateEntryList(-1);
      } else if (e.altKey && e.key === 'ArrowDown') {
        e.preventDefault();
        navigateEntryList(1);
      } else if (mod && e.key === 'Tab') {
        e.preventDefault();
        navigateEntryList(e.shiftKey ? -1 : 1);
      } else if (mod && e.shiftKey && e.key === 'D') {
        if (import.meta.env.DEV) {
          e.preventDefault();
          setShowDebugBar(prev => !prev);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [createEntry, navigateEntryList]);

  // ── Sync editing state to root for CSS ────────────────────────────

  useEffect(() => {
    const root = document.getElementById('root');
    if (root) {
      if (activeEntry) {
        root.setAttribute('data-editing', 'true');
      } else {
        root.removeAttribute('data-editing');
      }
    }
  }, [activeEntry]);

  // ── Render ─────────────────────────────────────────────────────────

  const showSectionTabs = view === 'notes' && selectedNotebook && sectionsForNotebook.length > 0;

  return (
    <div className="app-shell">
      <TitleBar
        ribbonCollapsed={ribbonCollapsed}
        onRibbonCollapse={setRibbonCollapsed}
        onRibbonTabActivate={setRibbonTab}
        activeRibbonTab={ribbonTab}
        hasActiveEntry={!!activeEntry && view === 'notes'}
      />
      <div className="app-body">
        <Sidebar
          filter={filter}
          onFilterChange={setFilter}
          view={view}
          onViewChange={setView}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          notebooks={notebooks}
          tags={tags}
          searchInputRef={searchInputRef}
          selectedNotebook={selectedNotebook}
          onNotebookSelect={handleNotebookSelect}
        />

        <div className="app-main">
          {showSectionTabs && (
            <SectionTabs
              sections={sectionsForNotebook}
              activeSection={selectedSection}
              onSectionSelect={setSelectedSection}
              onCreateSection={handleCreateSection}
              onRenameSection={handleRenameSection}
            />
          )}

          {view === 'notes' && activeEntry && (
            <Ribbon
              activeTab={ribbonTab}
              onCommand={handleRibbonCommand}
              editorMode={editorMode}
              onModeChange={setEditorMode}
              drawingActive={drawingActive}
              onDrawingToggle={() => setDrawingActive(prev => !prev)}
              collapsed={ribbonCollapsed}
            />
          )}

          {view === 'notes' ? (
            <div className="app-content">
              <NoteList
                entries={sortedEntries}
                activeId={activeEntry?.id ?? null}
                onSelect={openEntry}
                onCreate={createEntry}
                onPin={pinEntry}
                onUnpin={unpinEntry}
                onTrash={trashEntry}
                filter={filter}
                onReorder={handleReorder}
              />
              <div className="editor-pane">
                <div className="editor-pane-content">
                  {activeEntry ? (
                    <EditorView
                      entry={activeEntry}
                      notebooks={notebooks}
                      onSave={saveEntry}
                      onTrash={trashEntry}
                      onRestore={restoreEntry}
                      onDeletePermanently={deleteEntryPermanently}
                      onPin={pinEntry}
                      onUnpin={unpinEntry}
                      editorMode={editorMode}
                      onRibbonCommandRef={(fn) => { ribbonCommandRef.current = fn; }}
                      drawingActive={drawingActive}
                      sectionBreadcrumb={selectedNotebook ? { notebook: selectedNotebook, section: selectedSection } : undefined}
                      allEntries={entries}
                      onWikiNavigate={(id) => openEntry(id)}
                    />
                  ) : (
                    <div className="empty">
                      <p>Select a note or press <kbd>Ctrl+N</kbd> to create one.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="full-content">
              <div className="full-content-header">
                {view === 'observe' ? 'Observe' : 'Settings'}
              </div>
              <div className="full-content-body">
                {view === 'observe' && <ObserveView entries={entries} />}
                {view === 'settings' && <SettingsView />}
              </div>
            </div>
          )}
        </div>
      </div>
      {showCommandPalette && (
        <CommandPalette
          entries={entries}
          onClose={() => setShowCommandPalette(false)}
          onNewPage={() => { setShowCommandPalette(false); createEntry(); }}
          onJumpToPage={(id) => { setShowCommandPalette(false); openEntry(id); }}
        />
      )}
      {import.meta.env.DEV && showDebugBar && (
        <div className="debug-bar">
          <span>notebook: {selectedNotebook ?? '(none)'}</span>
          <span>section: {selectedSection ?? '(none)'}</span>
          <span>active: {activeEntry?.id?.slice(0, 8) ?? '(none)'}</span>
          <span>filter: {filter.type}{filter.type === 'notebook' || filter.type === 'tag' ? `:${filter.name}` : ''}</span>
          <span>entries: {entries.length}</span>
          <span>visible: {sortedEntries.length}</span>
        </div>
      )}
    </div>
  );
}
