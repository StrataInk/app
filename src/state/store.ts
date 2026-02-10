import { create } from 'zustand';
import { useMemo } from 'react';
import type { EntryMeta, Entry, Structure, Pressure } from '../types';
import type { EditorMode } from '../components/editor/MarkdownEditor';
import type { RibbonTab } from '../components/Ribbon';
import { getSectionsForNotebook, parseNotebookPath, buildNotebookPath } from '../utils/notebook-hierarchy';
import { loadPreferences } from './preferences';
import { v4 as uuid } from 'uuid';

// ── Shared navigation types (moved from Sidebar.tsx) ─────────────────

export type View = 'notes' | 'observe' | 'settings';

export type SidebarFilter =
  | { type: 'all' }
  | { type: 'pinned' }
  | { type: 'archive' }
  | { type: 'trash' }
  | { type: 'notebook'; name: string }
  | { type: 'tag'; name: string }
  | { type: 'search'; query: string };

// ── Store Interface ──────────────────────────────────────────────────

interface AppState {
  // Navigation
  view: View;
  filter: SidebarFilter;
  searchQuery: string;
  selectedNotebook: string | null;
  selectedSection: string | null;

  // Data
  entries: EntryMeta[];
  activeEntry: Entry | null;
  notebooks: string[];
  tags: string[];
  searchResults: EntryMeta[] | null;

  // Editor
  editorMode: EditorMode;
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
  lastAction: string;

  // UI
  showCommandPalette: boolean;
  showDebugBar: boolean;
  ribbonTab: RibbonTab;
  ribbonCollapsed: boolean;
  sidebarCollapsed: boolean;
  drawingActive: boolean;
}

interface AppActions {
  // Data loading
  loadEntries: () => Promise<void>;
  loadMeta: () => Promise<void>;

  // Entry operations
  openEntry: (id: string) => Promise<void>;
  createEntry: () => Promise<void>;
  saveEntry: (entry: Entry) => Promise<void>;
  trashEntry: (id: string) => Promise<void>;
  restoreEntry: (id: string) => Promise<void>;
  deleteEntryPermanently: (id: string) => Promise<void>;
  pinEntry: (id: string) => Promise<void>;
  unpinEntry: (id: string) => Promise<void>;

  // Section operations
  createSection: (name: string) => Promise<void>;
  renameSection: (oldName: string, newName: string) => Promise<void>;
  reorderEntries: (updates: { id: string; sortOrder: number }[]) => Promise<void>;

  // Setters
  setView: (view: View) => void;
  setFilter: (filter: SidebarFilter) => void;
  setSearchQuery: (query: string) => void;
  setSelectedNotebook: (nb: string | null) => void;
  setSelectedSection: (section: string | null) => void;
  setSearchResults: (results: EntryMeta[] | null) => void;
  setEditorMode: (mode: EditorMode) => void;
  setActiveEntry: (entry: Entry | null) => void;
  setRibbonTab: (tab: RibbonTab) => void;
  setRibbonCollapsed: (collapsed: boolean) => void;
  toggleCommandPalette: () => void;
  toggleDebugBar: () => void;
  toggleDrawing: () => void;
  toggleSidebar: () => void;
}

export type AppStore = AppState & AppActions;

// ── Store ────────────────────────────────────────────────────────────

