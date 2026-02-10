import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import matter from 'gray-matter';
import type { Entry, EntryMeta, Connection, StrataSettings, StrataConnections } from '../src/types';

// ── Paths ──────────────────────────────────────────────────────────

function getDefaultVault(): string {
  return path.join(app.getPath('documents'), 'Strata');
}

function getSettingsPath(): string {
  return path.join(getVaultPath(), '.strata', 'settings.json');
}

function getConnectionsPath(): string {
  return path.join(getVaultPath(), '.strata', 'connections.json');
}

function getEntriesDir(): string {
  return path.join(getVaultPath(), 'entries');
}

// ── Settings ───────────────────────────────────────────────────────

let cachedVaultPath: string | null = null;

function getVaultPath(): string {
  if (cachedVaultPath) return cachedVaultPath;

  // Check if a global settings file stores the vault path
  const globalConfig = path.join(app.getPath('userData'), 'config.json');
  try {
    const raw = fs.readFileSync(globalConfig, 'utf-8');
    const parsed = JSON.parse(raw);
    if (parsed.vaultPath && fs.existsSync(parsed.vaultPath)) {
      cachedVaultPath = parsed.vaultPath;
      return cachedVaultPath;
    }
  } catch {
    // No config yet, use default
  }

  cachedVaultPath = getDefaultVault();
  return cachedVaultPath;
}

function setVaultPath(newPath: string): void {
  cachedVaultPath = newPath;
  const globalConfig = path.join(app.getPath('userData'), 'config.json');
  fs.mkdirSync(path.dirname(globalConfig), { recursive: true });
  fs.writeFileSync(globalConfig, JSON.stringify({ vaultPath: newPath }, null, 2));
  ensureVault();
}

function ensureVault(): void {
  const vault = getVaultPath();
  fs.mkdirSync(path.join(vault, 'entries'), { recursive: true });
  fs.mkdirSync(path.join(vault, '.strata'), { recursive: true });

  const connPath = getConnectionsPath();
  if (!fs.existsSync(connPath)) {
    fs.writeFileSync(connPath, JSON.stringify({ connections: [] }, null, 2));
  }

  const settingsPath = getSettingsPath();
  if (!fs.existsSync(settingsPath)) {
    fs.writeFileSync(settingsPath, JSON.stringify({ vaultPath: vault }, null, 2));
  }
}

// ── Search Index (in-memory cache) ──────────────────────────────────

const searchIndex = new Map<string, { title: string; body: string }>();

function rebuildSearchIndex(): void {
  searchIndex.clear();
  const dir = getEntriesDir();
  if (!fs.existsSync(dir)) return;

  const files = fs.readdirSync(dir).filter(f => f.endsWith('.md'));
  for (const file of files) {
    try {
      const raw = fs.readFileSync(path.join(dir, file), 'utf-8');
      const { data, content } = matter(raw);
      const id = data.id ?? path.basename(file, '.md');
      searchIndex.set(id, {
        title: (data.title ?? '').toLowerCase(),
        body: content.toLowerCase(),
      });
    } catch {
      // Skip malformed
    }
  }
}

function updateSearchIndexEntry(id: string, title: string, body: string): void {
  searchIndex.set(id, { title: title.toLowerCase(), body: body.toLowerCase() });
}

function removeSearchIndexEntry(id: string): void {
  searchIndex.delete(id);
}

// ── Entries ─────────────────────────────────────────────────────────

function listEntries(): EntryMeta[] {
  const dir = getEntriesDir();
  if (!fs.existsSync(dir)) return [];

  const files = fs.readdirSync(dir).filter(f => f.endsWith('.md'));
  const entries: EntryMeta[] = [];

  for (const file of files) {
    try {
      const raw = fs.readFileSync(path.join(dir, file), 'utf-8');
      const { data, content } = matter(raw);
      const id = data.id ?? path.basename(file, '.md');
      entries.push({
        id,
        title: data.title ?? 'Untitled',
        structure: data.structure ?? 'thought',
        pressure: data.pressure ?? 'low',
        pinned: data.pinned ?? false,
        archived: data.archived ?? false,
        trashed: data.trashed ?? false,
        notebook: data.notebook ?? '',
        tags: Array.isArray(data.tags) ? data.tags : [],
        created: data.created ?? new Date().toISOString(),
        modified: data.modified ?? new Date().toISOString(),
      });
      // Keep search index up to date
      searchIndex.set(id, {
        title: (data.title ?? '').toLowerCase(),
        body: content.toLowerCase(),
      });
    } catch {
      // Skip malformed files
    }
  }

  return entries;
}

function readEntry(id: string): Entry | null {
  const filePath = path.join(getEntriesDir(), `${id}.md`);
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, 'utf-8');
  const { data, content } = matter(raw);

  return {
    id: data.id ?? id,
    title: data.title ?? 'Untitled',
    structure: data.structure ?? 'thought',
    pressure: data.pressure ?? 'low',
    pinned: data.pinned ?? false,
    archived: data.archived ?? false,
    trashed: data.trashed ?? false,
    notebook: data.notebook ?? '',
    tags: Array.isArray(data.tags) ? data.tags : [],
    created: data.created ?? new Date().toISOString(),
    modified: data.modified ?? new Date().toISOString(),
    body: content,
  };
}

