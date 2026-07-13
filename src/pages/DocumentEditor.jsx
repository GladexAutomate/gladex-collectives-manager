// @ts-nocheck
import { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import {
  Bold, Italic, Underline, Strikethrough,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Image as ImageIcon, Printer,
  Undo2, Redo2, Loader2, Wand2, Minus, Link,
  Highlighter, Type, X, Sparkles, Upload, FileText,
  AlertCircle, Plus, MoreVertical, Download, Star,
  ChevronDown
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

/* ─── build HTML from package ───────────────────────────────────── */
const fmt = n => n ? `PHP ${Number(n).toLocaleString()}` : '';

function buildHTML(pkg) {
  if (!pkg) return '';
  const basePrice = pkg.selling_price || pkg.rate_twin || 0;
  const dates = pkg.travel_dates || [];
  const period = dates.map(d => d.label || d.departure_date).filter(Boolean).join(' / ');
  const itRows = (pkg.itinerary || '').split(/\n(?=Day \d+)/i).filter(Boolean).map((block, i) => {
    const lines = block.trim().split('\n');
    const title = lines[0].replace(/^Day \d+\s*[–\-]?\s*/i, '');
    const bullets = lines.slice(1).filter(l => l.trim())
      .map(l => `<li>${l.replace(/^[•\-\*]\s*/, '')}</li>`).join('');
    return `<tr><td style="background:#1e40af;color:white;font-weight:bold;padding:6px 10px;white-space:nowrap;border:1px solid #ccc;vertical-align:top;">DAY ${i+1}</td><td style="border:1px solid #ccc;padding:6px 10px;vertical-align:top;"><strong style="color:#1e40af;">${title}</strong><ul style="margin:4px 0 0 14px;">${bullets}</ul></td></tr>`;
  }).join('');
  const inclRows = (pkg.inclusions || '').split('\n').filter(l => l.trim())
    .map(l => `<tr><td style="border:1px solid #ccc;padding:4px 10px;">- ${l.replace(/^[-•*]\s*/, '')}</td></tr>`).join('');
  const exclRows = (pkg.exclusions || '').split('\n').filter(l => l.trim())
    .map(l => `<tr><td style="border:1px solid #ccc;padding:4px 10px;">- ${l.replace(/^[-•*]\s*/, '')}</td></tr>`).join('');
  return `<div style="text-align:center;margin-bottom:20px;"><h1 style="color:#1e40af;font-size:28px;font-weight:bold;">${pkg.name||''}</h1>${basePrice?`<h2 style="color:#1d4ed8;font-size:20px;font-weight:bold;margin-top:6px;">for as low as ${fmt(basePrice)} per pax</h2>`:''}</div>${period?`<p style="text-align:center;font-weight:bold;color:#1e40af;">TRAVEL PERIOD:</p><p style="text-align:center;color:#1d4ed8;font-weight:600;">${period}</p>`:''}${itRows?`<table style="width:100%;border-collapse:collapse;margin:16px 0;"><tr><td colspan="2" style="background:#1e40af;color:white;text-align:center;font-weight:bold;padding:8px;">ITINERARY</td></tr>${itRows}</table>`:''}${pkg.flight_details?`<table style="width:100%;border-collapse:collapse;margin:16px 0;"><tr><td style="background:#e5e7eb;text-align:center;font-weight:bold;padding:8px;border:1px solid #ccc;">FLIGHT DETAILS</td></tr><tr><td style="border:1px solid #ccc;padding:12px;text-align:center;white-space:pre-line;">${pkg.flight_details}</td></tr></table>`:''}<div style="border:2px solid #1e40af;border-radius:6px;padding:14px;margin:16px 0;text-align:center;">${basePrice?`<p>Adult &amp; Child Rate: <strong>${fmt(basePrice)} per pax</strong></p>`:''}${pkg.rate_single_supplement?`<p>Single Supplement: <strong>${fmt(pkg.rate_single_supplement)} per pax</strong></p>`:''} ${pkg.rate_child_no_bed?`<p>Child w/o Bed: <strong>${fmt(pkg.rate_child_no_bed)} per pax</strong></p>`:''}${pkg.downpayment_required?`<p style="font-weight:bold;color:#1e40af;margin-top:8px;">DOWN PAYMENT: ${fmt(pkg.downpayment_required)} PER PAX</p>`:''}${pkg.commission_amount?`<p style="font-weight:bold;color:#1e40af;">COMMISSION: ${fmt(pkg.commission_amount)}</p>`:''}</div>${(inclRows||exclRows)?`<table style="width:100%;border-collapse:collapse;margin:16px 0;"><tr>${inclRows?`<td style="width:50%;vertical-align:top;"><table style="width:100%;border-collapse:collapse;"><tr><td style="background:#1e40af;color:white;text-align:center;font-weight:bold;padding:6px;border:1px solid #ccc;">INCLUSION</td></tr>${inclRows}</table></td>`:''} ${exclRows?`<td style="width:50%;vertical-align:top;padding-left:8px;"><table style="width:100%;border-collapse:collapse;"><tr><td style="background:#1e40af;color:white;text-align:center;font-weight:bold;padding:6px;border:1px solid #ccc;">EXCLUSION</td></tr>${exclRows}</table></td>`:''}</tr></table>`:''} ${pkg.terms_conditions?`<table style="width:100%;border-collapse:collapse;margin:16px 0;"><tr><td style="background:#e5e7eb;text-align:center;font-weight:bold;padding:8px;border:1px solid #ccc;">TERMS AND CONDITIONS</td></tr><tr><td style="border:1px solid #ccc;padding:10px;font-size:12px;white-space:pre-line;">${pkg.terms_conditions}</td></tr></table>`:''}<p style="text-align:center;font-size:11px;color:#6b7280;margin-top:24px;border-top:1px solid #e5e7eb;padding-top:10px;">ALL RATES ARE EXCLUSIVE OF VAT</p>`;
}

/* ─── Toolbar button ─────────────────────────────────────────────── */
function TB({ title, onClick, children, disabled }) {
  const [hov, setHov] = useState(false);
  return (
    <button title={title} disabled={disabled}
      onMouseDown={e => { e.preventDefault(); if (!disabled) onClick?.(); }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ padding: '3px 5px', border: 'none', borderRadius: 3, cursor: disabled ? 'default' : 'pointer', background: hov && !disabled ? '#e8eaed' : 'transparent', color: '#444746', opacity: disabled ? 0.4 : 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: 26, height: 26, flexShrink: 0 }}>
      {children}
    </button>
  );
}

function Divider() {
  return <div style={{ width: 1, height: 18, background: '#dadce0', margin: '0 3px', flexShrink: 0, alignSelf: 'center' }} />;
}

/* ─── Dropdown menu ──────────────────────────────────────────────── */
function MenuBar({ label, children }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();
  useEffect(() => {
    if (!open) return;
    const close = e => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(v => !v)}
        style={{ padding: '3px 8px', border: 'none', borderRadius: 4, cursor: 'pointer', background: open ? '#e8f0fe' : 'transparent', color: '#444746', fontSize: 13, lineHeight: '20px', whiteSpace: 'nowrap' }}
        onMouseEnter={e => { if (!open) e.currentTarget.style.background = '#f1f3f4'; }}
        onMouseLeave={e => { if (!open) e.currentTarget.style.background = 'transparent'; }}>
        {label}
      </button>
      {open && (
        <div onClick={() => setOpen(false)} style={{ position: 'absolute', top: '100%', left: 0, zIndex: 9999, background: 'white', border: '1px solid #dadce0', borderRadius: 4, boxShadow: '0 2px 10px rgba(0,0,0,.2)', minWidth: 210, padding: '6px 0', marginTop: 2 }}>
          {children}
        </div>
      )}
    </div>
  );
}

function MI({ label, shortcut, onClick, divider, red }) {
  if (divider) return <div style={{ height: 1, background: '#e0e0e0', margin: '4px 0' }} />;
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '7px 16px', border: 'none', background: hov ? '#f1f3f4' : 'transparent', cursor: 'pointer', fontSize: 13, color: red ? '#d93025' : '#3c4043', textAlign: 'left' }}>
      <span>{label}</span>
      {shortcut && <span style={{ color: '#80868b', fontSize: 11, marginLeft: 32, flexShrink: 0 }}>{shortcut}</span>}
    </button>
  );
}

