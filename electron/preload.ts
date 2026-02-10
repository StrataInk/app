import { contextBridge, ipcRenderer } from 'electron';
import type { StrataAPI } from '../src/types';

const api: StrataAPI = {
  getSettings: () => ipcRenderer.invoke('get-settings'),
  setVaultPath: (p) => ipcRenderer.invoke('set-vault-path', p),
  pickFolder: () => ipcRenderer.invoke('pick-folder'),
  listEntries: () => ipcRenderer.invoke('list-entries'),
  readEntry: (id) => ipcRenderer.invoke('read-entry', id),
  writeEntry: (entry) => ipcRenderer.invoke('write-entry', entry),
  archiveEntry: (id) => ipcRenderer.invoke('archive-entry', id),
  searchEntries: (query) => ipcRenderer.invoke('search-entries', query),
  trashEntry: (id) => ipcRenderer.invoke('trash-entry', id),
  restoreEntry: (id) => ipcRenderer.invoke('restore-entry', id),
  deleteEntryPermanently: (id) => ipcRenderer.invoke('delete-entry-permanently', id),
  pinEntry: (id) => ipcRenderer.invoke('pin-entry', id),
  unpinEntry: (id) => ipcRenderer.invoke('unpin-entry', id),
  listNotebooks: () => ipcRenderer.invoke('list-notebooks'),
  listTags: () => ipcRenderer.invoke('list-tags'),
  getConnections: () => ipcRenderer.invoke('get-connections'),
  addConnection: (conn) => ipcRenderer.invoke('add-connection', conn),
  removeConnection: (from, to) => ipcRenderer.invoke('remove-connection', from, to),
  windowMinimize: () => ipcRenderer.invoke('window-minimize'),
  windowMaximize: () => ipcRenderer.invoke('window-maximize'),
  windowClose: () => ipcRenderer.invoke('window-close'),
  windowIsMaximized: () => ipcRenderer.invoke('window-is-maximized'),
};

contextBridge.exposeInMainWorld('strata', api);
