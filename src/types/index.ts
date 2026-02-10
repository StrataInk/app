export type Structure =
  | 'thought'
  | 'idea'
  | 'question'
  | 'decision'
  | 'system'
  | 'insight';

export type Pressure = 'low' | 'medium' | 'high';

export interface EntryMeta {
  id: string;
  title: string;
  structure: Structure;
  pressure: Pressure;
  pinned: boolean;
  archived: boolean;
  trashed: boolean;
  notebook: string;    // empty string = no notebook
  tags: string[];
  created: string;     // ISO 8601
  modified: string;    // ISO 8601
  sortOrder?: number;
}

export interface Entry extends EntryMeta {
  body: string;
}

export interface Connection {
  from: string;  // entry id
  to: string;    // entry id
}

export interface StrataSettings {
  vaultPath: string;
}

export interface StrataConnections {
  connections: Connection[];
}

// IPC channel types
export interface StrataAPI {
  getSettings: () => Promise<StrataSettings>;
  setVaultPath: (path: string) => Promise<void>;
  pickFolder: () => Promise<string | null>;
  listEntries: () => Promise<EntryMeta[]>;
  readEntry: (id: string) => Promise<Entry | null>;
  writeEntry: (entry: Entry) => Promise<void>;
  archiveEntry: (id: string) => Promise<void>;
  searchEntries: (query: string) => Promise<EntryMeta[]>;
  trashEntry: (id: string) => Promise<void>;
  restoreEntry: (id: string) => Promise<void>;
  deleteEntryPermanently: (id: string) => Promise<void>;
  pinEntry: (id: string) => Promise<void>;
  unpinEntry: (id: string) => Promise<void>;
  listNotebooks: () => Promise<string[]>;
  listTags: () => Promise<string[]>;
  getConnections: () => Promise<Connection[]>;
  addConnection: (conn: Connection) => Promise<void>;
  removeConnection: (from: string, to: string) => Promise<void>;
  renameSection: (notebook: string, oldSection: string, newSection: string) => Promise<number>;
  reorderEntries: (updates: { id: string; sortOrder: number }[]) => Promise<void>;
  windowMinimize: () => Promise<void>;
  windowMaximize: () => Promise<void>;
  windowClose: () => Promise<void>;
  windowIsMaximized: () => Promise<boolean>;
}

declare global {
  interface Window {
    strata: StrataAPI;
  }
}
