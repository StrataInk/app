import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { loadPreferences, savePreferences, subscribe, defaultPreferences } from './preferences';
import type { Preferences } from './preferences';

const PreferencesContext = createContext<{
  prefs: Preferences;
  update: (partial: Partial<Preferences>) => void;
}>({ prefs: defaultPreferences, update: () => {} });

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState(loadPreferences);

  useEffect(() => subscribe(setPrefs), []);

  // Apply to DOM whenever prefs change
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = prefs.theme;

    // Layout CSS variables
    root.style.setProperty('--sidebar-width', prefs.sidebarWidth + 'px');
    root.style.setProperty('--notelist-width', prefs.notelistWidth + 'px');
    const maxW = prefs.editorMaxWidth === '100%' ? '100%' : prefs.editorMaxWidth + 'px';
    root.style.setProperty('--editor-max-width', maxW);

    // Editor typography CSS variables
    const fontMap: Record<string, string> = {
      system: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      inter: '"Inter", sans-serif',
      georgia: '"Georgia", serif',
      consolas: '"Consolas", monospace',
      'fira-code': '"Fira Code", monospace',
    };
    root.style.setProperty('--editor-font-family', fontMap[prefs.fontFamily] || fontMap.system);
    root.style.setProperty('--editor-font-size', prefs.fontSize + 'px');
    root.style.setProperty('--editor-line-height', prefs.lineHeight);
  }, [prefs]);

  const update = useCallback((partial: Partial<Preferences>) => {
    savePreferences(partial);
  }, []);

  return (
    <PreferencesContext.Provider value={{ prefs, update }}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  return useContext(PreferencesContext);
}
