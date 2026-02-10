import { useMemo, useState, useEffect } from 'react';
import type { EntryMeta, Structure, Connection } from '../types';

interface ObserveViewProps {
  entries: EntryMeta[];
}

const STRUCTURES: Structure[] = ['thought', 'idea', 'question', 'decision', 'system', 'insight'];

export function ObserveView({ entries }: ObserveViewProps) {
  const [connections, setConnections] = useState<Connection[]>([]);

  useEffect(() => {
    window.strata.getConnections().then(setConnections);
  }, []);

  const active = useMemo(() => entries.filter(e => !e.archived && !e.trashed), [entries]);
  const archived = useMemo(() => entries.filter(e => e.archived && !e.trashed), [entries]);
  const trashed = useMemo(() => entries.filter(e => e.trashed), [entries]);

  const byCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const s of STRUCTURES) counts[s] = 0;
    for (const e of active) counts[e.structure] = (counts[e.structure] || 0) + 1;
    return counts;
  }, [active]);

  const pressureCounts = useMemo(() => {
    const counts = { low: 0, medium: 0, high: 0 };
    for (const e of active) counts[e.pressure]++;
    return counts;
  }, [active]);

  const connectionStats = useMemo(() => {
    const connectedIds = new Set<string>();
    for (const c of connections) {
      connectedIds.add(c.from);
      connectedIds.add(c.to);
    }
    const connected = active.filter(e => connectedIds.has(e.id)).length;
    return { connected, isolated: active.length - connected };
  }, [active, connections]);

  const notebookCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const e of active) {
      const nb = e.notebook || '(none)';
      counts[nb] = (counts[nb] || 0) + 1;
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [active]);

  const topTags = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const e of active) {
      for (const t of e.tags) {
        counts[t] = (counts[t] || 0) + 1;
      }
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [active]);

  return (
    <div className="observe">
      <div className="observe-section">
        <h3>By structure</h3>
        <div className="observe-grid">
          {STRUCTURES.map(s => (
            <div key={s} className="observe-card">
              <div className="observe-card-label">{s}</div>
              <div className="observe-card-value">{byCounts[s]}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="observe-section">
        <h3>By pressure</h3>
        <div className="observe-grid">
          <div className="observe-card">
            <div className="observe-card-label">Low</div>
            <div className="observe-card-value">{pressureCounts.low}</div>
          </div>
          <div className="observe-card">
            <div className="observe-card-label">Medium</div>
            <div className="observe-card-value">{pressureCounts.medium}</div>
          </div>
          <div className="observe-card">
            <div className="observe-card-label">High</div>
            <div className="observe-card-value">{pressureCounts.high}</div>
          </div>
        </div>
      </div>

      <div className="observe-section">
        <h3>Connections</h3>
        <div className="observe-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <div className="observe-card">
            <div className="observe-card-label">Connected</div>
            <div className="observe-card-value">{connectionStats.connected}</div>
          </div>
          <div className="observe-card">
            <div className="observe-card-label">Isolated</div>
            <div className="observe-card-value">{connectionStats.isolated}</div>
          </div>
        </div>
      </div>

      {notebookCounts.length > 0 && (
        <div className="observe-section">
          <h3>By notebook</h3>
          <div className="observe-grid">
            {notebookCounts.map(([nb, count]) => (
              <div key={nb} className="observe-card">
                <div className="observe-card-label">{nb}</div>
                <div className="observe-card-value">{count}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {topTags.length > 0 && (
        <div className="observe-section">
          <h3>Top tags</h3>
          <div className="observe-grid">
            {topTags.map(([tag, count]) => (
              <div key={tag} className="observe-card">
                <div className="observe-card-label">#{tag}</div>
                <div className="observe-card-value">{count}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="observe-section">
        <h3>Total</h3>
        <div className="observe-grid">
          <div className="observe-card">
            <div className="observe-card-label">Active</div>
            <div className="observe-card-value">{active.length}</div>
          </div>
          <div className="observe-card">
            <div className="observe-card-label">Archived</div>
            <div className="observe-card-value">{archived.length}</div>
          </div>
          <div className="observe-card">
            <div className="observe-card-label">Trashed</div>
            <div className="observe-card-value">{trashed.length}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
