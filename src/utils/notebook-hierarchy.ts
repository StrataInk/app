export interface NotebookPath {
  notebook: string;
  section: string;
}

export function parseNotebookPath(raw: string): NotebookPath {
  if (!raw) return { notebook: '', section: '' };
  const slashIdx = raw.indexOf('/');
  if (slashIdx === -1) return { notebook: raw, section: 'General' };
  return {
    notebook: raw.substring(0, slashIdx).trim(),
    section: raw.substring(slashIdx + 1).trim() || 'General',
  };
}

export function buildNotebookPath(notebook: string, section: string): string {
  if (!notebook) return '';
  if (!section || section === 'General') return notebook;
  return `${notebook}/${section}`;
}

export function getUniqueNotebooks(notebookStrings: string[]): string[] {
  const set = new Set<string>();
  for (const raw of notebookStrings) {
    const { notebook } = parseNotebookPath(raw);
    if (notebook) set.add(notebook);
  }
  return [...set].sort();
}

export function getSectionsForNotebook(notebookStrings: string[], targetNotebook: string): string[] {
  const set = new Set<string>();
  for (const raw of notebookStrings) {
    const { notebook, section } = parseNotebookPath(raw);
    if (notebook === targetNotebook && section) set.add(section);
  }
  const sections = [...set].sort();
  const genIdx = sections.indexOf('General');
  if (genIdx > 0) {
    sections.splice(genIdx, 1);
    sections.unshift('General');
  }
  return sections;
}
