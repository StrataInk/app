import { useMemo } from 'react';
import type { EntryMeta, Structure } from '../types';

interface ObserveViewProps {
  entries: EntryMeta[];
}

const STRUCTURES: Structure[] = ['thought', 'idea', 'question', 'decision', 'system', 'insight'];

const STRUCTURE_LABELS: Record<Structure, string> = {
  thought: 'Thoughts surfacing',
  idea: 'Ideas forming',
  question: 'Questions open',
  decision: 'Decisions set',
  system: 'Systems running',
  insight: 'Insights arrived',
};

function pressureSummary(counts: { low: number; medium: number; high: number }): string {
  const total = counts.low + counts.medium + counts.high;
  if (total === 0) return 'Nothing weighing on you.';
  if (counts.high > counts.low + counts.medium) return 'Heavy. Several things demanding focus.';
  if (counts.high > 0) return 'Some weight. A few things need attention.';
  if (counts.medium > counts.low) return 'Moderate. Awareness without urgency.';
  return 'Light. Most things are settled.';
}

function shapeSummary(counts: Record<string, number>): string {
  const sorted = Object.entries(counts).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
  if (sorted.length === 0) return 'No entries yet.';
  if (sorted.length === 1) return `All ${sorted[0][0]}s. A single mode of thinking.`;
  const [first, second] = sorted;
  if (first[1] === second[1]) return `Balanced between ${first[0]}s and ${second[0]}s.`;
  return `Mostly ${first[0]}s. ${second[0].charAt(0).toUpperCase() + second[0].slice(1)}s close behind.`;
}

export function ObserveView({ entries }: ObserveViewProps) {
  const active = useMemo(() => entries.filter(e => !e.archived && !e.trashed), [entries]);
  const archived = useMemo(() => entries.filter(e => e.archived && !e.trashed), [entries]);

  const structureCounts = useMemo(() => {
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

  const topStructures = useMemo(() => {
    return STRUCTURES
      .filter(s => structureCounts[s] > 0)
      .sort((a, b) => structureCounts[b] - structureCounts[a]);
  }, [structureCounts]);

  return (
    <div className="observe">
      <div className="observe-section observe-card">
        <h3>What you're carrying</h3>
        <div className="observe-summary">
          <span className="observe-big-number">{active.length}</span>
          <span className="observe-big-label">
            active {active.length === 1 ? 'entry' : 'entries'}
            {archived.length > 0 && <>, {archived.length} set aside</>}
          </span>
        </div>
      </div>

      <div className="observe-section observe-card">
        <h3>Shape of your thinking</h3>
        <p className="observe-insight">{shapeSummary(structureCounts)}</p>
        <div className="observe-bars">
          {topStructures.map(s => (
            <div key={s} className="observe-bar-row">
              <span className="observe-bar-dot" data-structure={s} />
              <span className="observe-bar-label">{STRUCTURE_LABELS[s]}</span>
              <div className="observe-bar-track">
                <div
                  className="observe-bar-fill"
                  data-structure={s}
                  style={{ width: `${active.length > 0 ? (structureCounts[s] / active.length) * 100 : 0}%` }}
                />
              </div>
              <span className="observe-bar-count">{structureCounts[s]}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="observe-section observe-card">
        <h3>Weight</h3>
        <p className="observe-insight">{pressureSummary(pressureCounts)}</p>
        <div className="observe-pressure-row">
          <div className="observe-pressure-item observe-pressure-card">
            <span className="observe-pressure-dot" data-pressure="low" />
            <span className="observe-pressure-count">{pressureCounts.low}</span>
            <span className="observe-pressure-label">low</span>
          </div>
          <div className="observe-pressure-item observe-pressure-card">
            <span className="observe-pressure-dot" data-pressure="medium" />
            <span className="observe-pressure-count">{pressureCounts.medium}</span>
            <span className="observe-pressure-label">medium</span>
          </div>
          <div className="observe-pressure-item observe-pressure-card">
            <span className="observe-pressure-dot" data-pressure="high" />
            <span className="observe-pressure-count">{pressureCounts.high}</span>
            <span className="observe-pressure-label">high</span>
          </div>
        </div>
        <p className="observe-meta">Based on {active.length} active {active.length === 1 ? 'entry' : 'entries'}</p>
      </div>
    </div>
  );
}
