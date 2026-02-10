import { useState, useEffect } from 'react';
import { Minus, Square, X, Maximize2 } from 'lucide-react';

export function TitleBar() {
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

  return (
    <div className="titlebar">
      <div className="titlebar-drag">
        <span className="titlebar-title">StrataInk</span>
      </div>
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
    </div>
  );
}
