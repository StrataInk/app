export interface Preferences {
  // Appearance
  theme: 'nord-dark' | 'editorial-light' | 'editorial-dark';
  sidebarWidth: string;
  notelistWidth: string;
  editorMaxWidth: string;
  // Editor
  fontFamily: string;
  fontSize: string;
  lineHeight: string;
  tabSize: string;
  wordWrap: boolean;
  showLineNumbers: boolean;
  spellCheck: boolean;
  // General
  defaultStructure: string;
  defaultPressure: string;
  autosaveInterval: string;
  editorModeDefault: 'write' | 'split' | 'preview';
}

export const defaultPreferences: Preferences = {
  theme: 'nord-dark',
  sidebarWidth: '220',
  notelistWidth: '300',
  editorMaxWidth: '720',
  fontFamily: 'system',
  fontSize: '16',
  lineHeight: '1.75',
  tabSize: '2',
  wordWrap: true,
  showLineNumbers: false,
  spellCheck: true,
  defaultStructure: 'thought',
  defaultPressure: 'low',
  autosaveInterval: '600',
  editorModeDefault: 'write',
};

const STORAGE_KEY = 'strata-preferences';
type Listener = (prefs: Preferences) => void;
const listeners = new Set<Listener>();

export function loadPreferences(): Preferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...defaultPreferences, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return { ...defaultPreferences };
}

export function savePreferences(partial: Partial<Preferences>): Preferences {
  const current = loadPreferences();
  const merged = { ...current, ...partial };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  listeners.forEach(fn => fn(merged));
  return merged;
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
