import { useState, useEffect, useCallback } from 'react';
import {
  Settings, Palette, Type, FolderOpen, Info,
  Monitor, Moon, Sun, ChevronRight,
  Cloud, Puzzle, Coffee, Feather, BookOpen, Pen,
} from 'lucide-react';
import { usePreferences } from '../state/PreferencesContext';
import { Toast } from '../components/Toast';
import { isWeb } from '../lib/env';
import type { Preferences } from '../state/preferences';

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
  const [showToast, setShowToast] = useState(false);
  const { prefs, update } = usePreferences();

  const updateWithToast = useCallback((partial: Partial<Preferences>) => {
    update(partial);
    setShowToast(true);
  }, [update]);

  const hideToast = useCallback(() => setShowToast(false), []);

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
        <div className="settings-sidebar-group-label">Preferences</div>
        {TABS.filter(t => t.id === 'general' || t.id === 'editor' || t.id === 'appearance').map(tab => (
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
        <div className="settings-sidebar-group-label">System</div>
        {TABS.filter(t => t.id === 'storage' || t.id === 'about').map(tab => (
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
        <div className="settings-sidebar-footer">StrataInk v1.0.0</div>
      </div>

      <div className="settings-content">
        {activeTab === 'general' && (
          <div className="settings-panel">
            <h2 className="settings-panel-title">General</h2>

            <div className="settings-section">
              <h3 className="settings-section-title">Defaults</h3>
              <SettingRow label="Default structure" description="Structure assigned to new notes">
                <select className="settings-select" value={prefs.defaultStructure} onChange={e => updateWithToast({ defaultStructure: e.target.value })}>
                  <option value="thought">Thought</option>
                  <option value="idea">Idea</option>
                  <option value="question">Question</option>
                  <option value="decision">Decision</option>
                  <option value="system">System</option>
                  <option value="insight">Insight</option>
                </select>
              </SettingRow>
              <SettingRow label="Default pressure" description="Pressure level assigned to new notes">
                <select className="settings-select" value={prefs.defaultPressure} onChange={e => updateWithToast({ defaultPressure: e.target.value })}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </SettingRow>
              <SettingRow label="Auto-save delay" description="Milliseconds before saving after typing stops">
                <select className="settings-select" value={prefs.autosaveInterval} onChange={e => updateWithToast({ autosaveInterval: e.target.value })}>
                  <option value="300">300ms (fast)</option>
                  <option value="600">600ms (default)</option>
                  <option value="1000">1 second</option>
                  <option value="2000">2 seconds</option>
                </select>
              </SettingRow>
              <SettingRow label="Default editor mode" description="Editor mode when opening a note">
                <select className="settings-select" value={prefs.editorModeDefault} onChange={e => updateWithToast({ editorModeDefault: e.target.value as 'write' | 'split' | 'preview' })}>
                  <option value="write">Write</option>
                  <option value="split">Split</option>
                  <option value="preview">Preview</option>
                </select>
              </SettingRow>
            </div>

            <div className="settings-section">
              <h3 className="settings-section-title">Sync</h3>
              <div className="settings-empty-state">
                <Cloud size={24} strokeWidth={1.5} className="settings-empty-state-icon" />
                <span className="settings-empty-state-title">Sync is not yet available</span>
                <span className="settings-empty-state-desc">Your notes are stored locally. Cloud sync will be supported in a future update.</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'editor' && (
          <div className="settings-panel">
            <h2 className="settings-panel-title">Editor</h2>

            <div className="settings-section">
              <h3 className="settings-section-title">Typography</h3>
              <SettingRow label="Font family" description="Typeface used in the editor and preview">
                <select className="settings-select" value={prefs.fontFamily} onChange={e => updateWithToast({ fontFamily: e.target.value })}>
                  <option value="system">System default</option>
                  <option value="inter">Inter</option>
                  <option value="georgia">Georgia</option>
                  <option value="consolas">Consolas</option>
                  <option value="fira-code">Fira Code</option>
                </select>
              </SettingRow>
              <SettingRow label="Font size" description="Base font size in pixels">
                <select className="settings-select" value={prefs.fontSize} onChange={e => updateWithToast({ fontSize: e.target.value })}>
                  <option value="13">13px</option>
                  <option value="14">14px</option>
                  <option value="15">15px</option>
                  <option value="16">16px</option>
                  <option value="18">18px</option>
                  <option value="20">20px</option>
                </select>
              </SettingRow>
              <SettingRow label="Line height" description="Line spacing multiplier">
                <select className="settings-select" value={prefs.lineHeight} onChange={e => updateWithToast({ lineHeight: e.target.value })}>
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
                <select className="settings-select" value={prefs.tabSize} onChange={e => updateWithToast({ tabSize: e.target.value })}>
                  <option value="2">2 spaces</option>
                  <option value="4">4 spaces</option>
                </select>
              </SettingRow>
              <SettingToggle label="Word wrap" description="Wrap long lines instead of horizontal scrolling" checked={prefs.wordWrap} onChange={v => updateWithToast({ wordWrap: v })} />
              <SettingToggle label="Line numbers" description="Show line numbers in the editor gutter" checked={prefs.showLineNumbers} onChange={v => updateWithToast({ showLineNumbers: v })} />
              <SettingToggle label="Spell check" description="Enable browser spell checking in the editor" checked={prefs.spellCheck} onChange={v => updateWithToast({ spellCheck: v })} />
            </div>

            <div className="settings-section">
              <h3 className="settings-section-title">Extensions</h3>
              <div className="settings-empty-state">
                <Puzzle size={24} strokeWidth={1.5} className="settings-empty-state-icon" />
                <span className="settings-empty-state-title">Extensions coming soon</span>
                <span className="settings-empty-state-desc">Editor extensions and plugins will be supported in a future update.</span>
              </div>
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
                  selected={prefs.theme === 'nord-dark'}
                  onSelect={() => updateWithToast({ theme: 'nord-dark' })}
                />
                <ThemeCard
                  id="editorial-light"
                  label="Editorial Light"
                  description="Clean, warm light theme with confident typography"
                  icon={<Sun size={20} strokeWidth={1.5} />}
                  colors={['#fafaf9', '#f5f5f4', '#292524', '#6366f1']}
                  selected={prefs.theme === 'editorial-light'}
                  onSelect={() => updateWithToast({ theme: 'editorial-light' })}
                />
                <ThemeCard
                  id="editorial-dark"
                  label="Editorial Dark"
                  description="Dark variant with warm editorial accents"
                  icon={<Monitor size={20} strokeWidth={1.5} />}
                  colors={['#1c1917', '#292524', '#fafaf9', '#c9879a']}
                  selected={prefs.theme === 'editorial-dark'}
                  onSelect={() => updateWithToast({ theme: 'editorial-dark' })}
                />
                <ThemeCard
                  id="obsidian-dark"
                  label="Obsidian"
                  description="Deep dark with violet accents"
                  icon={<Moon size={20} strokeWidth={1.5} />}
                  colors={['#1e1e2e', '#262637', '#7c3aed', '#a78bfa']}
                  selected={prefs.theme === 'obsidian-dark'}
                  onSelect={() => updateWithToast({ theme: 'obsidian-dark' })}
                />
                <ThemeCard
                  id="notion-light"
                  label="Notion"
                  description="Clean minimal light theme"
                  icon={<BookOpen size={20} strokeWidth={1.5} />}
                  colors={['#ffffff', '#f7f6f3', '#37352f', '#2eaadc']}
                  selected={prefs.theme === 'notion-light'}
                  onSelect={() => updateWithToast({ theme: 'notion-light' })}
                />
                <ThemeCard
                  id="bear-light"
                  label="Bear"
                  description="Warm light theme with red accents"
                  icon={<Feather size={20} strokeWidth={1.5} />}
                  colors={['#ffffff', '#f5f5f5', '#333333', '#dc2626']}
                  selected={prefs.theme === 'bear-light'}
                  onSelect={() => updateWithToast({ theme: 'bear-light' })}
                />
                <ThemeCard
                  id="ia-writer-light"
                  label="iA Writer"
                  description="Focused writing with blue accents"
                  icon={<Pen size={20} strokeWidth={1.5} />}
                  colors={['#fafafa', '#f0f0f0', '#1a1a1a', '#2563eb']}
                  selected={prefs.theme === 'ia-writer-light'}
                  onSelect={() => updateWithToast({ theme: 'ia-writer-light' })}
                />
                <ThemeCard
                  id="typora-sepia"
                  label="Typora Sepia"
                  description="Warm sepia tones for comfortable reading"
                  icon={<Coffee size={20} strokeWidth={1.5} />}
                  colors={['#faf4ed', '#f2ead6', '#5b4636', '#8b6914']}
                  selected={prefs.theme === 'typora-sepia'}
                  onSelect={() => updateWithToast({ theme: 'typora-sepia' })}
                />
                <ThemeCard
                  id="dracula-dark"
                  label="Dracula"
                  description="Vibrant dark with purple and pink"
                  icon={<Moon size={20} strokeWidth={1.5} />}
                  colors={['#282a36', '#44475a', '#bd93f9', '#ff79c6']}
                  selected={prefs.theme === 'dracula-dark'}
                  onSelect={() => updateWithToast({ theme: 'dracula-dark' })}
                />
                <ThemeCard
                  id="solarized-dark"
                  label="Solarized"
                  description="Classic dark with cyan and blue"
                  icon={<Sun size={20} strokeWidth={1.5} />}
                  colors={['#002b36', '#073642', '#268bd2', '#2aa198']}
                  selected={prefs.theme === 'solarized-dark'}
                  onSelect={() => updateWithToast({ theme: 'solarized-dark' })}
                />
                <ThemeCard
                  id="gruvbox-dark"
                  label="Gruvbox"
                  description="Retro dark with warm oranges and greens"
                  icon={<Monitor size={20} strokeWidth={1.5} />}
                  colors={['#282828', '#3c3836', '#fe8019', '#b8bb26']}
                  selected={prefs.theme === 'gruvbox-dark'}
                  onSelect={() => updateWithToast({ theme: 'gruvbox-dark' })}
                />
              </div>
            </div>

            <div className="settings-section">
              <h3 className="settings-section-title">Layout</h3>
              <SettingRow label="Sidebar width" description="Width of the navigation sidebar in pixels">
                <select className="settings-select" value={prefs.sidebarWidth} onChange={e => updateWithToast({ sidebarWidth: e.target.value })}>
                  <option value="180">Narrow (180px)</option>
                  <option value="220">Default (220px)</option>
                  <option value="260">Wide (260px)</option>
                </select>
              </SettingRow>
              <SettingRow label="Note list width" description="Width of the note list panel in pixels">
                <select className="settings-select" value={prefs.notelistWidth} onChange={e => updateWithToast({ notelistWidth: e.target.value })}>
                  <option value="240">Narrow (240px)</option>
                  <option value="300">Default (300px)</option>
                  <option value="360">Wide (360px)</option>
                </select>
              </SettingRow>
              <SettingRow label="Editor max width" description="Maximum width of the editor content area">
                <select className="settings-select" value={prefs.editorMaxWidth} onChange={e => updateWithToast({ editorMaxWidth: e.target.value })}>
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
              {isWeb ? (
                <div className="settings-empty-state">
                  <FolderOpen size={24} strokeWidth={1.5} className="settings-empty-state-icon" />
                  <span className="settings-empty-state-title">Desktop only</span>
                  <span className="settings-empty-state-desc">Vault location is only configurable in the desktop app. The web demo uses browser storage.</span>
                </div>
              ) : (
                <>
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
                </>
              )}
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
                <ShortcutRow keys="Ctrl+K" action="Command palette" />
                <ShortcutRow keys="Alt+Up/Down" action="Navigate pages" />
                <ShortcutRow keys="Ctrl+Tab" action="Cycle pages" />
                <ShortcutRow keys="Ctrl+B" action="Bold" />
                <ShortcutRow keys="Ctrl+I" action="Italic" />
                <ShortcutRow keys="Ctrl+Shift+C" action="Insert code block" />
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
      <Toast message="Applied" visible={showToast} onHide={hideToast} />
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
