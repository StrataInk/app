import { useEffect, useRef, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { NoteList } from './components/NoteList';
import { TitleBar } from './components/TitleBar';
import { Ribbon, type RibbonCommand } from './components/Ribbon';
import { SectionTabs } from './components/SectionTabs';
import { EditorView } from './views/EditorView';
import { CommandPalette } from './components/CommandPalette';
import { ObserveView } from './views/ObserveView';
import { SettingsView } from './views/SettingsView';
import { StatusBar } from './components/StatusBar';
import { useAppStore, useSortedEntries, useSectionsForNotebook } from './state/store';

export default function App() {
  // ── Store state ────────────────────────────────────────────────────
  const view = useAppStore(s => s.view);
  const filter = useAppStore(s => s.filter);
  const activeEntry = useAppStore(s => s.activeEntry);
  const entries = useAppStore(s => s.entries);
  const selectedNotebook = useAppStore(s => s.selectedNotebook);
  const selectedSection = useAppStore(s => s.selectedSection);
  const editorMode = useAppStore(s => s.editorMode);
  const ribbonTab = useAppStore(s => s.ribbonTab);
  const ribbonCollapsed = useAppStore(s => s.ribbonCollapsed);
  const drawingActive = useAppStore(s => s.drawingActive);
  const showCommandPalette = useAppStore(s => s.showCommandPalette);
  const showDebugBar = useAppStore(s => s.showDebugBar);
  const sidebarCollapsed = useAppStore(s => s.sidebarCollapsed);
  const saveStatus = useAppStore(s => s.saveStatus);
  const lastAction = useAppStore(s => s.lastAction);
  const notebooks = useAppStore(s => s.notebooks);

  // ── Store actions ──────────────────────────────────────────────────
  const loadEntries = useAppStore(s => s.loadEntries);
  const loadMeta = useAppStore(s => s.loadMeta);
  const openEntry = useAppStore(s => s.openEntry);
  const createEntry = useAppStore(s => s.createEntry);
  const saveEntry = useAppStore(s => s.saveEntry);
  const trashEntry = useAppStore(s => s.trashEntry);
  const restoreEntry = useAppStore(s => s.restoreEntry);
  const deleteEntryPermanently = useAppStore(s => s.deleteEntryPermanently);
  const pinEntry = useAppStore(s => s.pinEntry);
  const unpinEntry = useAppStore(s => s.unpinEntry);
  const createSection = useAppStore(s => s.createSection);
  const renameSection = useAppStore(s => s.renameSection);
  const reorderEntries = useAppStore(s => s.reorderEntries);
  const setEditorMode = useAppStore(s => s.setEditorMode);
  const setRibbonTab = useAppStore(s => s.setRibbonTab);
  const setRibbonCollapsed = useAppStore(s => s.setRibbonCollapsed);
  const setSelectedSection = useAppStore(s => s.setSelectedSection);
  const setActiveEntry = useAppStore(s => s.setActiveEntry);

  // ── Derived state ──────────────────────────────────────────────────
  const sortedEntries = useSortedEntries();
  const sectionsForNotebook = useSectionsForNotebook();

  // ── Refs ────────────────────────────────────────────────────────────
  const searchInputRef = useRef<HTMLInputElement>(null);
  const ribbonCommandRef = useRef<((cmd: RibbonCommand) => void) | null>(null);

  const handleRibbonCommand = (cmd: RibbonCommand) => {
    ribbonCommandRef.current?.(cmd);
  };

  // ── Initial data load ──────────────────────────────────────────────
  useEffect(() => {
    loadEntries();
    loadMeta();
  }, [loadEntries, loadMeta]);

  // ── Search debounce ────────────────────────────────────────────────
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const setSearchResults = useAppStore(s => s.setSearchResults);

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
  }, [filter, setSearchResults]);

  // ── Selection Guard ────────────────────────────────────────────────
  useEffect(() => {
    if (activeEntry && sortedEntries.length >= 0) {
      const stillVisible = sortedEntries.some(e => e.id === activeEntry.id);
      if (!stillVisible) setActiveEntry(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortedEntries]);

  // ── Navigation ─────────────────────────────────────────────────────
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
  const toggleCommandPalette = useAppStore(s => s.toggleCommandPalette);
  const toggleDebugBar = useAppStore(s => s.toggleDebugBar);

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
        toggleCommandPalette();
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
          toggleDebugBar();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [createEntry, navigateEntryList, toggleCommandPalette, toggleDebugBar]);

  // ── Sync editing state to root for CSS ─────────────────────────────
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
        onToggleSidebar={() => useAppStore.getState().toggleSidebar()}
      />
      <div className="app-body">
        <Sidebar searchInputRef={searchInputRef} collapsed={sidebarCollapsed} />

        <div className="app-main">
          {showSectionTabs && (
            <SectionTabs
              sections={sectionsForNotebook}
              activeSection={selectedSection}
              onSectionSelect={setSelectedSection}
              onCreateSection={createSection}
              onRenameSection={renameSection}
            />
          )}

          {view === 'notes' && activeEntry && (
            <Ribbon
              activeTab={ribbonTab}
              onCommand={handleRibbonCommand}
              editorMode={editorMode}
              onModeChange={setEditorMode}
              drawingActive={drawingActive}
              onDrawingToggle={() => useAppStore.getState().toggleDrawing()}
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
                onReorder={reorderEntries}
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
      {activeEntry && view === 'notes' && <StatusBar />}
      {showCommandPalette && <CommandPalette />}
      {import.meta.env.DEV && showDebugBar && (
        <div className="debug-bar">
          <span>notebook: {selectedNotebook ?? '(none)'}</span>
          <span>section: {selectedSection ?? '(none)'}</span>
          <span>active: {activeEntry?.id?.slice(0, 8) ?? '(none)'}</span>
          <span>filter: {filter.type}{filter.type === 'notebook' || filter.type === 'tag' ? `:${filter.name}` : ''}</span>
          <span>entries: {entries.length}</span>
          <span>visible: {sortedEntries.length}</span>
          <span>save: {saveStatus}</span>
          <span>last: {lastAction}</span>
        </div>
      )}
    </div>
  );
}
