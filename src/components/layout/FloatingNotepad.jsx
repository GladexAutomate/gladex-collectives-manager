// @ts-nocheck
import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Minus, Maximize2, Minimize2, FileText, Trash2, Copy, ChevronDown } from 'lucide-react';

const STORAGE_KEY = 'collectives_notepad_v1';

export default function FloatingNotepad({ onClose }) {
  const [mode, setMode] = useState('normal'); // 'normal' | 'maximized' | 'minimized'
  const [content, setContent] = useState(() => localStorage.getItem(STORAGE_KEY) || '');
  const [pos, setPos] = useState({ x: Math.max(80, window.innerWidth - 460), y: 80 });
  const [copied, setCopied] = useState(false);

  const isDragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  useEffect(() => { localStorage.setItem(STORAGE_KEY, content); }, [content]);

  const onTitleMouseDown = useCallback((e) => {
    if (mode !== 'normal') return;
    isDragging.current = true;
    dragOffset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
    e.preventDefault();
  }, [mode, pos]);

  useEffect(() => {
    const onMove = (e) => {
      if (!isDragging.current) return;
      setPos({
        x: Math.max(0, Math.min(window.innerWidth - 420, e.clientX - dragOffset.current.x)),
        y: Math.max(0, Math.min(window.innerHeight - 56, e.clientY - dragOffset.current.y)),
      });
    };
    const onUp = () => { isDragging.current = false; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, []);

  const handleCopyAll = async () => {
    if (!content.trim()) return;
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const lineCount = content ? content.split('\n').length : 0;

  // ── Minimized pill ──────────────────────────────────────────────────────────
  if (mode === 'minimized') {
    return (
      <div
        className="fixed bottom-5 right-5 z-[9999] flex items-center gap-2.5 pl-3 pr-2 py-2 rounded-2xl shadow-2xl cursor-pointer select-none transition-all hover:scale-105 active:scale-95"
        style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', border: '1px solid rgba(251,146,60,0.25)' }}
        onClick={() => setMode('normal')}
        title="Open Notepad"
      >
        <FileText className="w-4 h-4 text-orange-400 flex-shrink-0" />
        <span className="text-xs font-semibold text-white/80">Notepad</span>
        {wordCount > 0 && <span className="text-[10px] text-orange-400/70 font-mono">{wordCount}w</span>}
        <ChevronDown className="w-3.5 h-3.5 text-white/30 rotate-180" />
      </div>
    );
  }

  // ── Window geometry ─────────────────────────────────────────────────────────
  const isMax = mode === 'maximized';
  const windowStyle = isMax
    ? { position: 'fixed', inset: '12px', zIndex: 9999 }
    : { position: 'fixed', left: pos.x, top: pos.y, width: 420, height: 520, zIndex: 9999 };

  return (
    <div
      style={windowStyle}
      className="flex flex-col rounded-2xl overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.6)] select-none"
    >
      {/* ── Title bar ─────────────────────────────────────────────────────── */}
      <div
        onMouseDown={onTitleMouseDown}
        className="flex items-center gap-2 px-4 py-3 flex-shrink-0"
        style={{
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          cursor: isMax ? 'default' : 'grab',
          userSelect: 'none',
        }}
      >
        {/* Traffic lights */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onMouseDown={e => e.stopPropagation()}
            onClick={onClose}
            title="Close"
            className="w-3.5 h-3.5 rounded-full bg-[#ff5f57] hover:bg-[#ff3b30] transition-colors group flex items-center justify-center"
          >
            <X className="w-2 h-2 text-[#8b0000] opacity-0 group-hover:opacity-100" />
          </button>
          <button
            onMouseDown={e => e.stopPropagation()}
            onClick={() => setMode('minimized')}
            title="Minimize"
            className="w-3.5 h-3.5 rounded-full bg-[#febc2e] hover:bg-[#f59e0b] transition-colors group flex items-center justify-center"
          >
            <Minus className="w-2 h-2 text-[#7a5000] opacity-0 group-hover:opacity-100" />
          </button>
          <button
            onMouseDown={e => e.stopPropagation()}
            onClick={() => setMode(m => m === 'maximized' ? 'normal' : 'maximized')}
            title={isMax ? 'Restore' : 'Maximize'}
            className="w-3.5 h-3.5 rounded-full bg-[#28c840] hover:bg-[#22c55e] transition-colors group flex items-center justify-center"
          >
            {isMax
              ? <Minimize2 className="w-2 h-2 text-[#004d00] opacity-0 group-hover:opacity-100" />
              : <Maximize2 className="w-2 h-2 text-[#004d00] opacity-0 group-hover:opacity-100" />
            }
          </button>
        </div>

        {/* Title */}
        <div className="flex-1 flex items-center justify-center gap-1.5 pointer-events-none">
          <FileText className="w-3.5 h-3.5 text-orange-400" />
          <span className="text-[11px] font-semibold text-white/70 tracking-wide">Package Notepad</span>
        </div>

        {/* Stats */}
        <span className="text-[10px] text-white/25 font-mono flex-shrink-0 pointer-events-none">
          {wordCount}w · {lineCount}L
        </span>
      </div>

      {/* ── Toolbar ────────────────────────────────────────────────────────── */}
      <div
        className="flex items-center gap-1 px-3 py-1.5 flex-shrink-0"
        style={{ background: '#12121f', borderBottom: '1px solid rgba(255,255,255,0.04)' }}
      >
        <button
          onClick={handleCopyAll}
          className="flex items-center gap-1 px-2 py-1 rounded text-[10px] text-white/40 hover:text-orange-400 hover:bg-orange-500/10 transition-colors"
        >
          <Copy className="w-3 h-3" />
          {copied ? 'Copied!' : 'Copy All'}
        </button>
        <button
          onClick={() => { if (window.confirm('Clear all notepad content?')) setContent(''); }}
          className="flex items-center gap-1 px-2 py-1 rounded text-[10px] text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <Trash2 className="w-3 h-3" />
          Clear
        </button>
        <div className="flex-1" />
        <span className="text-[9px] text-white/15 italic pr-1">paste copied packages here</span>
      </div>

      {/* ── Editor ─────────────────────────────────────────────────────────── */}
      <textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder={"Paste your copied package details here...\n\n" +
          "╔══════════════════════════════════════╗\n" +
          "  ✈️  PACKAGE NAME\n" +
          "╚══════════════════════════════════════╝\n\n" +
          "DESTINATION: ...\nPACKAGE CODE: ..."}
        className="flex-1 resize-none p-4 text-[11px] leading-relaxed focus:outline-none"
        style={{
          background: '#0d0d1a',
          color: 'rgba(255,255,255,0.75)',
          fontFamily: "'Courier New', 'Consolas', monospace",
          caretColor: '#f97316',
          lineHeight: '1.65',
        }}
        spellCheck={false}
      />

      {/* ── Status bar ─────────────────────────────────────────────────────── */}
      <div
        className="flex items-center gap-4 px-4 py-1.5 flex-shrink-0"
        style={{ background: '#0a0a14', borderTop: '1px solid rgba(255,255,255,0.04)' }}
      >
        <span className="text-[9px] text-white/20 font-mono">{wordCount} words</span>
        <span className="text-[9px] text-white/20 font-mono">{content.length} chars</span>
        <span className="text-[9px] text-white/20 font-mono">{lineCount} lines</span>
        <div className="flex-1" />
        <span className="text-[9px] text-orange-400/30">auto-saved</span>
      </div>
    </div>
  );
}
