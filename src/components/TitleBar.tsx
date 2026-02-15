import { useState, useEffect } from 'react';
import {
  Minus, Square, X, Maximize2, ChevronDown,
  Home, PlusSquare, Pen, Eye, Menu,
} from 'lucide-react';
import type { RibbonTab } from './Ribbon';
import { isWeb } from '../lib/env';

interface TitleBarProps {
  ribbonCollapsed: boolean;
  onRibbonCollapse: (collapsed: boolean) => void;
  onRibbonTabActivate: (tab: RibbonTab) => void;
  activeRibbonTab: RibbonTab;
  hasActiveEntry: boolean;
  onToggleSidebar: () => void;
}

const COMMAND_TABS: { id: RibbonTab; label: string; icon: React.ReactNode }[] = [
  { id: 'home', label: 'Home', icon: <Home size={13} strokeWidth={1.5} /> },
  { id: 'insert', label: 'Insert', icon: <PlusSquare size={13} strokeWidth={1.5} /> },
  { id: 'draw', label: 'Draw', icon: <Pen size={13} strokeWidth={1.5} /> },
  { id: 'view', label: 'View', icon: <Eye size={13} strokeWidth={1.5} /> },
];

export function TitleBar({
  ribbonCollapsed,
  onRibbonCollapse,
  onRibbonTabActivate,
  activeRibbonTab,
  hasActiveEntry,
  onToggleSidebar,
}: TitleBarProps) {
  const [maximized, setMaximized] = useState(false);

  useEffect(() => {
    window.strata.windowIsMaximized().then(setMaximized);
  }, []);

  const handleMinimize = () => window.strata.windowMinimize();
  const handleMaximize = async () => {
    await window.strata.windowMaximize();
    const isMax = await window.strata.windowIsMaximized();
    setMaximized(isMax);
  };
  const handleClose = () => window.strata.windowClose();

  const handleTabClick = (tab: RibbonTab) => {
    if (activeRibbonTab === tab && !ribbonCollapsed) {
      onRibbonCollapse(true);
    } else {
      onRibbonTabActivate(tab);
      onRibbonCollapse(false);
    }
  };

  return (
    <div className="app-chrome">
      <div className="titlebar">
        <div className="titlebar-drag">
          <button className="titlebar-btn titlebar-hamburger" onClick={onToggleSidebar} title="Toggle sidebar">
            <Menu size={15} strokeWidth={1.5} />
          </button>
          <span className="titlebar-title">StrataInk</span>
        </div>
        {!isWeb && (
          <div className="titlebar-controls">
            <button className="titlebar-btn" onClick={handleMinimize} title="Minimize">
              <Minus size={14} strokeWidth={1.5} />
            </button>
            <button className="titlebar-btn" onClick={handleMaximize} title={maximized ? 'Restore' : 'Maximize'}>
              {maximized ? <Maximize2 size={13} strokeWidth={1.5} /> : <Square size={12} strokeWidth={1.5} />}
            </button>
            <button className="titlebar-btn titlebar-btn--close" onClick={handleClose} title="Close">
              <X size={15} strokeWidth={1.5} />
            </button>
          </div>
        )}
      </div>

      {hasActiveEntry && (
        <div className="command-bar">
          <div className="command-bar-tabs">
            {COMMAND_TABS.map(t => (
              <button
                key={t.id}
                className={`command-bar-btn ${activeRibbonTab === t.id && !ribbonCollapsed ? 'active' : ''}`}
                onClick={() => handleTabClick(t.id)}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>
          <div className="command-bar-spacer" />
          <button
            className="command-bar-collapse"
            onClick={() => onRibbonCollapse(!ribbonCollapsed)}
            title={ribbonCollapsed ? 'Expand ribbon' : 'Collapse ribbon'}
          >
            <ChevronDown size={12} className={ribbonCollapsed ? 'rotated' : ''} />
          </button>
        </div>
      )}
    </div>
  );
}
