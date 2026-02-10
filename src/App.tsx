import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Sidebar, type View, type SidebarFilter } from './components/Sidebar';
import { NoteList } from './components/NoteList';
import { TitleBar } from './components/TitleBar';
import { Ribbon, type RibbonTab, type RibbonCommand } from './components/Ribbon';
import { SectionTabs } from './components/SectionTabs';
import { EditorView } from './views/EditorView';
import { ObserveView } from './views/ObserveView';
import { SettingsView } from './views/SettingsView';
import type { EntryMeta, Entry } from './types';
import type { EditorMode } from './components/editor/MarkdownEditor';
import { getSectionsForNotebook, parseNotebookPath, buildNotebookPath } from './utils/notebook-hierarchy';
import { v4 as uuid } from 'uuid';

export default function App() {
  const [view, setView] = useState<View>('notes');
  const [filter, setFilter] = useState<SidebarFilter>({ type: 'all' });
  const [searchQuery, setSearchQuery] = useState('');
  const [entries, setEntries] = useState<EntryMeta[]>([]);
  const [activeEntry, setActiveEntry] = useState<Entry | null>(null);
  const [notebooks, setNotebooks] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);

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

  // Clear editor when section changes so page list feels fresh
  useEffect(() => {
    setActiveEntry(null);
  }, [selectedSection]);

  // ── Ribbon State ─────────────────────────────────────────────────────
  const [ribbonTab, setRibbonTab] = useState<RibbonTab>('home');
  const [ribbonCollapsed, setRibbonCollapsed] = useState(true);
  const [editorMode, setEditorMode] = useState<EditorMode>('write');
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

  // ── Entry Actions ──────────────────────────────────────────────────

  const openEntry = async (id: string) => {
    const entry = await window.strata.readEntry(id);
    if (entry) {
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
      structure: 'thought',
      pressure: 'low',
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
  }, [filter, selectedNotebook, selectedSection, loadEntries, loadMeta]);

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
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [createEntry]);

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
                entries={filteredEntries}
                activeId={activeEntry?.id ?? null}
                onSelect={openEntry}
                onCreate={createEntry}
                onPin={pinEntry}
                onUnpin={unpinEntry}
                onTrash={trashEntry}
                filter={filter}
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
    </div>
  );
}
