import { useMemo } from 'react';
import { useAppStore } from '../state/store';

export function StatusBar() {
  const activeEntry = useAppStore(s => s.activeEntry);
  const saveStatus = useAppStore(s => s.saveStatus);

  const stats = useMemo(() => {
    if (!activeEntry) return null;
    const text = activeEntry.body;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const chars = text.length;
    const lines = text.split('\n').length;
    return { words, chars, lines };
  }, [activeEntry]);

  if (!stats) return null;

  const statusLabel =
    saveStatus === 'saving' ? 'Saving...' :
    saveStatus === 'saved' ? 'Saved' :
    saveStatus === 'error' ? 'Error' :
    '';

  return (
    <div className="status-bar">
      <span className="status-bar-item">{stats.words} words</span>
      <span className="status-bar-item">{stats.chars} chars</span>
      <span className="status-bar-item">{stats.lines} lines</span>
      <span className="status-bar-spacer" />
      {statusLabel && (
        <span className={`status-bar-item status-bar-save ${saveStatus}`}>
          {statusLabel}
        </span>
      )}
    </div>
  );
}