export const useAppStore = create<AppStore>((set, get) => ({
  // Initial state
  view: 'notes',
  filter: { type: 'all' },
  searchQuery: '',
  selectedNotebook: null,
  selectedSection: null,
  entries: [],
  activeEntry: null,
  notebooks: [],
  tags: [],
  searchResults: null,
  editorMode: loadPreferences().editorModeDefault,
  saveStatus: 'idle',
  lastAction: '',
  showCommandPalette: false,
  showDebugBar: false,
  ribbonTab: 'home',
  ribbonCollapsed: true,
  sidebarCollapsed: false,
  drawingActive: false,

  // ── Data Loading ───────────────────────────────────────────────────

  loadEntries: async () => {
    const list = await window.strata.listEntries();
    set({ entries: list, lastAction: 'loadEntries' });
  },

  loadMeta: async () => {
    const [notebooks, tags] = await Promise.all([
      window.strata.listNotebooks(),
      window.strata.listTags(),
    ]);
    set({ notebooks, tags, lastAction: 'loadMeta' });
  },

  // ── Entry Operations ──────────────────────────────────────────────

  openEntry: async (id) => {
    const entry = await window.strata.readEntry(id);
    if (!entry) return;

    const { selectedNotebook, selectedSection, filter } = get();
    const updates: Partial<AppState> = {
      activeEntry: entry,
      lastAction: `open:${id.slice(0, 8)}`,
    };

    if (entry.notebook) {
      const { notebook, section } = parseNotebookPath(entry.notebook);
      if (notebook !== selectedNotebook) {
        updates.selectedNotebook = notebook;
        updates.selectedSection = section || null;
        if (filter.type === 'notebook' || filter.type === 'tag') {
          updates.filter = { type: 'all' };
        }
      } else if (section && section !== selectedSection) {
        updates.selectedSection = section || null;
      }
    }

    set(updates);
  },

  createEntry: async () => {
    const { filter, selectedNotebook, selectedSection } = get();
    const prefs = loadPreferences();
    const now = new Date().toISOString();

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
    set({ activeEntry: entry, view: 'notes', lastAction: 'create' });
    await get().loadEntries();
    await get().loadMeta();
  },

  saveEntry: async (entry) => {
    set({ saveStatus: 'saving', lastAction: 'saving' });
    try {
      await window.strata.writeEntry(entry);
      set({ activeEntry: entry, saveStatus: 'saved', lastAction: 'saved' });
      await get().loadEntries();
      await get().loadMeta();
    } catch {
      set({ saveStatus: 'error', lastAction: 'save-error' });
    }
  },

  trashEntry: async (id) => {
    await window.strata.trashEntry(id);
    set({ activeEntry: null, lastAction: `trash:${id.slice(0, 8)}` });
    await get().loadEntries();
  },

  restoreEntry: async (id) => {
    await window.strata.restoreEntry(id);
    set({ activeEntry: null, lastAction: `restore:${id.slice(0, 8)}` });
    await get().loadEntries();
  },

  deleteEntryPermanently: async (id) => {
    await window.strata.deleteEntryPermanently(id);
    set({ activeEntry: null, lastAction: `delete:${id.slice(0, 8)}` });
    await get().loadEntries();
    await get().loadMeta();
  },

  pinEntry: async (id) => {
    await window.strata.pinEntry(id);
    const { activeEntry } = get();
    if (activeEntry?.id === id) {
      set({ activeEntry: { ...activeEntry, pinned: true } });
    }
    set({ lastAction: `pin:${id.slice(0, 8)}` });
    await get().loadEntries();
  },

  unpinEntry: async (id) => {
    await window.strata.unpinEntry(id);
    const { activeEntry } = get();
    if (activeEntry?.id === id) {
      set({ activeEntry: { ...activeEntry, pinned: false } });
    }
    set({ lastAction: `unpin:${id.slice(0, 8)}` });
    await get().loadEntries();
  },

  // ── Section Operations ────────────────────────────────────────────

  createSection: async (name) => {
    const { selectedNotebook } = get();
    if (!selectedNotebook || !name.trim()) return;

    const prefs = loadPreferences();
    const nb = buildNotebookPath(selectedNotebook, name.trim());
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
    await get().loadEntries();
    await get().loadMeta();
    set({ selectedSection: name.trim(), lastAction: `createSection:${name}` });
  },

  renameSection: async (oldName, newName) => {
    const { selectedNotebook, selectedSection, activeEntry } = get();
    if (!selectedNotebook || !newName.trim() || oldName === newName) return;

    await window.strata.renameSection(selectedNotebook, oldName, newName.trim());
    await get().loadEntries();
    await get().loadMeta();

    const updates: Partial<AppState> = {
      lastAction: `renameSection:${oldName}->${newName}`,
    };

    if (selectedSection === oldName) {
      updates.selectedSection = newName.trim();
    }

    if (activeEntry) {
      const oldPath = (!oldName || oldName === 'General')
        ? selectedNotebook
        : `${selectedNotebook}/${oldName}`;
      const newPath = (!newName.trim() || newName.trim() === 'General')
        ? selectedNotebook
        : `${selectedNotebook}/${newName.trim()}`;
      if (activeEntry.notebook === oldPath) {
        updates.activeEntry = { ...activeEntry, notebook: newPath };
      }
    }

    set(updates);
  },

  reorderEntries: async (updates) => {
    await window.strata.reorderEntries(updates);
    set({ lastAction: 'reorder' });
    await get().loadEntries();
  },

  // ── Setters ───────────────────────────────────────────────────────

  setView: (view) => set({ view }),
  setFilter: (filter) => set({ filter }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSelectedNotebook: (nb) => set({ selectedNotebook: nb, selectedSection: null }),
  setSelectedSection: (section) => set({ selectedSection: section }),
  setSearchResults: (results) => set({ searchResults: results }),
  setEditorMode: (mode) => set({ editorMode: mode }),
  setActiveEntry: (entry) => set({ activeEntry: entry }),
  setRibbonTab: (tab) => set({ ribbonTab: tab }),
  setRibbonCollapsed: (collapsed) => set({ ribbonCollapsed: collapsed }),
  toggleCommandPalette: () => set(s => ({ showCommandPalette: !s.showCommandPalette })),
  toggleDebugBar: () => set(s => ({ showDebugBar: !s.showDebugBar })),
  toggleDrawing: () => set(s => ({ drawingActive: !s.drawingActive })),
  toggleSidebar: () => set(s => ({ sidebarCollapsed: !s.sidebarCollapsed })),
}));

// ── Derived Selector Hooks ──────────────────────────────────────────

export function useFilteredEntries(): EntryMeta[] {
  const entries = useAppStore(s => s.entries);
  const filter = useAppStore(s => s.filter);
  const searchResults = useAppStore(s => s.searchResults);
  const selectedNotebook = useAppStore(s => s.selectedNotebook);
  const selectedSection = useAppStore(s => s.selectedSection);

  return useMemo(() => {
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
}

export function useSortedEntries(): EntryMeta[] {
  const filtered = useFilteredEntries();

  return useMemo(() => {
    return [...filtered].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      const aOrder = a.sortOrder ?? Infinity;
      const bOrder = b.sortOrder ?? Infinity;
      if (aOrder !== Infinity || bOrder !== Infinity) {
        if (aOrder !== bOrder) return aOrder - bOrder;
      }
      return new Date(b.modified).getTime() - new Date(a.modified).getTime();
    });
  }, [filtered]);
}

export function useSectionsForNotebook(): string[] {
  const notebooks = useAppStore(s => s.notebooks);
  const selectedNotebook = useAppStore(s => s.selectedNotebook);

  return useMemo(() => {
    if (!selectedNotebook) return [];
    return getSectionsForNotebook(notebooks, selectedNotebook);
  }, [notebooks, selectedNotebook]);
}