function writeEntry(entry: Entry): void {
  const dir = getEntriesDir();
  fs.mkdirSync(dir, { recursive: true });

  const frontmatter = {
    id: entry.id,
    title: entry.title,
    structure: entry.structure,
    pressure: entry.pressure,
    pinned: entry.pinned,
    archived: entry.archived,
    trashed: entry.trashed,
    notebook: entry.notebook,
    tags: entry.tags,
    created: entry.created,
    modified: new Date().toISOString(),
  };

  const content = matter.stringify(entry.body, frontmatter);
  fs.writeFileSync(path.join(dir, `${entry.id}.md`), content);

  // Update search index
  updateSearchIndexEntry(entry.id, entry.title, entry.body);
}

function archiveEntry(id: string): void {
  const entry = readEntry(id);
  if (!entry) return;
  entry.archived = true;
  writeEntry(entry);
}

function trashEntry(id: string): void {
  const entry = readEntry(id);
  if (!entry) return;
  entry.trashed = true;
  writeEntry(entry);
}

function restoreEntry(id: string): void {
  const entry = readEntry(id);
  if (!entry) return;
  entry.trashed = false;
  entry.archived = false;
  writeEntry(entry);
}

function deleteEntryPermanently(id: string): void {
  const filePath = path.join(getEntriesDir(), `${id}.md`);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
  // Remove from connections
  const data = readConnections();
  data.connections = data.connections.filter(
    c => c.from !== id && c.to !== id
  );
  saveConnections(data);
  // Remove from search index
  removeSearchIndexEntry(id);
}

function pinEntry(id: string): void {
  const entry = readEntry(id);
  if (!entry) return;
  entry.pinned = true;
  writeEntry(entry);
}

function unpinEntry(id: string): void {
  const entry = readEntry(id);
  if (!entry) return;
  entry.pinned = false;
  writeEntry(entry);
}

function searchEntries(query: string): EntryMeta[] {
  const q = query.toLowerCase();

  // Use in-memory search index for fast matching
  const matchingIds = new Set<string>();
  for (const [id, indexed] of searchIndex) {
    if (indexed.title.includes(q) || indexed.body.includes(q)) {
      matchingIds.add(id);
    }
  }

  // Return full metadata for matching entries
  return listEntries().filter(e => matchingIds.has(e.id));
}

function listNotebooks(): string[] {
  const entries = listEntries();
  const notebooks = new Set<string>();
  for (const e of entries) {
    if (e.notebook) notebooks.add(e.notebook);
  }
  return Array.from(notebooks).sort();
}

function listTags(): string[] {
  const entries = listEntries();
  const tags = new Set<string>();
  for (const e of entries) {
    for (const t of e.tags) tags.add(t);
  }
  return Array.from(tags).sort();
}

// ── Connections ─────────────────────────────────────────────────────

function readConnections(): StrataConnections {
  const connPath = getConnectionsPath();
  try {
    const raw = fs.readFileSync(connPath, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return { connections: [] };
  }
}

function saveConnections(data: StrataConnections): void {
  fs.writeFileSync(getConnectionsPath(), JSON.stringify(data, null, 2));
}

function addConnection(conn: Connection): void {
  const data = readConnections();
  const exists = data.connections.some(
    c => (c.from === conn.from && c.to === conn.to) ||
         (c.from === conn.to && c.to === conn.from)
  );
  if (!exists) {
    data.connections.push(conn);
    saveConnections(data);
  }
}

function removeConnection(from: string, to: string): void {
  const data = readConnections();
  data.connections = data.connections.filter(
    c => !((c.from === from && c.to === to) || (c.from === to && c.to === from))
  );
  saveConnections(data);
}

// ── IPC Handlers ────────────────────────────────────────────────────

function registerIPC(): void {
  ipcMain.handle('get-settings', (): StrataSettings => {
    return { vaultPath: getVaultPath() };
  });

  ipcMain.handle('set-vault-path', (_e, newPath: string) => {
    setVaultPath(newPath);
  });

  ipcMain.handle('pick-folder', async (): Promise<string | null> => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
      title: 'Choose Strata vault folder',
    });
    if (result.canceled || result.filePaths.length === 0) return null;
    return result.filePaths[0];
  });

  ipcMain.handle('list-entries', () => listEntries());
  ipcMain.handle('read-entry', (_e, id: string) => readEntry(id));
  ipcMain.handle('write-entry', (_e, entry: Entry) => writeEntry(entry));
  ipcMain.handle('archive-entry', (_e, id: string) => archiveEntry(id));
  ipcMain.handle('search-entries', (_e, query: string) => searchEntries(query));
  ipcMain.handle('trash-entry', (_e, id: string) => trashEntry(id));
  ipcMain.handle('restore-entry', (_e, id: string) => restoreEntry(id));
  ipcMain.handle('delete-entry-permanently', (_e, id: string) => deleteEntryPermanently(id));
  ipcMain.handle('pin-entry', (_e, id: string) => pinEntry(id));
  ipcMain.handle('unpin-entry', (_e, id: string) => unpinEntry(id));
  ipcMain.handle('list-notebooks', () => listNotebooks());
  ipcMain.handle('list-tags', () => listTags());

  ipcMain.handle('get-connections', () => readConnections().connections);
  ipcMain.handle('add-connection', (_e, conn: Connection) => addConnection(conn));
  ipcMain.handle('remove-connection', (_e, from: string, to: string) => removeConnection(from, to));
}

// ── Window ──────────────────────────────────────────────────────────

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 720,
    minWidth: 800,
    minHeight: 520,
    backgroundColor: '#2e3440',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Vite dev server or production build
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ── App Lifecycle ───────────────────────────────────────────────────

app.whenReady().then(() => {
  ensureVault();
  rebuildSearchIndex();
  registerIPC();
  createWindow();
});

app.on('window-all-closed', () => {
  app.quit();
});

app.on('activate', () => {
  if (mainWindow === null) createWindow();
});
