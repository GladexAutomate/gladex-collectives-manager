// @ts-nocheck
import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Minus, Maximize2, Minimize2, FileText, Trash2, Copy, ChevronDown } from 'lucide-react';

const STORAGE_KEY = 'collectives_notepad_v1';

const ANIM_CSS = `
  @keyframes notepadGlow {
    0%, 100% {
      box-shadow: 0 0 0 2px #f97316, 0 8px 32px rgba(249,115,22,0.22), 0 2px 12px rgba(249,115,22,0.10);
      border-color: #f97316;
    }
    50% {
      box-shadow: 0 0 0 3px #fb923c, 0 8px 42px rgba(251,146,60,0.36), 0 2px 18px rgba(251,146,60,0.16);
      border-color: #fb923c;
    }
  }
  .np-glow {
    animation: notepadGlow 2.6s ease-in-out infinite;
    border: 2px solid #f97316;
  }
`;

export default function FloatingNotepad({ onClose }) {
  const [mode, setMode]       = useState('normal');
  const [content, setContent] = useState(() => localStorage.getItem(STORAGE_KEY) || '');
  const [pos, setPos]         = useState({ x: Math.max(80, window.innerWidth - 480), y: 80 });
  const [copied, setCopied]   = useState(false);
  const [screenW, setScreenW] = useState(() => window.innerWidth);
  const [npSize, setNpSize]   = useState(() => localStorage.getItem('np_size') || 'M');

  const SIZE_MAP = { S: { w: 340, h: 420 }, M: { w: 440, h: 560 }, L: { w: 620, h: 700 } };

  const isDragging  = useRef(false);
  const dragOffset  = useRef({ x: 0, y: 0 });

  useEffect(() => { localStorage.setItem(STORAGE_KEY, content); }, [content]);

  useEffect(() => {
    const onResize = () => setScreenW(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const isMobile = screenW < 640;

  const onTitleMouseDown = useCallback((e) => {
    if (mode !== 'normal' || isMobile) return;
    isDragging.current = true;
    dragOffset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
    e.preventDefault();
  }, [mode, pos, isMobile]);

  useEffect(() => {
    const onMove = (e) => {
      if (!isDragging.current) return;
      const { w } = SIZE_MAP[npSize] || SIZE_MAP.M;
      setPos({
        x: Math.max(0, Math.min(window.innerWidth - w, e.clientX - dragOffset.current.x)),
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
      <>
        <style>{ANIM_CSS}</style>
        <div
          className="fixed bottom-5 right-5 z-[9999] flex items-center gap-2.5 pl-3.5 pr-2.5 py-2.5 rounded-2xl shadow-xl cursor-pointer select-none transition-all hover:scale-105 active:scale-95 np-glow"
          style={{ background: '#ffffff' }}
          onClick={() => setMode('normal')}
          title="Open Notepad"
        >
          <FileText className="w-4 h-4 text-orange-500 flex-shrink-0" />
          <span className="text-sm font-semibold text-orange-700" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>Notepad</span>
          {wordCount > 0 && <span className="text-xs text-orange-400 font-mono">{wordCount}w</span>}
          <ChevronDown className="w-3.5 h-3.5 text-orange-300 rotate-180" />
        </div>
      </>
    );
  }

  // ── Window geometry — responsive ────────────────────────────────────────────
  const isMax = mode === 'maximized';
  const { w: npW, h: npH } = SIZE_MAP[npSize] || SIZE_MAP.M;
  const windowStyle = isMax
    ? { position: 'fixed', inset: '12px', zIndex: 9999 }
    : isMobile
      ? { position: 'fixed', left: 0, right: 0, bottom: 0, height: '72vh', zIndex: 9999, borderRadius: '20px 20px 0 0', width: '100%' }
      : { position: 'fixed', left: pos.x, top: pos.y, width: npW, height: npH, zIndex: 9999 };

  const borderRadius = isMobile && !isMax ? '20px 20px 0 0' : undefined;

  const handleSizeChange = (s) => {
    setNpSize(s);
    localStorage.setItem('np_size', s);
  };

  return (
    <>
      <style>{ANIM_CSS}</style>
      <div
        style={{ ...windowStyle, borderRadius }}
        className="flex flex-col overflow-hidden select-none np-glow"
      >
        {/* ── Title bar ─────────────────────────────────────────────────────── */}
        <div
          onMouseDown={onTitleMouseDown}
          className="flex items-center gap-2 px-4 py-3 flex-shrink-0"
          style={{
            background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
            borderBottom: '1px solid #fed7aa',
            cursor: (isMax || isMobile) ? 'default' : 'grab',
            userSelect: 'none',
          }}
        >
          {/* Traffic lights */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button onMouseDown={e => e.stopPropagation()} onClick={onClose} title="Close"
              className="w-3.5 h-3.5 rounded-full bg-[#ff5f57] hover:bg-[#ff3b30] transition-colors group flex items-center justify-center">
              <X className="w-2 h-2 text-[#8b0000] opacity-0 group-hover:opacity-100" />
            </button>
            <button onMouseDown={e => e.stopPropagation()} onClick={() => setMode('minimized')} title="Minimize"
              className="w-3.5 h-3.5 rounded-full bg-[#febc2e] hover:bg-[#f59e0b] transition-colors group flex items-center justify-center">
              <Minus className="w-2 h-2 text-[#7a5000] opacity-0 group-hover:opacity-100" />
            </button>
            <button onMouseDown={e => e.stopPropagation()} onClick={() => setMode(m => m === 'maximized' ? 'normal' : 'maximized')} title={isMax ? 'Restore' : 'Maximize'}
              className="w-3.5 h-3.5 rounded-full bg-[#28c840] hover:bg-[#22c55e] transition-colors group flex items-center justify-center">
              {isMax
                ? <Minimize2 className="w-2 h-2 text-[#004d00] opacity-0 group-hover:opacity-100" />
                : <Maximize2 className="w-2 h-2 text-[#004d00] opacity-0 group-hover:opacity-100" />}
            </button>
          </div>

          {/* Title */}
          <div className="flex-1 flex items-center justify-center gap-2 pointer-events-none">
            <FileText className="w-4 h-4 text-orange-500" />
            <span className="text-sm font-semibold text-orange-900 tracking-wide"
              style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
              Package Notepad
            </span>
          </div>

          {/* Stats */}
          <span className="text-xs text-orange-400 font-mono flex-shrink-0 pointer-events-none">
            {wordCount}w · {lineCount}L
          </span>
        </div>

        {/* ── Toolbar ────────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-1 px-3 py-2 flex-shrink-0"
          style={{ background: '#fffbf5', borderBottom: '1px solid #fed7aa' }}>
          <button onClick={handleCopyAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-orange-600 hover:text-orange-800 hover:bg-orange-100 transition-colors"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
            <Copy className="w-3.5 h-3.5" />
            {copied ? 'Copied!' : 'Copy All'}
          </button>
          <button onClick={() => { if (window.confirm('Clear all notepad content?')) setContent(''); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
            <Trash2 className="w-3.5 h-3.5" />
            Clear
          </button>
          <div className="flex-1" />
          {/* Size presets — only on desktop */}
          {!isMobile && !isMax && (
            <div className="flex items-center gap-0.5 mr-2">
              {['S', 'M', 'L'].map(s => (
                <button
                  key={s}
                  onClick={() => handleSizeChange(s)}
                  title={{ S: 'Small', M: 'Medium', L: 'Large' }[s]}
                  className="w-6 h-6 rounded text-[10px] font-bold transition-colors"
                  style={{
                    background: npSize === s ? '#fed7aa' : 'transparent',
                    color: npSize === s ? '#c2410c' : '#fdba74',
                    border: npSize === s ? '1px solid #fb923c' : '1px solid transparent',
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
          <span className="text-xs text-orange-300 italic pr-1 hidden sm:block"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
            paste copied packages here
          </span>
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
          className="flex-1 resize-none focus:outline-none"
          style={{
            background: '#fffffe',
            color: '#1c1917',
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontSize: '15px',
            lineHeight: '1.75',
            padding: isMobile ? '16px' : '20px',
            caretColor: '#f97316',
          }}
          spellCheck={false}
        />

        {/* ── Status bar ─────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 px-4 py-2 flex-shrink-0 flex-wrap"
          style={{ background: '#fff7ed', borderTop: '1px solid #fed7aa' }}>
          <span className="text-xs text-orange-400 font-mono">{wordCount} words</span>
          <span className="text-xs text-orange-400 font-mono">{content.length} chars</span>
          <span className="text-xs text-orange-400 font-mono">{lineCount} lines</span>
          <div className="flex-1" />
          <span className="text-xs text-orange-500 font-semibold"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
            auto-saved ✓
          </span>
        </div>
      </div>
    </>
  );
}
