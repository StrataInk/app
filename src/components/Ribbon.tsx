import { useState } from 'react';
import {
  Bold, Italic, Underline, Strikethrough, Highlighter,
  List, ListOrdered, CheckSquare,
  Heading1, Heading2, Heading3, Type,
  Table, Image, Link, Paperclip, Code, Minus as HRIcon, Calendar,
  Pen, PenTool, Eraser,
  Eye, Columns2, Edit3, ZoomIn, ZoomOut, Maximize,
} from 'lucide-react';
import type { EditorMode } from './editor/MarkdownEditor';

export type RibbonTab = 'home' | 'insert' | 'draw' | 'view';

export interface RibbonCommand {
  type: string;
  payload?: string;
}

interface RibbonProps {
  activeTab: RibbonTab;
  onCommand: (cmd: RibbonCommand) => void;
  editorMode: EditorMode;
  onModeChange: (mode: EditorMode) => void;
  drawingActive: boolean;
  onDrawingToggle: () => void;
  collapsed: boolean;
}

export function Ribbon({
  activeTab,
  onCommand,
  editorMode,
  onModeChange,
  drawingActive,
  onDrawingToggle,
  collapsed,
}: RibbonProps) {
  if (collapsed) return null;

  return (
    <div className="ribbon">
      <div className="ribbon-body">
        {activeTab === 'home' && (
          <HomeTab onCommand={onCommand} />
        )}
        {activeTab === 'insert' && (
          <InsertTab onCommand={onCommand} />
        )}
        {activeTab === 'draw' && (
          <DrawTab
            drawingActive={drawingActive}
            onDrawingToggle={onDrawingToggle}
            onCommand={onCommand}
          />
        )}
        {activeTab === 'view' && (
          <ViewTab
            editorMode={editorMode}
            onModeChange={onModeChange}
            onCommand={onCommand}
          />
        )}
      </div>
    </div>
  );
}

// ── Home Tab ─────────────────────────────────────────────────────

function HomeTab({ onCommand }: { onCommand: (cmd: RibbonCommand) => void }) {
  return (
    <>
      <RibbonGroup label="Clipboard">
        <RibbonBtn icon={<ClipboardPaste />} label="Paste" onClick={() => onCommand({ type: 'paste' })} />
        <RibbonBtnSmall icon={<ClipboardCut />} label="Cut" onClick={() => onCommand({ type: 'cut' })} />
        <RibbonBtnSmall icon={<ClipboardCopy />} label="Copy" onClick={() => onCommand({ type: 'copy' })} />
      </RibbonGroup>

      <div className="ribbon-separator" />

      <RibbonGroup label="Format">
        <RibbonBtnSmall icon={<Bold size={14} strokeWidth={2} />} label="Bold" onClick={() => onCommand({ type: 'format', payload: 'bold' })} />
        <RibbonBtnSmall icon={<Italic size={14} strokeWidth={2} />} label="Italic" onClick={() => onCommand({ type: 'format', payload: 'italic' })} />
        <RibbonBtnSmall icon={<Underline size={14} strokeWidth={1.5} />} label="Underline" onClick={() => onCommand({ type: 'format', payload: 'underline' })} />
        <RibbonBtnSmall icon={<Strikethrough size={14} strokeWidth={1.5} />} label="Strike" onClick={() => onCommand({ type: 'format', payload: 'strikethrough' })} />
        <RibbonBtnSmall icon={<Highlighter size={14} strokeWidth={1.5} />} label="Highlight" onClick={() => onCommand({ type: 'format', payload: 'highlight' })} />
      </RibbonGroup>

      <div className="ribbon-separator" />

      <RibbonGroup label="Paragraph">
        <RibbonBtnSmall icon={<List size={14} strokeWidth={1.5} />} label="Bullets" onClick={() => onCommand({ type: 'format', payload: 'bullet-list' })} />
        <RibbonBtnSmall icon={<ListOrdered size={14} strokeWidth={1.5} />} label="Numbered" onClick={() => onCommand({ type: 'format', payload: 'ordered-list' })} />
        <RibbonBtnSmall icon={<CheckSquare size={14} strokeWidth={1.5} />} label="Task" onClick={() => onCommand({ type: 'format', payload: 'task-list' })} />
      </RibbonGroup>

      <div className="ribbon-separator" />

      <RibbonGroup label="Styles">
        <RibbonBtnSmall icon={<Heading1 size={14} strokeWidth={1.5} />} label="H1" onClick={() => onCommand({ type: 'format', payload: 'h1' })} />
        <RibbonBtnSmall icon={<Heading2 size={14} strokeWidth={1.5} />} label="H2" onClick={() => onCommand({ type: 'format', payload: 'h2' })} />
        <RibbonBtnSmall icon={<Heading3 size={14} strokeWidth={1.5} />} label="H3" onClick={() => onCommand({ type: 'format', payload: 'h3' })} />
        <RibbonBtnSmall icon={<Type size={14} strokeWidth={1.5} />} label="Normal" onClick={() => onCommand({ type: 'format', payload: 'paragraph' })} />
      </RibbonGroup>
    </>
  );
}

