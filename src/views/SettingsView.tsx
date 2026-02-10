import { useState, useEffect } from 'react';
import {
  Settings, Palette, Type, FolderOpen, Info,
  Monitor, Moon, Sun, ChevronRight,
} from 'lucide-react';

type SettingsTab = 'general' | 'editor' | 'appearance' | 'storage' | 'about';

const TABS: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
  { id: 'general', label: 'General', icon: <Settings size={15} strokeWidth={1.5} /> },
  { id: 'editor', label: 'Editor', icon: <Type size={15} strokeWidth={1.5} /> },
  { id: 'appearance', label: 'Appearance', icon: <Palette size={15} strokeWidth={1.5} /> },
  { id: 'storage', label: 'Storage', icon: <FolderOpen size={15} strokeWidth={1.5} /> },
  { id: 'about', label: 'About', icon: <Info size={15} strokeWidth={1.5} /> },
];

export function SettingsView() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [vaultPath, setVaultPath] = useState('');

  // General settings
  const [startView, setStartView] = useState('last-opened');
  const [defaultStructure, setDefaultStructure] = useState('thought');
  const [defaultPressure, setDefaultPressure] = useState('low');
  const [autosaveInterval, setAutosaveInterval] = useState('600');

  // Editor settings
  const [fontFamily, setFontFamily] = useState('system');
  const [fontSize, setFontSize] = useState('16');
  const [lineHeight, setLineHeight] = useState('1.75');
  const [showLineNumbers, setShowLineNumbers] = useState(false);
  const [spellCheck, setSpellCheck] = useState(true);
  const [tabSize, setTabSize] = useState('2');
  const [wordWrap, setWordWrap] = useState(true);

  // Appearance
  const [theme, setTheme] = useState('nord-dark');
  const [sidebarWidth, setSidebarWidth] = useState('220');
  const [notelistWidth, setNotelistWidth] = useState('300');
  const [editorMaxWidth, setEditorMaxWidth] = useState('720');

  useEffect(() => {
    window.strata.getSettings().then(s => setVaultPath(s.vaultPath));
  }, []);

  const handlePickFolder = async () => {
    const picked = await window.strata.pickFolder();
    if (picked) {
      await window.strata.setVaultPath(picked);
      setVaultPath(picked);
    }
  };

  return (
    <div className="settings-layout">
      <div className="settings-sidebar">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`settings-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="settings-tab-icon">{tab.icon}</span>
            <span className="settings-tab-label">{tab.label}</span>
            <ChevronRight size={12} className="settings-tab-arrow" />
          </button>
        ))}
      </div>

      <div className="settings-content">
        {activeTab === 'general' && (
          <div className="settings-panel">
            <h2 className="settings-panel-title">General</h2>

            <div className="settings-section">
              <h3 className="settings-section-title">Startup</h3>
              <SettingRow label="Open on launch" description="Choose what to show when StrataInk starts">
                <select className="settings-select" value={startView} onChange={e => setStartView(e.target.value)}>
                  <option value="last-opened">Last opened note</option>
                  <option value="new-note">New blank note</option>
                  <option value="all-notes">All Notes view</option>
                </select>
              </SettingRow>
            </div>

            <div className="settings-section">
              <h3 className="settings-section-title">Defaults</h3>
              <SettingRow label="Default structure" description="Structure assigned to new notes">
                <select className="settings-select" value={defaultStructure} onChange={e => setDefaultStructure(e.target.value)}>
                  <option value="thought">Thought</option>
                  <option value="idea">Idea</option>
                  <option value="question">Question</option>
                  <option value="decision">Decision</option>
                  <option value="system">System</option>
                  <option value="insight">Insight</option>
                </select>
              </SettingRow>
              <SettingRow label="Default pressure" description="Pressure level assigned to new notes">
                <select className="settings-select" value={defaultPressure} onChange={e => setDefaultPressure(e.target.value)}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </SettingRow>
              <SettingRow label="Auto-save delay" description="Milliseconds before saving after typing stops">
                <select className="settings-select" value={autosaveInterval} onChange={e => setAutosaveInterval(e.target.value)}>
                  <option value="300">300ms (fast)</option>
                  <option value="600">600ms (default)</option>
                  <option value="1000">1 second</option>
                  <option value="2000">2 seconds</option>
                </select>
              </SettingRow>
            </div>
          </div>
        )}

        {activeTab === 'editor' && (
          <div className="settings-panel">
            <h2 className="settings-panel-title">Editor</h2>

            <div className="settings-section">
              <h3 className="settings-section-title">Typography</h3>
              <SettingRow label="Font family" description="Typeface used in the editor and preview">
                <select className="settings-select" value={fontFamily} onChange={e => setFontFamily(e.target.value)}>
                  <option value="system">System default</option>
                  <option value="inter">Inter</option>
                  <option value="georgia">Georgia</option>
                  <option value="consolas">Consolas</option>
                  <option value="fira-code">Fira Code</option>
                </select>
              </SettingRow>
              <SettingRow label="Font size" description="Base font size in pixels">
                <select className="settings-select" value={fontSize} onChange={e => setFontSize(e.target.value)}>
                  <option value="13">13px</option>
                  <option value="14">14px</option>
                  <option value="15">15px</option>
                  <option value="16">16px</option>
                  <option value="18">18px</option>
                  <option value="20">20px</option>
                </select>
              </SettingRow>
              <SettingRow label="Line height" description="Line spacing multiplier">
                <select className="settings-select" value={lineHeight} onChange={e => setLineHeight(e.target.value)}>
                  <option value="1.4">Compact (1.4)</option>
                  <option value="1.6">Normal (1.6)</option>
                  <option value="1.75">Relaxed (1.75)</option>
                  <option value="2.0">Spacious (2.0)</option>
                </select>
              </SettingRow>
            </div>

            <div className="settings-section">
              <h3 className="settings-section-title">Behavior</h3>
              <SettingRow label="Tab size" description="Number of spaces per tab">
                <select className="settings-select" value={tabSize} onChange={e => setTabSize(e.target.value)}>
                  <option value="2">2 spaces</option>
                  <option value="4">4 spaces</option>
                </select>
              </SettingRow>
              <SettingToggle label="Word wrap" description="Wrap long lines instead of horizontal scrolling" checked={wordWrap} onChange={setWordWrap} />
              <SettingToggle label="Line numbers" description="Show line numbers in the editor gutter" checked={showLineNumbers} onChange={setShowLineNumbers} />
              <SettingToggle label="Spell check" description="Enable browser spell checking in the editor" checked={spellCheck} onChange={setSpellCheck} />
            </div>
          </div>
        )}

        {activeTab === 'appearance' && (
          <div className="settings-panel">
            <h2 className="settings-panel-title">Appearance</h2>

            <div className="settings-section">
              <h3 className="settings-section-title">Theme</h3>
              <div className="settings-theme-grid">
                <ThemeCard
                  id="nord-dark"
                  label="Nord Dark"
                  description="Dark blue theme with arctic accents"
                  icon={<Moon size={20} strokeWidth={1.5} />}
                  colors={['#2e3440', '#3b4252', '#81a1c1', '#88c0d0']}
                  selected={theme === 'nord-dark'}
                  onSelect={() => setTheme('nord-dark')}
                />
                <ThemeCard
                  id="editorial-light"
                  label="Editorial Light"
                  description="Clean, warm light theme with confident typography"
                  icon={<Sun size={20} strokeWidth={1.5} />}
                  colors={['#fafaf9', '#f5f5f4', '#292524', '#e2c87a']}
                  selected={theme === 'editorial-light'}
                  onSelect={() => setTheme('editorial-light')}
                />
                <ThemeCard
                  id="editorial-dark"
                  label="Editorial Dark"
                  description="Dark variant with warm editorial accents"
                  icon={<Monitor size={20} strokeWidth={1.5} />}
                  colors={['#1c1917', '#292524', '#fafaf9', '#c9879a']}
                  selected={theme === 'editorial-dark'}
                  onSelect={() => setTheme('editorial-dark')}
                />
              </div>
            </div>

            <div className="settings-section">
              <h3 className="settings-section-title">Layout</h3>
              <SettingRow label="Sidebar width" description="Width of the navigation sidebar in pixels">
                <select className="settings-select" value={sidebarWidth} onChange={e => setSidebarWidth(e.target.value)}>
                  <option value="180">Narrow (180px)</option>
                  <option value="220">Default (220px)</option>
                  <option value="260">Wide (260px)</option>
                </select>
              </SettingRow>
              <SettingRow label="Note list width" description="Width of the note list panel in pixels">
                <select className="settings-select" value={notelistWidth} onChange={e => setNotelistWidth(e.target.value)}>
                  <option value="240">Narrow (240px)</option>
                  <option value="300">Default (300px)</option>
                  <option value="360">Wide (360px)</option>
                </select>
              </SettingRow>
              <SettingRow label="Editor max width" description="Maximum width of the editor content area">
                <select className="settings-select" value={editorMaxWidth} onChange={e => setEditorMaxWidth(e.target.value)}>
                  <option value="640">Narrow (640px)</option>
                  <option value="720">Default (720px)</option>
                  <option value="860">Wide (860px)</option>
                  <option value="100%">Full width</option>
                </select>
              </SettingRow>
            </div>
          </div>
        )}

        {activeTab === 'storage' && (
          <div className="settings-panel">
            <h2 className="settings-panel-title">Storage</h2>

            <div className="settings-section">
              <h3 className="settings-section-title">Vault Location</h3>
              <p className="settings-description">
                All entries are stored as Markdown files with YAML frontmatter in this folder.
                Changing the path does not move existing files.
              </p>
              <div className="settings-path">
                <code>{vaultPath}</code>
                <button className="btn btn-secondary btn-sm" onClick={handlePickFolder}>
                  Change
                </button>
              </div>
            </div>

            <div className="settings-section">
              <h3 className="settings-section-title">File Format</h3>
              <div className="settings-info-grid">
                <div className="settings-info-item">
                  <span className="settings-info-label">Format</span>
                  <span className="settings-info-value">Markdown + YAML frontmatter</span>
                </div>
                <div className="settings-info-item">
                  <span className="settings-info-label">Entry files</span>
                  <span className="settings-info-value">{vaultPath}/entries/*.md</span>
                </div>
                <div className="settings-info-item">
                  <span className="settings-info-label">Connections</span>
                  <span className="settings-info-value">{vaultPath}/.strata/connections.json</span>
                </div>
                <div className="settings-info-item">
                  <span className="settings-info-label">Config</span>
                  <span className="settings-info-value">{vaultPath}/.strata/settings.json</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'about' && (
          <div className="settings-panel">
            <h2 className="settings-panel-title">About</h2>

            <div className="settings-section">
              <div className="settings-about-brand">
                <span className="settings-about-name">StrataInk</span>
                <span className="settings-about-version">v1.0.0</span>
              </div>
              <p className="settings-description">
                A local-first note-taking application inspired by Microsoft OneNote.
                Your thoughts, structured. No cloud, no analytics, no AI — just you and your notes.
              </p>
            </div>

            <div className="settings-section">
              <h3 className="settings-section-title">Keyboard Shortcuts</h3>
              <div className="settings-shortcuts">
                <ShortcutRow keys="Ctrl+N" action="New note" />
                <ShortcutRow keys="Ctrl+F" action="Search notes" />
                <ShortcutRow keys="Ctrl+B" action="Bold" />
                <ShortcutRow keys="Ctrl+I" action="Italic" />
                <ShortcutRow keys="Ctrl+K" action="Insert link" />
                <ShortcutRow keys="Ctrl+Shift+C" action="Insert code block" />
                <ShortcutRow keys="Ctrl+P" action="Toggle preview" />
              </div>
            </div>

            <div className="settings-section">
              <h3 className="settings-section-title">Technology</h3>
              <div className="settings-info-grid">
                <div className="settings-info-item">
                  <span className="settings-info-label">Platform</span>
                  <span className="settings-info-value">Electron + React</span>
                </div>
                <div className="settings-info-item">
                  <span className="settings-info-label">Editor</span>
                  <span className="settings-info-value">CodeMirror 6</span>
                </div>
                <div className="settings-info-item">
                  <span className="settings-info-label">Storage</span>
                  <span className="settings-info-value">Local filesystem (Markdown)</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Setting Row Components ──────────────────────────────────────────

function SettingRow({ label, description, children }: {
  label: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="setting-row">
      <div className="setting-row-info">
        <span className="setting-row-label">{label}</span>
        <span className="setting-row-description">{description}</span>
      </div>
      <div className="setting-row-control">{children}</div>
    </div>
  );
}

function SettingToggle({ label, description, checked, onChange }: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="setting-row" onClick={() => onChange(!checked)} style={{ cursor: 'pointer' }}>
      <div className="setting-row-info">
        <span className="setting-row-label">{label}</span>
        <span className="setting-row-description">{description}</span>
      </div>
      <div className="setting-row-control">
        <div className={`settings-toggle ${checked ? 'active' : ''}`}>
          <div className="settings-toggle-thumb" />
        </div>
      </div>
    </div>
  );
}

function ThemeCard({ label, description, icon, colors, selected, onSelect }: {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  colors: string[];
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button className={`settings-theme-card ${selected ? 'selected' : ''}`} onClick={onSelect}>
      <div className="settings-theme-preview">
        {colors.map((c, i) => (
          <div key={i} className="settings-theme-swatch" style={{ backgroundColor: c }} />
        ))}
      </div>
      <div className="settings-theme-info">
        <span className="settings-theme-icon">{icon}</span>
        <span className="settings-theme-label">{label}</span>
      </div>
      <span className="settings-theme-desc">{description}</span>
    </button>
  );
}

function ShortcutRow({ keys, action }: { keys: string; action: string }) {
  return (
    <div className="settings-shortcut-row">
      <span className="settings-shortcut-action">{action}</span>
      <kbd className="settings-shortcut-keys">{keys}</kbd>
    </div>
  );
}
