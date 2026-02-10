import { useState, useEffect, useRef } from 'react';
import { Plus } from 'lucide-react';

interface SectionTabsProps {
  sections: string[];
  activeSection: string | null;
  onSectionSelect: (section: string | null) => void;
  onCreateSection: (name: string) => void;
  onRenameSection: (oldName: string, newName: string) => void;
}

export function SectionTabs({
  sections,
  activeSection,
  onSectionSelect,
  onCreateSection,
  onRenameSection,
}: SectionTabsProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [createInput, setCreateInput] = useState('');
  const [renamingSection, setRenamingSection] = useState<string | null>(null);
  const [renameInput, setRenameInput] = useState('');
  const createInputRef = useRef<HTMLInputElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isCreating) createInputRef.current?.focus();
  }, [isCreating]);

  useEffect(() => {
    if (renamingSection) renameInputRef.current?.focus();
  }, [renamingSection]);

  const confirmCreate = () => {
    const name = createInput.trim();
    if (name) onCreateSection(name);
    setIsCreating(false);
    setCreateInput('');
  };

  const confirmRename = () => {
    const name = renameInput.trim();
    if (name && renamingSection && name !== renamingSection) {
      onRenameSection(renamingSection, name);
    }
    setRenamingSection(null);
    setRenameInput('');
  };

  return (
    <div className="section-tabs">
      <button
        className={`section-tab ${activeSection === null ? 'active' : ''}`}
        onClick={() => onSectionSelect(null)}
      >
        All
      </button>
      {sections.map(sec => (
        renamingSection === sec ? (
          <div key={sec} className="section-tab-input">
            <input
              ref={renameInputRef}
              value={renameInput}
              onChange={e => setRenameInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') confirmRename();
                if (e.key === 'Escape') { setRenamingSection(null); setRenameInput(''); }
              }}
              onBlur={confirmRename}
            />
          </div>
        ) : (
          <button
            key={sec}
            className={`section-tab ${activeSection === sec ? 'active' : ''}`}
            onClick={() => onSectionSelect(sec)}
            onDoubleClick={() => { setRenamingSection(sec); setRenameInput(sec); }}
          >
            {sec}
          </button>
        )
      ))}
      {isCreating ? (
        <div className="section-tab-input">
          <input
            ref={createInputRef}
            placeholder="Section name"
            value={createInput}
            onChange={e => setCreateInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') confirmCreate();
              if (e.key === 'Escape') { setIsCreating(false); setCreateInput(''); }
            }}
            onBlur={confirmCreate}
          />
        </div>
      ) : (
        <button
          className="section-tab-add"
          onClick={() => setIsCreating(true)}
          title="New section"
        >
          <Plus size={14} strokeWidth={1.5} />
        </button>
      )}
    </div>
  );
}