// ── Insert Tab ───────────────────────────────────────────────────

function InsertTab({ onCommand }: { onCommand: (cmd: RibbonCommand) => void }) {
  return (
    <>
      <RibbonGroup label="Tables">
        <RibbonBtn icon={<Table size={18} strokeWidth={1.5} />} label="Table" onClick={() => onCommand({ type: 'insert', payload: 'table' })} />
      </RibbonGroup>

      <div className="ribbon-separator" />

      <RibbonGroup label="Media">
        <RibbonBtn icon={<Image size={18} strokeWidth={1.5} />} label="Image" onClick={() => onCommand({ type: 'insert', payload: 'image' })} />
        <RibbonBtn icon={<Paperclip size={18} strokeWidth={1.5} />} label="File" onClick={() => onCommand({ type: 'insert', payload: 'file' })} />
      </RibbonGroup>

      <div className="ribbon-separator" />

      <RibbonGroup label="Content">
        <RibbonBtnSmall icon={<Link size={14} strokeWidth={1.5} />} label="Link" onClick={() => onCommand({ type: 'insert', payload: 'link' })} />
        <RibbonBtnSmall icon={<Code size={14} strokeWidth={1.5} />} label="Code" onClick={() => onCommand({ type: 'insert', payload: 'code-block' })} />
        <RibbonBtnSmall icon={<HRIcon size={14} strokeWidth={1.5} />} label="Divider" onClick={() => onCommand({ type: 'insert', payload: 'divider' })} />
        <RibbonBtnSmall icon={<Calendar size={14} strokeWidth={1.5} />} label="Date" onClick={() => onCommand({ type: 'insert', payload: 'date' })} />
      </RibbonGroup>
    </>
  );
}

// ── Draw Tab ─────────────────────────────────────────────────────

interface DrawTabProps {
  drawingActive: boolean;
  onDrawingToggle: () => void;
  onCommand: (cmd: RibbonCommand) => void;
}

function DrawTab({ drawingActive, onDrawingToggle, onCommand }: DrawTabProps) {
  const [penColor, setPenColor] = useState('#d8dee9');
  const [penSize, setPenSize] = useState(2);

  const COLORS = ['#d8dee9', '#e2c87a', '#c9879a', '#a3be8c', '#81a1c1', '#bf616a'];
  const SIZES = [1, 2, 4, 6];

  return (
    <>
      <RibbonGroup label="Tools">
        <RibbonBtn
          icon={<Pen size={18} strokeWidth={1.5} />}
          label="Pen"
          active={drawingActive}
          onClick={() => { onDrawingToggle(); onCommand({ type: 'draw-tool', payload: 'pen' }); }}
        />
        <RibbonBtn
          icon={<PenTool size={18} strokeWidth={1.5} />}
          label="Highlight"
          onClick={() => { if (!drawingActive) onDrawingToggle(); onCommand({ type: 'draw-tool', payload: 'highlighter' }); }}
        />
        <RibbonBtn
          icon={<Eraser size={18} strokeWidth={1.5} />}
          label="Eraser"
          onClick={() => { if (!drawingActive) onDrawingToggle(); onCommand({ type: 'draw-tool', payload: 'eraser' }); }}
        />
      </RibbonGroup>

      <div className="ribbon-separator" />

      <RibbonGroup label="Color">
        <div className="ribbon-color-row">
          {COLORS.map(c => (
            <button
              key={c}
              className={`ribbon-color-swatch ${penColor === c ? 'active' : ''}`}
              style={{ backgroundColor: c }}
              onClick={() => { setPenColor(c); onCommand({ type: 'draw-color', payload: c }); }}
            />
          ))}
        </div>
      </RibbonGroup>

      <div className="ribbon-separator" />

      <RibbonGroup label="Size">
        <div className="ribbon-size-row">
          {SIZES.map(s => (
            <button
              key={s}
              className={`ribbon-size-btn ${penSize === s ? 'active' : ''}`}
              onClick={() => { setPenSize(s); onCommand({ type: 'draw-size', payload: String(s) }); }}
            >
              <span className="ribbon-size-dot" style={{ width: s + 4, height: s + 4 }} />
            </button>
          ))}
        </div>
      </RibbonGroup>
    </>
  );
}