/* ─── Main component ─────────────────────────────────────────────── */
export default function DocumentEditor({ collectives = [] }) {
  const [docName, setDocName] = useState('Untitled document');
  const [editingName, setEditingName] = useState(false);

  // Document tabs
  const [docTabs, setDocTabs] = useState([{ id: '1', name: 'Tab 1', html: '', headerImage: null, footerImage: null }]);
  const [activeTabId, setActiveTabId] = useState('1');
  const [renamingTab, setRenamingTab] = useState(null);
  const [tabMenu, setTabMenu] = useState(null);

  // Editor
  const [selectedId, setSelectedId] = useState('');
  const [uploading, setUploading] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [fontName, setFontName] = useState('Arial');
  const [fontSize, setFontSize] = useState('11');
  const [foreColor, setForeColor] = useState('#000000');
  const [hiColor, setHiColor] = useState('#ffff00');

  // AI
  const [aiLoading, setAiLoading] = useState(false);
  const [aiStatus, setAiStatus] = useState('');
  const [aiError, setAiError] = useState('');
  const [showAiPanel, setShowAiPanel] = useState(false);

  // Header / footer images (separate from content body)
  const [headerImage, setHeaderImage] = useState(null);
  const [footerImage, setFooterImage] = useState(null);
  // Standard doc banner header ≈ 120px, footer ≈ 100px. User can drag to resize.
  const [headerHeight, setHeaderHeight] = useState(120);
  const [footerHeight, setFooterHeight] = useState(100);

  // Image selection + resize
  const [selImg, setSelImg] = useState(null);
  const [selImgRect, setSelImgRect] = useState(null);
  const pageRef = useRef(null);

  // Drag-and-drop
  const [dragZone, setDragZone] = useState(null); // null | 'header' | 'body' | 'footer'

  const editorRef = useRef(null);
  const pagesAreaRef = useRef(null);
  const imgInputRef = useRef(null);
  const footerImgRef = useRef(null);
  const headerImgRef = useRef(null);
  const aiFileRef = useRef(null);
  const nameInputRef = useRef(null);
  const tabMenuRef = useRef(null);

  const pkg = collectives.find(c => c.id === selectedId) || null;

  const FONTS = ['Arial', 'Times New Roman', 'Georgia', 'Verdana', 'Courier New', 'Trebuchet MS', 'Impact'];
  const SIZES = ['6','7','8','9','10','11','12','14','16','18','20','24','28','32','36','48','72'];

  // Inject styles
  useEffect(() => {
    const el = document.createElement('style');
    el.id = 'de-styles';
    el.textContent = `
      @keyframes de-spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
      .de-spin { animation: de-spin 1s linear infinite; }
      .de-editor:empty:before { content: attr(data-ph); color: #9aa0a6; }
    `;
    if (!document.getElementById('de-styles')) document.head.appendChild(el);
    return () => document.getElementById('de-styles')?.remove();
  }, []);

  // Close tab menu on outside click
  useEffect(() => {
    if (!tabMenu) return;
    const close = e => { if (!tabMenuRef.current?.contains(e.target)) setTabMenu(null); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [tabMenu]);

  // Sync editor when switching tabs — also reset scroll to top
  useEffect(() => {
    if (!editorRef.current) return;
    const tab = docTabs.find(t => t.id === activeTabId);
    editorRef.current.innerHTML = tab?.html || '';
    setHeaderImage(tab?.headerImage || null);
    setFooterImage(tab?.footerImage || null);
    setSelImg(null); setSelImgRect(null);
    if (pagesAreaRef.current) pagesAreaRef.current.scrollTop = 0;
  }, [activeTabId]);

  // Image click → select for resize
  useEffect(() => {
    const ed = editorRef.current;
    if (!ed) return;
    const onClick = (e) => {
      if (e.target.tagName === 'IMG') {
        setSelImg(e.target);
        const pr = pageRef.current?.getBoundingClientRect();
        const ir = e.target.getBoundingClientRect();
        if (pr) setSelImgRect({ left: ir.left - pr.left, top: ir.top - pr.top, w: ir.width, h: ir.height });
      } else {
        setSelImg(null); setSelImgRect(null);
      }
    };
    ed.addEventListener('click', onClick);
    return () => ed.removeEventListener('click', onClick);
  }, []);

  const exec = (cmd, val = null) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, val);
  };

  function handleEditorInput() {
    if (!editorRef.current) return;
    const html = editorRef.current.innerHTML;
    setDocTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, html } : t));
  }

  function switchTab(id) {
    if (id === activeTabId) return;
    setDocTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, headerImage, footerImage } : t));
    setActiveTabId(id);
  }

  function addTab() {
    const currentHtml = editorRef.current?.innerHTML || '';
    const newId = String(Date.now());
    setDocTabs(prev => {
      const saved = prev.map(t => t.id === activeTabId ? { ...t, html: currentHtml, headerImage, footerImage } : t);
      return [...saved, { id: newId, name: `Tab ${saved.length + 1}`, html: '', headerImage: null, footerImage: null }];
    });
    setActiveTabId(newId);
  }

  function refreshSelRect() {
    if (!selImg || !pageRef.current) return;
    const pr = pageRef.current.getBoundingClientRect();
    const ir = selImg.getBoundingClientRect();
    setSelImgRect({ left: ir.left - pr.left, top: ir.top - pr.top, w: ir.width, h: ir.height });
  }

  function startResize(e, handle) {
    e.preventDefault(); e.stopPropagation();
    if (!selImg) return;
    const startX = e.clientX, startY = e.clientY;
    const startW = selImg.offsetWidth || 200;
    const startH = selImg.offsetHeight || 200;
    const aspect = startH / Math.max(startW, 1);
    const onMove = (me) => {
      const dx = me.clientX - startX, dy = me.clientY - startY;
      let newW = startW;
      if (handle === 'se' || handle === 'e' || handle === 'ne') newW = Math.max(40, startW + dx);
      else if (handle === 'sw' || handle === 'w' || handle === 'nw') newW = Math.max(40, startW - dx);
      else if (handle === 's') newW = Math.max(40, startW + dy / aspect);
      else if (handle === 'n') newW = Math.max(40, startW - dy / aspect);
      selImg.style.width = newW + 'px';
      selImg.style.height = (newW * aspect) + 'px';
      selImg.style.maxWidth = '100%';
      refreshSelRect();
    };
    const onUp = () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); handleEditorInput(); };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }

  function startZoneResize(e, zone) {
    e.preventDefault(); e.stopPropagation();
    const startY = e.clientY;
    const startH = zone === 'header' ? headerHeight : footerHeight;
    const setter = zone === 'header' ? setHeaderHeight : setFooterHeight;
    const dir = zone === 'header' ? 1 : -1; // header grows down, footer grows up
    const onMove = (me) => {
      const dy = (me.clientY - startY) * dir;
      setter(Math.max(40, Math.min(300, startH + dy)));
    };
    const onUp = () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }

  function deleteTab(id) {
    if (docTabs.length === 1) return;
    setDocTabs(prev => {
      const filtered = prev.filter(t => t.id !== id);
      if (id === activeTabId) {
        const fallback = filtered[0];
        setTimeout(() => {
          setActiveTabId(fallback.id);
        }, 0);
      }
      return filtered;
    });
  }

  function renameTab(id, newName) {
    setDocTabs(prev => prev.map(t => t.id === id ? { ...t, name: newName || t.name } : t));
    setRenamingTab(null);
  }

  function autoFill() {
    if (!pkg || !editorRef.current) return;
    editorRef.current.innerHTML = buildHTML(pkg);
    handleEditorInput();
    editorRef.current.focus();
  }

  async function insertImage(file) {
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      editorRef.current?.focus();
      exec('insertHTML', `<img src="${file_url}" style="max-width:100%;height:auto;display:block;margin:8px 0;" />`);
    } finally { setUploading(false); }
  }

  async function insertPositioned(file, position) {
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      if (position === 'header') setHeaderImage(file_url);
      else setFooterImage(file_url);
    } finally { setUploading(false); }
  }

  function insertTable() {
    let html = '<table style="width:100%;border-collapse:collapse;margin:8px 0;">';
    for (let r = 0; r < 3; r++) {
      html += '<tr>';
      for (let c = 0; c < 3; c++) html += `<td style="border:1px solid #ccc;padding:6px;min-width:60px;">&nbsp;</td>`;
      html += '</tr>';
    }
    html += '</table><p><br></p>';
    exec('insertHTML', html);
  }

  function handlePrint() {
    if (!editorRef.current) return;
    setPrinting(true);
    const content = editorRef.current.innerHTML;
    const hdr = headerImage ? `<div style="width:100%;margin-bottom:0;"><img src="${headerImage}" style="width:100%;display:block;" /></div>` : '';
    const ftr = footerImage ? `<div style="width:100%;margin-top:0;"><img src="${footerImage}" style="width:100%;display:block;" /></div>` : '';
    const win = window.open('', '_blank');
    win.document.write(`<!DOCTYPE html><html><head><title>${docName}</title><style>*{margin:0;padding:0;box-sizing:border-box;}body{font-family:Arial,sans-serif;font-size:12px;color:#000;}header,footer{width:100%;}main{padding:15mm 20mm;}table{width:100%;border-collapse:collapse;}td,th{border:1px solid #ccc;}img{max-width:100%;}@media print{}</style></head><body>${hdr}<main>${content}</main>${ftr}</body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); setPrinting(false); }, 500);
  }

  function downloadDoc() {
    const content = editorRef.current?.innerHTML || '';
    const hdr = headerImage ? `<div style="width:100%;"><img src="${headerImage}" style="width:100%;display:block;" /></div>` : '';
    const ftr = footerImage ? `<div style="width:100%;"><img src="${footerImage}" style="width:100%;display:block;" /></div>` : '';
    const html = `<!DOCTYPE html><html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><title>${docName}</title><style>@page{mso-page-orientation:portrait;margin:1in;}body{font-family:Arial,sans-serif;font-size:11pt;color:#000;}table{border-collapse:collapse;width:100%;}td,th{border:1px solid #ccc;padding:6px 10px;}img{max-width:100%;}</style></head><body>${hdr}<div style="padding:1in 0">${content}</div>${ftr}</body></html>`;
    const blob = new Blob(['﻿', html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${docName}.doc`;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  }

  async function handleAiImport(file) {
    if (!file) return;
    setAiLoading(true); setAiError(''); setAiStatus('Uploading file…');
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setAiStatus('Reading document content…');
      const extracted = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url,
        json_schema: { type: 'object', properties: { raw_text: { type: 'string', description: 'All text content from the document, preserving structure' } } }
      });
      const rawText = extracted?.output?.raw_text || JSON.stringify(extracted?.output || '');
      if (!rawText.trim()) throw new Error('Could not extract text from file.');
      setAiStatus('AI is recreating the document layout…');
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a precise travel document formatter. Reproduce the following document as faithful HTML, matching the original layout section by section.

DOCUMENT TEXT:
${rawText}

STRICT RULES — apply every rule exactly:

GENERAL:
- Font: Arial, 12px, color #000, line-height 1.5
- Wrap everything in: <div style="font-family:Arial,sans-serif;font-size:12px;color:#000;line-height:1.5;">
- NO logos, NO images, NO graphics — text only
- Return ONLY inner HTML body content, no html/head/body tags
- Reproduce ALL text verbatim — do not skip or summarize any section

TITLE BLOCK:
- Main title: <h1 style="color:#1a56db;font-size:28px;font-weight:bold;text-align:center;margin:0 0 6px 0;">TITLE</h1>
- Price line: <p style="color:#1a56db;font-size:20px;font-weight:bold;text-align:center;margin:0 0 14px 0;">for as low as PHP X per pax</p>

TRAVEL PERIOD block (centered):
<p style="font-weight:bold;text-align:center;margin:4px 0;">TRAVEL PERIOD:</p>
<p style="color:#1a56db;font-weight:bold;text-align:center;font-size:11px;margin:2px 0;">date lines...</p>
<p style="font-weight:bold;text-align:center;font-size:11px;margin:2px 0;">(RATES VARY ON HOLIDAYS)</p>

ITINERARY TABLE — one row per day:
<table style="width:100%;border-collapse:collapse;margin-bottom:12px;font-size:11px;">
<tr><td colspan="2" style="background:#1a56db;color:#fff;text-align:center;font-weight:bold;padding:8px;font-size:13px;">ITINERARY</td></tr>
For each DAY row:
<tr><td style="background:#2563eb;color:#fff;font-weight:bold;padding:6px 10px;vertical-align:top;white-space:nowrap;border:1px solid #93c5fd;">DAY N</td><td style="border:1px solid #ccc;padding:8px;vertical-align:top;"><p style="font-weight:bold;color:#1a56db;margin:0 0 4px 0;">TITLE | TRANSPORT (MEALS)</p><ul style="margin:0 0 0 16px;padding:0;"><li style="margin-bottom:2px;">bullet</li></ul><p style="margin:4px 0 0;font-style:italic;">Hotel: ...</p></td></tr>
</table>

FLIGHT DETAILS:
<table style="width:100%;border-collapse:collapse;margin-bottom:12px;font-size:11px;"><tr><td style="background:#e5e7eb;text-align:center;font-weight:bold;padding:8px;border:1px solid #ccc;">FLIGHT DETAILS</td></tr><tr><td style="border:1px solid #ccc;padding:12px;text-align:center;">ETA/ETD text</td></tr></table>

RATES BOX:
<div style="border:2px solid #1a56db;border-radius:4px;padding:14px;text-align:center;margin-bottom:12px;"><p style="color:#1a56db;font-weight:bold;font-size:11px;margin:2px 0;">date lines</p><br><p style="margin:4px 0;">Adult & Child Rate: <strong>PHP X per pax</strong></p><p style="margin:2px 0;">Single Supplement: <strong>PHP X per pax</strong></p><p style="margin:2px 0;">Child w/o Bed: <strong>PHP X per pax</strong></p></div>

DOWN PAYMENT & COMMISSION:
<p style="font-weight:bold;color:#1a56db;text-align:center;text-decoration:underline;margin:6px 0;font-size:13px;">DOWN PAYMENT: PHP X PER PAX</p>
<p style="font-weight:bold;color:#1a56db;text-align:center;text-decoration:underline;margin:6px 0;font-size:13px;">COMMISSION: PHP X</p>

INCLUSION + EXCLUSION — always side by side:
<table style="width:100%;border-collapse:collapse;margin-bottom:12px;font-size:11px;"><tr><td style="background:#1a56db;color:#fff;text-align:center;font-weight:bold;padding:8px;width:50%;border:1px solid #ccc;">INCLUSION</td><td style="background:#1a56db;color:#fff;text-align:center;font-weight:bold;padding:8px;width:50%;border:1px solid #ccc;">EXCLUSION</td></tr><tr><td style="border:1px solid #ccc;padding:8px;vertical-align:top;">- item<br>- item</td><td style="border:1px solid #ccc;padding:8px;vertical-align:top;">- item<br>&nbsp;&nbsp;&nbsp;o sub-item</td></tr></table>

TERMS AND CONDITIONS:
<table style="width:100%;border-collapse:collapse;margin-bottom:12px;font-size:11px;"><tr><td style="background:#e5e7eb;text-align:center;font-weight:bold;padding:8px;border:1px solid #ccc;">TERMS AND CONDITIONS</td></tr><tr><td style="border:1px solid #ccc;padding:10px;">- item<br>- item</td></tr></table>

BLUE HEADER NOTICE SECTIONS (ANNOUNCEMENT, IMPORTANT NOTICE, etc.):
<table style="width:100%;border-collapse:collapse;margin-bottom:12px;font-size:11px;"><tr><td style="background:#1a56db;color:#fff;text-align:center;font-weight:bold;padding:8px;border:1px solid #ccc;">SECTION TITLE</td></tr><tr><td style="border:1px solid #ccc;padding:10px;">content</td></tr></table>

RED NOTICE: <p style="color:#dc2626;font-weight:bold;text-align:center;font-size:12px;margin:10px 0;">text</p>
CONFIDENTIAL: <p style="text-align:center;font-weight:bold;margin:16px 0 2px 0;">KINDLY TAKE NOTE...</p><p style="text-align:center;margin:2px 0;">PLEASE <span style="color:#dc2626;font-weight:bold;">DO NOT</span> SEND THIS TO YOUR CLIENT.</p>
FOOTER: <p style="text-align:center;font-weight:bold;font-size:11px;margin:16px 0 4px 0;">ALL RATES ARE EXCLUSIVE OF VAT</p>`,
        response_json_schema: { type: 'object', properties: { html: { type: 'string', description: 'The formatted HTML document content' } } }
      });
      const html = result?.html || result;
      if (!html || typeof html !== 'string') throw new Error('AI did not return valid HTML.');
      editorRef.current.innerHTML = html;
      handleEditorInput();
      setAiStatus(''); setShowAiPanel(false);
    } catch (e) {
      setAiError(e.message || 'AI import failed. Please try again.');
      setAiStatus('');
    } finally {
      setAiLoading(false);
      if (aiFileRef.current) aiFileRef.current.value = '';
    }
  }

  const S = { // shared inline style palette (light, never dark)
    white: '#ffffff',
    bg: '#f0f4f9',
    toolbar: '#f8f9fa',
    border: '#dadce0',
    text: '#3c4043',
    blue: '#1a73e8',
    sidebar: '#ffffff',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 168px)', minHeight: 600, background: S.white, color: S.text, fontFamily: 'Google Sans, Arial, sans-serif', border: '1px solid #dadce0', borderRadius: 8, overflow: 'hidden' }}>

      {/* ══════════════════ TITLE BAR ══════════════════ */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 16px 2px', background: S.white, borderBottom: `1px solid ${S.border}`, flexShrink: 0 }}>
        {/* Doc icon */}
        <div style={{ width: 40, height: 40, background: '#4285f4', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
          <FileText style={{ width: 22, height: 22, color: 'white' }} />
        </div>

        {/* Name + menus */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            {editingName ? (
              <input ref={nameInputRef} value={docName}
                onChange={e => setDocName(e.target.value)}
                onBlur={() => setEditingName(false)}
                onKeyDown={e => e.key === 'Enter' && setEditingName(false)}
                style={{ fontSize: 18, fontWeight: 500, border: 'none', outline: '2px solid #4285f4', borderRadius: 3, padding: '1px 6px', color: S.text, background: S.white, minWidth: 120 }} />
            ) : (
              <span onClick={() => { setEditingName(true); setTimeout(() => nameInputRef.current?.select(), 30); }}
                style={{ fontSize: 18, fontWeight: 500, color: S.text, cursor: 'text', padding: '1px 6px', borderRadius: 3, userSelect: 'none' }}
                title="Click to rename">
                {docName}
              </span>
            )}
            <Star style={{ width: 16, height: 16, color: '#80868b', cursor: 'pointer', flexShrink: 0 }} />
          </div>

          {/* Menu bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 0, flexWrap: 'nowrap' }}>
            <MenuBar label="File">
              <MI label="New document" onClick={() => { if(editorRef.current) { editorRef.current.innerHTML=''; handleEditorInput(); }}} />
              <MI divider />
              <MI label="Download as Word (.doc)" onClick={downloadDoc} />
              <MI label="Download as PDF" onClick={handlePrint} />
              <MI divider />
              <MI label="Print" shortcut="Ctrl+P" onClick={handlePrint} />
            </MenuBar>
            <MenuBar label="Edit">
              <MI label="Undo" shortcut="Ctrl+Z" onClick={() => exec('undo')} />
              <MI label="Redo" shortcut="Ctrl+Y" onClick={() => exec('redo')} />
              <MI divider />
              <MI label="Cut" shortcut="Ctrl+X" onClick={() => exec('cut')} />
              <MI label="Copy" shortcut="Ctrl+C" onClick={() => exec('copy')} />
              <MI label="Paste" shortcut="Ctrl+V" onClick={() => exec('paste')} />
              <MI divider />
              <MI label="Select all" shortcut="Ctrl+A" onClick={() => exec('selectAll')} />
            </MenuBar>
            <MenuBar label="Insert">
              <MI label="Image at cursor" onClick={() => imgInputRef.current?.click()} />
              <MI label="Header image (top)" onClick={() => headerImgRef.current?.click()} />
              <MI label="Footer image (bottom)" onClick={() => footerImgRef.current?.click()} />
              <MI divider />
              <MI label="Table (3×3)" onClick={insertTable} />
              <MI label="Horizontal line" onClick={() => exec('insertHorizontalRule')} />
              <MI label="Link" shortcut="Ctrl+K" onClick={() => { const u = prompt('URL:','https://'); if(u) exec('createLink', u); }} />
            </MenuBar>
            <MenuBar label="Format">
              <MI label="Bold" shortcut="Ctrl+B" onClick={() => exec('bold')} />
              <MI label="Italic" shortcut="Ctrl+I" onClick={() => exec('italic')} />
              <MI label="Underline" shortcut="Ctrl+U" onClick={() => exec('underline')} />
              <MI label="Strikethrough" onClick={() => exec('strikeThrough')} />
              <MI divider />
              <MI label="Align left" onClick={() => exec('justifyLeft')} />
              <MI label="Align center" onClick={() => exec('justifyCenter')} />
              <MI label="Align right" onClick={() => exec('justifyRight')} />
              <MI label="Justify" onClick={() => exec('justifyFull')} />
              <MI divider />
              <MI label="Paragraph" onClick={() => exec('formatBlock','p')} />
              <MI label="Heading 1" onClick={() => exec('formatBlock','h1')} />
              <MI label="Heading 2" onClick={() => exec('formatBlock','h2')} />
              <MI label="Heading 3" onClick={() => exec('formatBlock','h3')} />
            </MenuBar>
            <MenuBar label="GLADEX">
              <MI label="AI Smart Import" onClick={() => { setShowAiPanel(v => !v); setAiError(''); }} />
              <MI divider />
              {pkg
                ? <MI label={`Auto-fill: ${pkg.name}`} onClick={autoFill} />
                : <MI label="Auto-fill (select package first)" onClick={() => {}} />
              }
            </MenuBar>
          </div>
        </div>

        {/* Right actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, marginTop: 4 }}>
          {/* Package selector */}
          <Select value={selectedId} onValueChange={setSelectedId}>
            <SelectTrigger style={{ height: 32, fontSize: 12, width: 180, background: 'white', border: '1px solid #dadce0', borderRadius: 4 }}>
              <SelectValue placeholder="Select package…" />
            </SelectTrigger>
            <SelectContent>
              {collectives.map(c => <SelectItem key={c.id} value={c.id} style={{ fontSize: 12 }}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          {pkg && (
            <button onClick={autoFill}
              style={{ height: 32, padding: '0 14px', background: '#1a73e8', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
              <Wand2 style={{ width: 13, height: 13 }} /> Auto-fill
            </button>
          )}
          {/* Download split button */}
          <MenuBar label={
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
              <Download style={{ width: 13, height: 13 }} /> Save
            </span>
          }>
            <MI label="Download Word (.doc)" onClick={downloadDoc} />
            <MI label="Print / Save PDF" onClick={handlePrint} />
          </MenuBar>
        </div>
      </div>

      {/* ══════════════════ FORMATTING TOOLBAR ══════════════════ */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 1, padding: '4px 12px', background: S.toolbar, borderBottom: `1px solid ${S.border}`, flexShrink: 0, overflowX: 'auto', flexWrap: 'nowrap' }}>
        <TB title="Undo" onClick={() => exec('undo')}><Undo2 style={{ width: 14, height: 14 }} /></TB>
        <TB title="Redo" onClick={() => exec('redo')}><Redo2 style={{ width: 14, height: 14 }} /></TB>
        <TB title="Print" onClick={handlePrint} disabled={printing}>
          {printing ? <Loader2 style={{ width: 14, height: 14 }} className="de-spin" /> : <Printer style={{ width: 14, height: 14 }} />}
        </TB>
        <Divider />

        {/* Paragraph style */}
        <select defaultValue="p" onChange={e => exec('formatBlock', e.target.value)}
          style={{ height: 26, fontSize: 12, border: `1px solid ${S.border}`, borderRadius: 4, padding: '0 4px', background: S.white, color: S.text, width: 126, cursor: 'pointer' }}>
          <option value="p">Normal text</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
          <option value="h4">Heading 4</option>
          <option value="h5">Heading 5</option>
          <option value="h6">Heading 6</option>
          <option value="pre">Preformatted</option>
        </select>
        <Divider />

        {/* Font family */}
        <select value={fontName} onChange={e => { setFontName(e.target.value); exec('fontName', e.target.value); }}
          style={{ height: 26, fontSize: 12, border: `1px solid ${S.border}`, borderRadius: 4, padding: '0 4px', background: S.white, color: S.text, width: 118, cursor: 'pointer' }}>
          {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
        </select>
        <Divider />

        {/* Font size */}
        <button title="Decrease size" onMouseDown={e => { e.preventDefault(); const i = Math.max(0, SIZES.indexOf(fontSize) - 1); setFontSize(SIZES[i]); exec('fontSize', i + 1); }}
          style={{ width: 22, height: 26, border: `1px solid ${S.border}`, background: S.white, borderRadius: '4px 0 0 4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: S.text }}>
          <Minus style={{ width: 11, height: 11 }} />
        </button>
        <input type="number" value={fontSize} min={6} max={96}
          onChange={e => { setFontSize(e.target.value); exec('fontSize', e.target.value); }}
          style={{ width: 38, height: 26, textAlign: 'center', border: `1px solid ${S.border}`, borderLeft: 'none', borderRight: 'none', fontSize: 12, color: S.text, background: S.white }} />
        <button title="Increase size" onMouseDown={e => { e.preventDefault(); const i = Math.min(SIZES.length-1, SIZES.indexOf(fontSize) + 1); setFontSize(SIZES[i]); exec('fontSize', i + 1); }}
          style={{ width: 22, height: 26, border: `1px solid ${S.border}`, background: S.white, borderRadius: '0 4px 4px 0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: S.text }}>
          <Plus style={{ width: 11, height: 11 }} />
        </button>
        <Divider />

        <TB title="Bold (Ctrl+B)" onClick={() => exec('bold')}><Bold style={{ width: 14, height: 14 }} /></TB>
        <TB title="Italic (Ctrl+I)" onClick={() => exec('italic')}><Italic style={{ width: 14, height: 14 }} /></TB>
        <TB title="Underline (Ctrl+U)" onClick={() => exec('underline')}><Underline style={{ width: 14, height: 14 }} /></TB>
        <TB title="Strikethrough" onClick={() => exec('strikeThrough')}><Strikethrough style={{ width: 14, height: 14 }} /></TB>

        {/* Text color */}
        <div title="Text color" style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, flexShrink: 0, cursor: 'pointer' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pointerEvents: 'none' }}>
            <Type style={{ width: 13, height: 13, color: S.text }} />
            <div style={{ width: 14, height: 3, background: foreColor, borderRadius: 1, marginTop: 1 }} />
          </div>
          <input type="color" value={foreColor} onChange={e => { setForeColor(e.target.value); exec('foreColor', e.target.value); }}
            style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }} />
        </div>

        {/* Highlight */}
        <div title="Highlight color" style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, flexShrink: 0, cursor: 'pointer' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pointerEvents: 'none' }}>
            <Highlighter style={{ width: 13, height: 13, color: S.text }} />
            <div style={{ width: 14, height: 3, background: hiColor, borderRadius: 1, marginTop: 1 }} />
          </div>
          <input type="color" value={hiColor} onChange={e => { setHiColor(e.target.value); exec('hiliteColor', e.target.value); }}
            style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }} />
        </div>
        <Divider />

        <TB title="Insert link" onClick={() => { const u = prompt('URL:','https://'); if(u) exec('createLink', u); }}><Link style={{ width: 14, height: 14 }} /></TB>
        <TB title="Insert image" onClick={() => imgInputRef.current?.click()} disabled={uploading}>
          {uploading ? <Loader2 style={{ width: 14, height: 14 }} className="de-spin" /> : <ImageIcon style={{ width: 14, height: 14 }} />}
        </TB>
        <Divider />

        <TB title="Align left" onClick={() => exec('justifyLeft')}><AlignLeft style={{ width: 14, height: 14 }} /></TB>
        <TB title="Align center" onClick={() => exec('justifyCenter')}><AlignCenter style={{ width: 14, height: 14 }} /></TB>
        <TB title="Align right" onClick={() => exec('justifyRight')}><AlignRight style={{ width: 14, height: 14 }} /></TB>
        <TB title="Justify" onClick={() => exec('justifyFull')}><AlignJustify style={{ width: 14, height: 14 }} /></TB>
        <Divider />

        <TB title="Bullet list" onClick={() => exec('insertUnorderedList')}><List style={{ width: 14, height: 14 }} /></TB>
        <TB title="Numbered list" onClick={() => exec('insertOrderedList')}><ListOrdered style={{ width: 14, height: 14 }} /></TB>
        <TB title="Decrease indent" onClick={() => exec('outdent')}><span style={{ fontSize: 11, fontWeight: 700 }}>←</span></TB>
        <TB title="Increase indent" onClick={() => exec('indent')}><span style={{ fontSize: 11, fontWeight: 700 }}>→</span></TB>
        <Divider />

        <TB title="Insert table" onClick={insertTable}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
            <rect x="0" y="0" width="14" height="3" opacity=".6" rx="0.5"/>
            <rect x="0" y="4" width="6" height="4" opacity=".4" rx="0.5"/>
            <rect x="8" y="4" width="6" height="4" opacity=".4" rx="0.5"/>
            <rect x="0" y="10" width="6" height="4" opacity=".4" rx="0.5"/>
            <rect x="8" y="10" width="6" height="4" opacity=".4" rx="0.5"/>
          </svg>
        </TB>
        <TB title="Horizontal line" onClick={() => exec('insertHorizontalRule')}><Minus style={{ width: 14, height: 14 }} /></TB>

        <Divider />
        {/* AI Import button */}
        <button onClick={() => { setShowAiPanel(v => !v); setAiError(''); }}
          style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 4, border: '1px solid #7c3aed', background: showAiPanel ? '#ede9fe' : 'transparent', color: '#7c3aed', cursor: 'pointer', fontSize: 12, height: 26, flexShrink: 0, whiteSpace: 'nowrap' }}>
          <Sparkles style={{ width: 13, height: 13 }} /> AI Import
        </button>
      </div>

      {/* ══════════════════ AI PANEL ══════════════════ */}
      {showAiPanel && (
        <div style={{ background: '#faf5ff', borderBottom: '1px solid #ddd6fe', padding: '12px 20px', display: 'flex', flexDirection: 'column', gap: 10, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Sparkles style={{ width: 16, height: 16, color: 'white' }} />
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#1e1b4b', margin: 0 }}>AI Smart Import</p>
              <p style={{ fontSize: 11, color: '#6b7280', margin: 0 }}>Upload any document — AI reads the content and recreates the full layout</p>
            </div>
            <button onClick={() => setShowAiPanel(false)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', display: 'flex' }}>
              <X style={{ width: 16, height: 16 }} />
            </button>
          </div>
          <input ref={aiFileRef} type="file" accept="image/*,.pdf,.docx,.doc,.txt" style={{ display: 'none' }}
            onChange={e => handleAiImport(e.target.files[0])} />
          {!aiLoading ? (
            <button onClick={() => aiFileRef.current?.click()}
              style={{ width: '100%', border: '2px dashed #a78bfa', borderRadius: 12, padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, background: 'transparent', cursor: 'pointer' }}
              onMouseEnter={e => e.currentTarget.style.background = '#ede9fe'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <Upload style={{ width: 24, height: 24, color: '#7c3aed' }} />
              <span style={{ fontSize: 13, fontWeight: 500, color: '#5b21b6' }}>Click to upload PDF, image, or Word doc</span>
              <span style={{ fontSize: 11, color: '#6b7280' }}>AI will read and reproduce the full document layout</span>
            </button>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '20px 0' }}>
              <Loader2 style={{ width: 28, height: 28, color: '#7c3aed' }} className="de-spin" />
              <p style={{ fontSize: 13, fontWeight: 500, color: '#5b21b6', margin: 0 }}>{aiStatus}</p>
              <p style={{ fontSize: 11, color: '#6b7280', margin: 0 }}>This may take 15–30 seconds…</p>
            </div>
          )}
          {aiError && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: '#fff1f2', borderRadius: 8, border: '1px solid #fecdd3' }}>
              <AlertCircle style={{ width: 16, height: 16, color: '#ef4444', flexShrink: 0 }} />
              <p style={{ fontSize: 12, color: '#dc2626', margin: 0 }}>{aiError}</p>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════ BODY: SIDEBAR + PAGES ══════════════════ */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* ── Document Tabs Sidebar ── */}
        <div style={{ width: 200, background: S.white, borderRight: `1px solid ${S.border}`, display: 'flex', flexDirection: 'column', flexShrink: 0, overflow: 'hidden' }}>
          <div style={{ padding: '12px 12px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid #f1f3f4` }}>
            <span style={{ fontSize: 12, fontWeight: 500, color: S.text }}>Document tabs</span>
            <button onClick={addTab} title="Add tab"
              style={{ width: 22, height: 22, borderRadius: 4, border: 'none', background: '#f1f3f4', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              onMouseEnter={e => e.currentTarget.style.background = '#e8eaed'}
              onMouseLeave={e => e.currentTarget.style.background = '#f1f3f4'}>
              <Plus style={{ width: 14, height: 14, color: S.text }} />
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '6px' }}>
            {docTabs.map(tab => (
              <div key={tab.id} onClick={() => switchTab(tab.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px', borderRadius: 6, cursor: 'pointer', background: tab.id === activeTabId ? '#e8f0fe' : 'transparent', marginBottom: 2, position: 'relative' }}
                onMouseEnter={e => { if (tab.id !== activeTabId) e.currentTarget.style.background = '#f1f3f4'; }}
                onMouseLeave={e => { if (tab.id !== activeTabId) e.currentTarget.style.background = 'transparent'; }}>

                <FileText style={{ width: 14, height: 14, color: tab.id === activeTabId ? '#1a73e8' : '#80868b', flexShrink: 0 }} />

                {renamingTab === tab.id ? (
                  <input autoFocus defaultValue={tab.name}
                    onBlur={e => renameTab(tab.id, e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') renameTab(tab.id, e.target.value); e.stopPropagation(); }}
                    onClick={e => e.stopPropagation()}
                    style={{ flex: 1, fontSize: 12, border: '1px solid #4285f4', borderRadius: 3, padding: '1px 4px', outline: 'none', color: S.text, background: S.white }} />
                ) : (
                  <span onDoubleClick={e => { e.stopPropagation(); setRenamingTab(tab.id); }}
                    style={{ flex: 1, fontSize: 12, color: tab.id === activeTabId ? '#1a73e8' : S.text, fontWeight: tab.id === activeTabId ? 500 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {tab.name}
                  </span>
                )}

                {/* Three-dot menu button */}
                <div style={{ position: 'relative' }} ref={tabMenu?.id === tab.id ? tabMenuRef : null}>
                  <button onClick={e => { e.stopPropagation(); setTabMenu(tabMenu?.id === tab.id ? null : { id: tab.id }); }}
                    style={{ width: 20, height: 20, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 3, color: '#80868b', flexShrink: 0 }}
                    onMouseEnter={e => e.currentTarget.style.background = '#e8eaed'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <MoreVertical style={{ width: 12, height: 12 }} />
                  </button>
                  {tabMenu?.id === tab.id && (
                    <div style={{ position: 'absolute', right: 0, top: '100%', zIndex: 9999, background: 'white', border: `1px solid ${S.border}`, borderRadius: 4, boxShadow: '0 2px 8px rgba(0,0,0,.2)', minWidth: 130, padding: '4px 0' }}>
                      <button onClick={e => { e.stopPropagation(); setRenamingTab(tab.id); setTabMenu(null); }}
                        style={{ display: 'block', width: '100%', padding: '7px 14px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 12, color: S.text, textAlign: 'left' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#f1f3f4'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        Rename
                      </button>
                      <button onClick={e => { e.stopPropagation(); deleteTab(tab.id); setTabMenu(null); }}
                        style={{ display: 'block', width: '100%', padding: '7px 14px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 12, color: '#d93025', textAlign: 'left' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#fff1f2'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {docTabs.length === 0 && (
              <p style={{ fontSize: 11, color: '#80868b', padding: '8px 4px', lineHeight: 1.5 }}>Headings you add to the document will appear here.</p>
            )}
          </div>
        </div>

        {/* ── Pages area ── */}
        <div ref={pagesAreaRef} style={{ flex: 1, overflow: 'auto', background: S.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 0 48px' }}>

          {/* Ruler */}
          <div style={{ width: '100%', maxWidth: 856, position: 'sticky', top: 0, zIndex: 10, background: '#f0f4f9', height: 24, flexShrink: 0 }}>
            <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', width: 816, height: '100%', background: S.white, borderLeft: `1px solid ${S.border}`, borderRight: `1px solid ${S.border}`, display: 'flex', alignItems: 'flex-end', paddingBottom: 2 }}>
              {Array.from({ length: 33 }, (_, i) => (
                <div key={i} style={{ flex: 1, position: 'relative' }}>
                  <div style={{ position: 'absolute', left: 0, bottom: 0, width: 1, height: i % 8 === 0 ? 10 : i % 4 === 0 ? 7 : i % 2 === 0 ? 4 : 2, background: '#9aa0a6' }} />
                  {i % 8 === 0 && i > 0 && i < 32 && (
                    <span style={{ position: 'absolute', left: 3, bottom: 11, fontSize: 8, color: '#9aa0a6', lineHeight: 1 }}>{i / 8}"</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Hidden inputs */}
          <input ref={imgInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => insertImage(e.target.files[0])} />
          <input ref={headerImgRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => insertPositioned(e.target.files[0], 'header')} />
          <input ref={footerImgRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => insertPositioned(e.target.files[0], 'footer')} />

          {/* A4 white page — 3 zones: header | body | footer */}
          <div ref={pageRef} style={{ width: 816, background: 'white', minHeight: 1056, boxShadow: '0 1px 4px rgba(0,0,0,.3)', marginTop: 16, position: 'relative', display: 'flex', flexDirection: 'column' }}
            onClick={e => { if (!e.target.closest('[data-resize]') && e.target.tagName !== 'IMG') { setSelImg(null); setSelImgRect(null); } }}
          >
            {/* ── HEADER ZONE — only renders when an image is set ── */}
            {headerImage && (
              <div
                onDragOver={e => { e.preventDefault(); e.stopPropagation(); setDragZone('header'); }}
                onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget)) setDragZone(null); }}
                onDrop={e => { e.preventDefault(); e.stopPropagation(); setDragZone(null); const f = Array.from(e.dataTransfer.files).find(f => f.type.startsWith('image/')); if (f) insertPositioned(f, 'header'); }}
                style={{ position: 'relative', height: headerHeight, flexShrink: 0, overflow: 'hidden', borderBottom: '1px solid #e8eaed', background: '#fff' }}
              >
                <img src={headerImage} alt="header" style={{ width: '100%', height: '100%', display: 'block', objectFit: 'cover', objectPosition: 'center top' }} />
                <div style={{ position: 'absolute', top: 4, right: 6, display: 'flex', gap: 4, zIndex: 5 }}>
                  <button onClick={e => { e.stopPropagation(); headerImgRef.current?.click(); }}
                    style={{ fontSize: 9, padding: '1px 6px', background: 'rgba(26,115,232,0.85)', color: '#fff', border: 'none', borderRadius: 3, cursor: 'pointer', backdropFilter: 'blur(2px)' }}>Replace</button>
                  <button onClick={e => { e.stopPropagation(); setHeaderImage(null); }}
                    style={{ fontSize: 9, padding: '1px 6px', background: 'rgba(217,48,37,0.85)', color: '#fff', border: 'none', borderRadius: 3, cursor: 'pointer', backdropFilter: 'blur(2px)' }}>✕</button>
                </div>
                <div onMouseDown={e => startZoneResize(e, 'header')}
                  style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 8, cursor: 'ns-resize', background: 'rgba(26,115,232,0.20)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 6 }}>
                  <div style={{ width: 32, height: 2, background: '#1a73e8', borderRadius: 2, opacity: 0.6 }} />
                </div>
              </div>
            )}

            {/* ── CONTENT BODY ── */}
            <div
              onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; setDragZone('body'); }}
              onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget)) setDragZone(null); }}
              onDrop={e => {
                e.preventDefault(); setDragZone(null);
                const f = Array.from(e.dataTransfer.files).find(f => f.type.startsWith('image/'));
                if (!f) return;
                const range = document.caretRangeFromPoint?.(e.clientX, e.clientY);
                if (range) { const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(range); }
                insertImage(f);
              }}
              style={{ flex: 1, position: 'relative', outline: dragZone === 'body' ? '2px dashed #1a73e8' : 'none' }}
            >
              <div ref={editorRef} contentEditable suppressContentEditableWarning spellCheck
                className="de-editor"
                data-ph="Start typing your document here…"
                onInput={handleEditorInput}
                onKeyDown={e => { if (e.key === 'Tab') { e.preventDefault(); exec('insertHTML', '&nbsp;&nbsp;&nbsp;&nbsp;'); } }}
                style={{ outline: 'none', minHeight: 900, padding: '40px 72px', fontFamily: fontName || 'Arial', fontSize: 13, lineHeight: 1.6, color: '#000', caretColor: '#1a73e8' }} />

              {/* Image resize overlay */}
              {selImgRect && (
                <div data-resize="true" style={{ position: 'absolute', left: selImgRect.left - 2, top: selImgRect.top - 2, width: selImgRect.w + 4, height: selImgRect.h + 4, border: '2px solid #1a73e8', pointerEvents: 'none', zIndex: 100 }}>
                  {[
                    { pos: 'nw', s: { top: -5, left: -5, cursor: 'nw-resize' } },
                    { pos: 'n',  s: { top: -5, left: '50%', marginLeft: -4, cursor: 'n-resize' } },
                    { pos: 'ne', s: { top: -5, right: -5, cursor: 'ne-resize' } },
                    { pos: 'e',  s: { top: '50%', marginTop: -4, right: -5, cursor: 'e-resize' } },
                    { pos: 'se', s: { bottom: -5, right: -5, cursor: 'se-resize' } },
                    { pos: 's',  s: { bottom: -5, left: '50%', marginLeft: -4, cursor: 's-resize' } },
                    { pos: 'sw', s: { bottom: -5, left: -5, cursor: 'sw-resize' } },
                    { pos: 'w',  s: { top: '50%', marginTop: -4, left: -5, cursor: 'w-resize' } },
                  ].map(h => (
                    <div key={h.pos} data-resize="true"
                      onMouseDown={e => startResize(e, h.pos)}
                      style={{ position: 'absolute', width: 8, height: 8, background: 'white', border: '1.5px solid #1a73e8', borderRadius: 1, pointerEvents: 'all', zIndex: 101, ...h.s }} />
                  ))}
                </div>
              )}
            </div>

            {/* ── FOOTER ZONE — only renders when an image is set ── */}
            {footerImage ? (
              <div
                onDragOver={e => { e.preventDefault(); e.stopPropagation(); setDragZone('footer'); }}
                onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget)) setDragZone(null); }}
                onDrop={e => { e.preventDefault(); e.stopPropagation(); setDragZone(null); const f = Array.from(e.dataTransfer.files).find(f => f.type.startsWith('image/')); if (f) insertPositioned(f, 'footer'); }}
                style={{ position: 'relative', height: footerHeight, flexShrink: 0, overflow: 'hidden', borderTop: '1px solid #e8eaed', background: '#fff' }}
              >
                <div onMouseDown={e => startZoneResize(e, 'footer')}
                  style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 8, cursor: 'ns-resize', background: 'rgba(26,115,232,0.20)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 6 }}>
                  <div style={{ width: 32, height: 2, background: '#1a73e8', borderRadius: 2, opacity: 0.6 }} />
                </div>
                <img src={footerImage} alt="footer" style={{ width: '100%', height: '100%', display: 'block', objectFit: 'cover', objectPosition: 'center' }} />
                <div style={{ position: 'absolute', bottom: 4, right: 6, display: 'flex', gap: 4, zIndex: 5 }}>
                  <button onClick={e => { e.stopPropagation(); footerImgRef.current?.click(); }}
                    style={{ fontSize: 9, padding: '1px 6px', background: 'rgba(26,115,232,0.85)', color: '#fff', border: 'none', borderRadius: 3, cursor: 'pointer', backdropFilter: 'blur(2px)' }}>Replace</button>
                  <button onClick={e => { e.stopPropagation(); setFooterImage(null); }}
                    style={{ fontSize: 9, padding: '1px 6px', background: 'rgba(217,48,37,0.85)', color: '#fff', border: 'none', borderRadius: 3, cursor: 'pointer', backdropFilter: 'blur(2px)' }}>✕</button>
                </div>
              </div>
            ) : (
              <div
                onDragOver={e => { e.preventDefault(); e.stopPropagation(); setDragZone('footer'); }}
                onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget)) setDragZone(null); }}
                onDrop={e => { e.preventDefault(); e.stopPropagation(); setDragZone(null); const f = Array.from(e.dataTransfer.files).find(f => f.type.startsWith('image/')); if (f) insertPositioned(f, 'footer'); }}
                style={{ height: 32, borderTop: '1px dashed #e8eaed', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, background: dragZone === 'footer' ? '#e8f0fe' : 'transparent' }}
                onClick={() => footerImgRef.current?.click()}
              >
                <span style={{ fontSize: 10, color: dragZone === 'footer' ? '#1a73e8' : '#c5c7cb', userSelect: 'none' }}>
                  {dragZone === 'footer' ? '⬇ Drop to set footer' : '▼ Footer — click or use Insert menu'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
