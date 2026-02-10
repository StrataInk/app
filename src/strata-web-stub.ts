/**
 * Web stub for window.strata — provides an in-memory demo backend
 * so the app is reviewable in a browser without Electron.
 */
import type { Entry, EntryMeta, StrataAPI } from './types';
import { v4 as uuid } from 'uuid';

const DEMO_ENTRIES: Entry[] = [
  {
    id: uuid(),
    title: 'Welcome to Strata',
    structure: 'thought',
    pressure: 'low',
    pinned: true,
    archived: false,
    trashed: false,
    notebook: 'Getting Started/Basics',
    tags: ['welcome', 'demo'],
    created: new Date().toISOString(),
    modified: new Date().toISOString(),
    body: '# Welcome\n\nThis is a **demo preview** of Strata running in the browser.\n\nThe full app runs as a desktop application with local file storage.\n\n- [x] Local-only, no cloud\n- [x] Markdown-first editor\n- [ ] Your thoughts, structured\n',
  },
  {
    id: uuid(),
    title: 'How structures work',
    structure: 'idea',
    pressure: 'medium',
    pinned: false,
    archived: false,
    trashed: false,
    notebook: 'Getting Started/Concepts',
    tags: ['structures'],
    created: new Date(Date.now() - 3600000).toISOString(),
    modified: new Date(Date.now() - 3600000).toISOString(),
    body: 'Every entry in Strata has a **structure** — a label that describes what kind of thinking it represents.\n\n## The six structures\n\n- **Thought** — a passing observation\n- **Idea** — something worth developing\n- **Question** — something unresolved\n- **Decision** — a committed closure\n- **System** — a repeatable process\n- **Insight** — a realized understanding\n',
  },
  {
    id: uuid(),
    title: 'Pressure levels',
    structure: 'system',
    pressure: 'high',
    pinned: false,
    archived: false,
    trashed: false,
    notebook: 'Personal',
    tags: ['pressure', 'demo'],
    created: new Date(Date.now() - 7200000).toISOString(),
    modified: new Date(Date.now() - 7200000).toISOString(),
    body: 'Pressure indicates urgency or weight:\n\n| Level | Meaning |\n|-------|------|\n| Low | Background, no rush |\n| Medium | Needs attention soon |\n| High | Demands immediate focus |\n',
  },
];

let entries = [...DEMO_ENTRIES];

function toMeta(e: Entry): EntryMeta {
  const { body: _, ...meta } = e;
  return meta;
}

const stubAPI: StrataAPI = {
  getSettings: async () => ({ vaultPath: '/demo' }),
  setVaultPath: async () => {},
  pickFolder: async () => null,

  listEntries: async () => entries.map(toMeta),

  readEntry: async (id) => entries.find(e => e.id === id) ?? null,

  writeEntry: async (entry) => {
    const idx = entries.findIndex(e => e.id === entry.id);
    if (idx >= 0) {
      entries[idx] = { ...entry, modified: new Date().toISOString() };
    } else {
      entries.unshift(entry);
    }
  },

  archiveEntry: async (id) => {
    const e = entries.find(x => x.id === id);
    if (e) e.archived = true;
  },

  searchEntries: async (query) => {
    const q = query.toLowerCase();
    return entries
      .filter(e => !e.trashed && (
        e.title.toLowerCase().includes(q) ||
        e.body.toLowerCase().includes(q) ||
        e.tags.some(t => t.includes(q))
      ))
      .map(toMeta);
  },

  trashEntry: async (id) => {
    const e = entries.find(x => x.id === id);
    if (e) e.trashed = true;
  },

  restoreEntry: async (id) => {
    const e = entries.find(x => x.id === id);
    if (e) e.trashed = false;
  },

  deleteEntryPermanently: async (id) => {
    entries = entries.filter(e => e.id !== id);
  },

  pinEntry: async (id) => {
    const e = entries.find(x => x.id === id);
    if (e) e.pinned = true;
  },

  unpinEntry: async (id) => {
    const e = entries.find(x => x.id === id);
    if (e) e.pinned = false;
  },

  listNotebooks: async () => {
    const nbs = new Set(entries.map(e => e.notebook).filter(Boolean));
    return [...nbs].sort();
  },

  listTags: async () => {
    const tagSet = new Set(entries.flatMap(e => e.tags));
    return [...tagSet].sort();
  },

  renameSection: async (notebook, oldSection, newSection) => {
    const oldPath = (!oldSection || oldSection === 'General') ? notebook : `${notebook}/${oldSection}`;
    const newPath = (!newSection || newSection === 'General') ? notebook : `${notebook}/${newSection}`;
    let count = 0;
    for (const e of entries) {
      if (e.notebook === oldPath) {
        e.notebook = newPath;
        count++;
      }
    }
    return count;
  },

  reorderEntries: async (updates) => {
    for (const { id, sortOrder } of updates) {
      const e = entries.find(x => x.id === id);
      if (e) e.sortOrder = sortOrder;
    }
  },

  getConnections: async () => [],
  addConnection: async () => {},
  removeConnection: async () => {},
  windowMinimize: async () => {},
  windowMaximize: async () => {},
  windowClose: async () => {},
  windowIsMaximized: async () => false,
};

// Install the stub if we're not in Electron
if (!window.strata) {
  window.strata = stubAPI;
}