// ── View Tab ─────────────────────────────────────────────────────

interface ViewTabProps {
  editorMode: EditorMode;
  onModeChange: (mode: EditorMode) => void;
  onCommand: (cmd: RibbonCommand) => void;
}

function ViewTab({ editorMode, onModeChange, onCommand }: ViewTabProps) {
  return (
    <>
      <RibbonGroup label="Editor Mode">
        <RibbonBtn
          icon={<Edit3 size={18} strokeWidth={1.5} />}
          label="Write"
          active={editorMode === 'write'}
          onClick={() => onModeChange('write')}
        />
        <RibbonBtn
          icon={<Columns2 size={18} strokeWidth={1.5} />}
          label="Split"
          active={editorMode === 'split'}
          onClick={() => onModeChange('split')}
        />
        <RibbonBtn
          icon={<Eye size={18} strokeWidth={1.5} />}
          label="Preview"
          active={editorMode === 'preview'}
          onClick={() => onModeChange('preview')}
        />
      </RibbonGroup>

      <div className="ribbon-separator" />

      <RibbonGroup label="Zoom">
        <RibbonBtnSmall icon={<ZoomIn size={14} strokeWidth={1.5} />} label="Zoom In" onClick={() => onCommand({ type: 'zoom', payload: 'in' })} />
        <RibbonBtnSmall icon={<ZoomOut size={14} strokeWidth={1.5} />} label="Zoom Out" onClick={() => onCommand({ type: 'zoom', payload: 'out' })} />
      </RibbonGroup>

      <div className="ribbon-separator" />

      <RibbonGroup label="Window">
        <RibbonBtn
          icon={<Maximize size={18} strokeWidth={1.5} />}
          label="Focus"
          onClick={() => onCommand({ type: 'focus-mode' })}
        />
      </RibbonGroup>
    </>
  );
}

// ── Shared UI pieces ─────────────────────────────────────────────

function RibbonGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="ribbon-group">
      <div className="ribbon-group-items">{children}</div>
      <div className="ribbon-group-label">{label}</div>
    </div>
  );
}

function RibbonBtn({ icon, label, onClick, active }: { icon: React.ReactNode; label: string; onClick: () => void; active?: boolean }) {
  return (
    <button className={`ribbon-btn ${active ? 'active' : ''}`} onClick={onClick} title={label}>
      <span className="ribbon-btn-icon">{icon}</span>
      <span className="ribbon-btn-label">{label}</span>
    </button>
  );
}

function RibbonBtnSmall({ icon, label, onClick, active }: { icon: React.ReactNode; label: string; onClick: () => void; active?: boolean }) {
  return (
    <button className={`ribbon-btn-sm ${active ? 'active' : ''}`} onClick={onClick} title={label}>
      {icon}
    </button>
  );
}

// ── Clipboard Icons (lucide doesn't have these exact variants) ───

function ClipboardPaste() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="8" y="2" width="8" height="4" rx="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="M12 11v6" />
      <path d="m9 14 3-3 3 3" />
    </svg>
  );
}

function ClipboardCut() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <line x1="20" y1="4" x2="8.12" y2="15.88" />
      <line x1="14.47" y1="14.48" x2="20" y2="20" />
      <line x1="8.12" y1="8.12" x2="12" y2="12" />
    </svg>
  );
}

function ClipboardCopy() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}
