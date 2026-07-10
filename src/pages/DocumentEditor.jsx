// @ts-nocheck
import { useState, useRef, useCallback, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import {
  Bold, Italic, Underline, Strikethrough,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Image as ImageIcon, Printer,
  Undo2, Redo2, Loader2, Wand2, Minus, Link,
  Highlighter, Type, ChevronDown, X, Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

/* ─── helpers ────────────────────────────────────────────────── */
const fmt = n => n ? `PHP ${Number(n).toLocaleString()}` : '';

function buildHTML(pkg) {
  if (!pkg) return '<p>Select a package to auto-fill, or start typing…</p>';
  const basePrice = pkg.selling_price || pkg.rate_twin || 0;
  const dates     = (pkg.travel_dates || []);
  const period    = dates.map(d => d.label || d.departure_date).filter(Boolean).join(' / ');

  const itineraryRows = (pkg.itinerary || '')
    .split(/\n(?=Day \d+)/i)
    .filter(Boolean)
    .map((block, i) => {
      const lines   = block.trim().split('\n');
      const title   = lines[0].replace(/^Day \d+\s*[–\-]?\s*/i, '');
      const bullets = lines.slice(1).filter(l => l.trim())
        .map(l => `<li>${l.replace(/^[•\-\*]\s*/, '')}</li>`).join('');
      return `<tr>
        <td style="background:#1e40af;color:white;font-weight:bold;padding:6px 10px;white-space:nowrap;border:1px solid #ccc;vertical-align:top;">DAY ${i+1}</td>
        <td style="border:1px solid #ccc;padding:6px 10px;vertical-align:top;">
          <strong style="color:#1e40af;text-transform:uppercase;">${title}</strong>
          <ul style="margin:4px 0 0 14px;">${bullets}</ul>
        </td>
      </tr>`;
    }).join('');

  const inclRows = (pkg.inclusions || '').split('\n').filter(l=>l.trim())
    .map(l=>`<tr><td style="border:1px solid #ccc;padding:4px 10px;">- ${l.replace(/^[-•*]\s*/,'')}</td></tr>`).join('');
  const exclRows = (pkg.exclusions || '').split('\n').filter(l=>l.trim())
    .map(l=>`<tr><td style="border:1px solid #ccc;padding:4px 10px;">- ${l.replace(/^[-•*]\s*/,'')}</td></tr>`).join('');

  return `
<div style="text-align:center;margin-bottom:20px;">
  <h1 style="color:#1e40af;font-size:28px;font-weight:bold;line-height:1.2;">${pkg.name || ''}</h1>
  ${basePrice ? `<h2 style="color:#1d4ed8;font-size:20px;font-weight:bold;margin-top:6px;">for as low as ${fmt(basePrice)} per pax</h2>` : ''}
</div>

${period ? `
<p style="text-align:center;font-weight:bold;color:#1e40af;">TRAVEL PERIOD:</p>
<p style="text-align:center;color:#1d4ed8;font-weight:600;">${period}</p>
` : ''}

${itineraryRows ? `
<table style="width:100%;border-collapse:collapse;margin:16px 0;">
  <tr><td colspan="2" style="background:#1e40af;color:white;text-align:center;font-weight:bold;padding:8px;font-size:13px;">ITINERARY</td></tr>
  ${itineraryRows}
</table>
` : ''}

${pkg.flight_details ? `
<table style="width:100%;border-collapse:collapse;margin:16px 0;">
  <tr><td style="background:#e5e7eb;text-align:center;font-weight:bold;padding:8px;border:1px solid #ccc;">FLIGHT DETAILS</td></tr>
  <tr><td style="border:1px solid #ccc;padding:12px;text-align:center;white-space:pre-line;">${pkg.flight_details}</td></tr>
</table>
` : ''}

<div style="border:2px solid #1e40af;border-radius:6px;padding:14px;margin:16px 0;text-align:center;">
  ${basePrice ? `<p style="font-size:13px;">Adult &amp; Child Rate: <strong>${fmt(basePrice)} per pax</strong></p>` : ''}
  ${pkg.rate_single_supplement ? `<p style="font-size:13px;">Single Supplement: <strong>${fmt(pkg.rate_single_supplement)} per pax</strong></p>` : ''}
  ${pkg.rate_child_no_bed ? `<p style="font-size:13px;">Child w/o Bed: <strong>${fmt(pkg.rate_child_no_bed)} per pax</strong></p>` : ''}
  ${pkg.downpayment_required ? `<p style="font-size:13px;font-weight:bold;color:#1e40af;margin-top:8px;">DOWN PAYMENT: ${fmt(pkg.downpayment_required)} PER PAX</p>` : ''}
  ${pkg.commission_amount ? `<p style="font-size:13px;font-weight:bold;color:#1e40af;">COMMISSION: ${fmt(pkg.commission_amount)}</p>` : ''}
</div>

${(inclRows || exclRows) ? `
<table style="width:100%;border-collapse:collapse;margin:16px 0;">
  <tr>
    ${inclRows ? `<td style="width:50%;vertical-align:top;">
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="background:#1e40af;color:white;text-align:center;font-weight:bold;padding:6px;border:1px solid #ccc;">INCLUSION</td></tr>
        ${inclRows}
      </table>
    </td>` : ''}
    ${exclRows ? `<td style="width:50%;vertical-align:top;padding-left:${inclRows?'8px':'0'};">
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="background:#1e40af;color:white;text-align:center;font-weight:bold;padding:6px;border:1px solid #ccc;">EXCLUSION</td></tr>
        ${exclRows}
      </table>
    </td>` : ''}
  </tr>
</table>
` : ''}

${pkg.terms_conditions ? `
<table style="width:100%;border-collapse:collapse;margin:16px 0;">
  <tr><td style="background:#e5e7eb;text-align:center;font-weight:bold;padding:8px;border:1px solid #ccc;">TERMS AND CONDITIONS</td></tr>
  <tr><td style="border:1px solid #ccc;padding:10px;font-size:12px;white-space:pre-line;">${pkg.terms_conditions}</td></tr>
</table>
` : ''}

<p style="text-align:center;font-size:11px;color:#6b7280;margin-top:24px;border-top:1px solid #e5e7eb;padding-top:10px;">ALL RATES ARE EXCLUSIVE OF VAT</p>
`.trim();
}

/* ─── ToolbarBtn ─────────────────────────────────────────────── */
function TB({ title, active, onClick, children, disabled }) {
  return (
    <button
      title={title}
      disabled={disabled}
      onMouseDown={e => { e.preventDefault(); onClick?.(); }}
      className={cn(
        'p-1.5 rounded hover:bg-muted transition-colors',
        active && 'bg-muted text-foreground',
        disabled && 'opacity-30 cursor-not-allowed',
      )}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="w-px h-5 bg-border mx-0.5 self-center flex-shrink-0" />;
}

/* ─── Main component ─────────────────────────────────────────── */
export default function DocumentEditor({ collectives = [] }) {
  const editorRef    = useRef(null);
  const imgInputRef  = useRef(null);
  const [selectedId, setSelectedId] = useState('');
  const [uploading,  setUploading]  = useState(false);
  const [printing,   setPrinting]   = useState(false);
  const [fontSize,   setFontSize]   = useState('3');
  const [fontName,   setFontName]   = useState('Arial');
  const [foreColor,  setForeColor]  = useState('#000000');
  const [hiColor,    setHiColor]    = useState('#ffff00');
  const pkg = collectives.find(c => c.id === selectedId) || null;

  // Init blank doc
  useEffect(() => {
    if (editorRef.current && !editorRef.current.innerHTML.trim()) {
      editorRef.current.innerHTML =
        '<p style="color:#9ca3af;">Start typing your document here, or select a package above to auto-fill…</p>';
    }
  }, []);

  const exec = useCallback((cmd, val = null) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, val);
  }, []);

  function autoFill() {
    if (!pkg || !editorRef.current) return;
    editorRef.current.innerHTML = buildHTML(pkg);
    editorRef.current.focus();
  }

  async function insertImage(file) {
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      editorRef.current?.focus();
      exec('insertHTML', `<img src="${file_url}" style="max-width:100%;height:auto;display:block;margin:8px 0;" />`);
    } finally {
      setUploading(false);
    }
  }

  function handlePrint() {
    if (!editorRef.current) return;
    setPrinting(true);
    const content = editorRef.current.innerHTML;
    const win = window.open('', '_blank');
    win.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>${pkg?.name || 'Document'}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:Arial,sans-serif; font-size:12px; color:#000; padding:20mm; }
    table { width:100%; border-collapse:collapse; }
    td,th { border:1px solid #ccc; }
    img { max-width:100%; }
    @media print { body { padding:15mm; } }
  </style>
</head>
<body>${content}</body>
</html>`);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); setPrinting(false); }, 500);
  }

  function insertTable() {
    const rows = 3, cols = 3;
    let html = '<table style="width:100%;border-collapse:collapse;margin:8px 0;">';
    for (let r = 0; r < rows; r++) {
      html += '<tr>';
      for (let c = 0; c < cols; c++) {
        html += `<td style="border:1px solid #ccc;padding:6px;min-width:60px;">&nbsp;</td>`;
      }
      html += '</tr>';
    }
    html += '</table><p><br></p>';
    exec('insertHTML', html);
  }

  const FONTS = ['Arial', 'Times New Roman', 'Georgia', 'Verdana', 'Courier New', 'Trebuchet MS'];
  const SIZES = [
    { label: '8pt',  val: '1' }, { label: '10pt', val: '2' },
    { label: '12pt', val: '3' }, { label: '14pt', val: '4' },
    { label: '18pt', val: '5' }, { label: '24pt', val: '6' },
    { label: '36pt', val: '7' },
  ];
  const COLORS = ['#000000','#ffffff','#ef4444','#f97316','#eab308','#22c55e','#3b82f6','#8b5cf6','#ec4899','#1e40af','#166534','#92400e'];
  const HI_COLORS = ['#fef08a','#bbf7d0','#bfdbfe','#fde68a','#fecaca','#e9d5ff','transparent'];

  return (
    <div className="flex flex-col gap-0 border border-border rounded-xl overflow-hidden shadow-sm">

      {/* ── Top bar: package selector + actions ── */}
      <div className="flex items-center gap-2 px-3 py-2 bg-muted/40 border-b border-border flex-wrap">
        <Select value={selectedId} onValueChange={setSelectedId}>
          <SelectTrigger className="h-8 text-xs w-52 flex-shrink-0">
            <SelectValue placeholder="Choose package to auto-fill…" />
          </SelectTrigger>
          <SelectContent>
            {collectives.map(c => (
              <SelectItem key={c.id} value={c.id} className="text-xs">{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          size="sm" variant="outline"
          className="h-8 text-xs gap-1.5 flex-shrink-0"
          onClick={autoFill} disabled={!pkg}
        >
          <Wand2 className="w-3.5 h-3.5 text-amber-500" /> Auto-fill from Package
        </Button>
        <div className="flex-1" />
        <Button
          size="sm" className="h-8 text-xs gap-1.5 gradient-gold text-white border-0 flex-shrink-0"
          onClick={handlePrint} disabled={printing}
        >
          {printing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Printer className="w-3.5 h-3.5" />}
          Print / Save PDF
        </Button>
      </div>

      {/* ── Formatting toolbar ── */}
      <div className="flex items-center flex-wrap gap-0.5 px-2 py-1.5 bg-background border-b border-border">

        {/* Undo / Redo */}
        <TB title="Undo" onClick={() => exec('undo')}><Undo2 className="w-3.5 h-3.5" /></TB>
        <TB title="Redo" onClick={() => exec('redo')}><Redo2 className="w-3.5 h-3.5" /></TB>
        <Divider />

        {/* Font family */}
        <select
          className="text-xs border border-border rounded px-1 h-7 bg-background text-foreground mr-1"
          value={fontName}
          onChange={e => { setFontName(e.target.value); exec('fontName', e.target.value); }}
        >
          {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
        </select>

        {/* Font size */}
        <select
          className="text-xs border border-border rounded px-1 h-7 bg-background text-foreground mr-1"
          value={fontSize}
          onChange={e => { setFontSize(e.target.value); exec('fontSize', e.target.value); }}
        >
          {SIZES.map(s => <option key={s.val} value={s.val}>{s.label}</option>)}
        </select>
        <Divider />

        {/* Heading / block */}
        <select
          className="text-xs border border-border rounded px-1 h-7 bg-background text-foreground mr-1"
          defaultValue=""
          onChange={e => { exec('formatBlock', e.target.value); e.target.value = ''; }}
        >
          <option value="" disabled>Style</option>
          <option value="p">Paragraph</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
          <option value="h4">Heading 4</option>
          <option value="pre">Code</option>
        </select>
        <Divider />

        {/* Bold / Italic / Underline / Strike */}
        <TB title="Bold (Ctrl+B)"        onClick={() => exec('bold')}>       <Bold          className="w-3.5 h-3.5" /></TB>
        <TB title="Italic (Ctrl+I)"      onClick={() => exec('italic')}>     <Italic        className="w-3.5 h-3.5" /></TB>
        <TB title="Underline (Ctrl+U)"   onClick={() => exec('underline')}>  <Underline     className="w-3.5 h-3.5" /></TB>
        <TB title="Strikethrough"        onClick={() => exec('strikeThrough')}><Strikethrough className="w-3.5 h-3.5" /></TB>
        <Divider />

        {/* Text color */}
        <div className="relative flex items-center">
          <div className="flex flex-col items-center cursor-pointer" onMouseDown={e => e.preventDefault()}>
            <Type className="w-3.5 h-3.5" />
            <input
              type="color" value={foreColor}
              className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
              onChange={e => { setForeColor(e.target.value); exec('foreColor', e.target.value); }}
            />
            <div className="w-3.5 h-1 rounded-sm mt-0.5" style={{ background: foreColor }} />
          </div>
        </div>

        {/* Highlight color */}
        <div className="relative flex items-center ml-1">
          <div className="flex flex-col items-center cursor-pointer" title="Highlight color" onMouseDown={e => e.preventDefault()}>
            <Highlighter className="w-3.5 h-3.5" />
            <input
              type="color" value={hiColor === 'transparent' ? '#ffffff' : hiColor}
              className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
              onChange={e => { setHiColor(e.target.value); exec('backColor', e.target.value); }}
            />
            <div className="w-3.5 h-1 rounded-sm mt-0.5" style={{ background: hiColor }} />
          </div>
        </div>
        <Divider />

        {/* Alignment */}
        <TB title="Align Left"    onClick={() => exec('justifyLeft')}>   <AlignLeft    className="w-3.5 h-3.5" /></TB>
        <TB title="Align Center"  onClick={() => exec('justifyCenter')}> <AlignCenter  className="w-3.5 h-3.5" /></TB>
        <TB title="Align Right"   onClick={() => exec('justifyRight')}>  <AlignRight   className="w-3.5 h-3.5" /></TB>
        <TB title="Justify"       onClick={() => exec('justifyFull')}>   <AlignJustify className="w-3.5 h-3.5" /></TB>
        <Divider />

        {/* Lists */}
        <TB title="Bullet List"   onClick={() => exec('insertUnorderedList')}><List        className="w-3.5 h-3.5" /></TB>
        <TB title="Numbered List" onClick={() => exec('insertOrderedList')}>  <ListOrdered className="w-3.5 h-3.5" /></TB>
        <TB title="Indent"        onClick={() => exec('indent')}>
          <span className="text-[10px] font-mono font-bold">→</span>
        </TB>
        <TB title="Outdent"       onClick={() => exec('outdent')}>
          <span className="text-[10px] font-mono font-bold">←</span>
        </TB>
        <Divider />

        {/* Horizontal rule */}
        <TB title="Horizontal Line" onClick={() => exec('insertHorizontalRule')}><Minus className="w-3.5 h-3.5" /></TB>

        {/* Table */}
        <TB title="Insert Table 3×3" onClick={insertTable}>
          <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
            <rect x="1" y="1" width="14" height="3" rx="0.5" opacity=".6"/>
            <rect x="1" y="5" width="6" height="4" rx="0.5" opacity=".4"/>
            <rect x="9" y="5" width="6" height="4" rx="0.5" opacity=".4"/>
            <rect x="1" y="11" width="6" height="4" rx="0.5" opacity=".4"/>
            <rect x="9" y="11" width="6" height="4" rx="0.5" opacity=".4"/>
          </svg>
        </TB>

        {/* Image upload */}
        <input ref={imgInputRef} type="file" accept="image/*" className="hidden"
          onChange={e => insertImage(e.target.files[0])} />
        <TB title="Insert Image" onClick={() => imgInputRef.current?.click()} disabled={uploading}>
          {uploading
            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
            : <ImageIcon className="w-3.5 h-3.5" />}
        </TB>

        {/* Link */}
        <TB title="Insert Link" onClick={() => {
          const url = prompt('Enter URL:', 'https://');
          if (url) exec('createLink', url);
        }}>
          <Link className="w-3.5 h-3.5" />
        </TB>
      </div>

      {/* ── Document canvas ── */}
      <div className="bg-gray-100 dark:bg-zinc-800 overflow-auto" style={{ minHeight: '75vh' }}>
        <div className="mx-auto my-6" style={{ width: '794px', maxWidth: '100%' }}>
          {/* A4 page */}
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            spellCheck
            className="bg-white text-black shadow-xl outline-none"
            style={{
              minHeight: '1123px',
              padding: '60px 72px',
              fontFamily: fontName,
              fontSize: '13px',
              lineHeight: '1.6',
              caretColor: '#1e40af',
            }}
            onKeyDown={e => {
              // Tab → indent
              if (e.key === 'Tab') {
                e.preventDefault();
                exec('insertHTML', '&nbsp;&nbsp;&nbsp;&nbsp;');
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
