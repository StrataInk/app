interface SectionTabsProps {
  sections: string[];
  activeSection: string | null;
  onSectionSelect: (section: string | null) => void;
}

export function SectionTabs({ sections, activeSection, onSectionSelect }: SectionTabsProps) {
  if (sections.length === 0) return null;

  return (
    <div className="section-tabs">
      <button
        className={`section-tab ${activeSection === null ? 'active' : ''}`}
        onClick={() => onSectionSelect(null)}
      >
        All
      </button>
      {sections.map(sec => (
        <button
          key={sec}
          className={`section-tab ${activeSection === sec ? 'active' : ''}`}
          onClick={() => onSectionSelect(sec)}
        >
          {sec}
        </button>
      ))}
    </div>
  );
}
