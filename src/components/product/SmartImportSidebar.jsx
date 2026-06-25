// @ts-nocheck
import { useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import {
  X, Search, Download, Shuffle, Clock, Check, Copy, Zap,
  ChevronRight, Upload, FileText, Loader2, Sparkles, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// ─── Ref code generator (exported for use in workspace) ──────────────────────

export function generateRefCode(collective) {
  const dest = (collective.destination || 'PKG')
    .toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 6);
  const year = collective.departure_date
    ? new Date(collective.departure_date).getFullYear()
    : new Date().getFullYear();
  const seq = (collective.id || '').substring(0, 5).toUpperCase();
  return `EZQ-${dest}-${year}-${seq}`;
}

// ─── Text parser (ref codes + raw text) ──────────────────────────────────────

function parseRawText(text, collectives) {
  const codeMatch = text.match(/EZQ-[A-Z0-9-]+/i);
  if (codeMatch) {
    const match = collectives.find(c => generateRefCode(c) === codeMatch[0].toUpperCase());
    if (match) return { collective: match };
  }
  const result = {};
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines[0]) result.package_name = lines[0];
  const dur = text.match(/(\d+)\s*nights?/i);
  if (dur) result.nights = dur[1];
  const dest = lines.find(l => /japan|korea|bohol|cebu|taiwan|singapore|dubai|europe|bali|thailand|vietnam|hongkong|macau|manila|boracay/i.test(l));
  if (dest) result.destination = dest;
  const price = text.match(/[₱$]\s*([\d,]+)/);
  if (price) result.base_cost_foreign = parseFloat(price[1].replace(/,/g, ''));
  return Object.keys(result).length > 0 ? { partial: result } : null;
}

// ─── AI File Parser Tab ───────────────────────────────────────────────────────

function AIParseTab({ onFieldsDetected }) {
  const [file, setFile] = useState(null);
  const [parsing, setParsing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (f) { setFile(f); setResult(null); setError(null); }
  };

  const handleParse = async () => {
    if (!file) return;
    setParsing(true);
    setError(null);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const parsed = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url,
        json_schema: {
          type: 'object',
          properties: {
            package_name: { type: 'string' },
            destination: { type: 'string' },
            departure_date: { type: 'string' },
            return_date: { type: 'string' },
            nights: { type: 'string' },
            pax_estimate: { type: 'number' },
            operator_name: { type: 'string' },
            flight_details: { type: 'string' },
            base_cost_foreign: { type: 'number' },
            currency: { type: 'string' },
            exchange_rate: { type: 'number' },
            markup_php: { type: 'number' },
            commission_per_pax: { type: 'number' },
            downpayment_required: { type: 'number' },
            inclusions: { type: 'string' },
            exclusions: { type: 'string' },
            cancellation_policy: { type: 'string' },
            optional_tours: { type: 'string' },
            remarks: { type: 'string' },
          }
        }
      });
      if (parsed.status === 'success' && parsed.output) {
        const data = Array.isArray(parsed.output) ? parsed.output[0] : parsed.output;
        // Also run AI enrichment for better field population
        const enriched = await base44.integrations.Core.InvokeLLM({
          prompt: `You are a travel package data extractor. Given this raw extracted data from a travel package file, clean and enrich it. Return a JSON with these fields if detectable: package_name, destination, nights, departure_date, return_date, pax_estimate, operator_name, flight_details, base_cost_foreign, currency, exchange_rate, markup_php, commission_per_pax, downpayment_required, inclusions (bullet list string), exclusions (bullet list string), cancellation_policy, optional_tours, remarks. Raw data: ${JSON.stringify(data)}`,
          response_json_schema: {
            type: 'object',
            properties: {
              package_name: { type: 'string' },
              destination: { type: 'string' },
              nights: { type: 'string' },
              departure_date: { type: 'string' },
              return_date: { type: 'string' },
              pax_estimate: { type: 'number' },
              operator_name: { type: 'string' },
              flight_details: { type: 'string' },
              base_cost_foreign: { type: 'number' },
              currency: { type: 'string' },
              exchange_rate: { type: 'number' },
              markup_php: { type: 'number' },
              commission_per_pax: { type: 'number' },
              downpayment_required: { type: 'number' },
              inclusions: { type: 'string' },
              exclusions: { type: 'string' },
              cancellation_policy: { type: 'string' },
              optional_tours: { type: 'string' },
              remarks: { type: 'string' },
            }
          }
        });
        setResult(enriched || data);
      } else {
        setError('Could not extract data from this file. Try a different format.');
      }
    } catch (e) {
      setError(e.message || 'Parsing failed');
    }
    setParsing(false);
  };

  const detectedFields = result ? Object.entries(result).filter(([, v]) => v != null && v !== '' && v !== 0) : [];

  return (
    <div className="p-4 space-y-4">
      <p className="text-[10px] text-slate-400 leading-relaxed">
        Upload a package file (Excel, CSV, PDF, DOCX). AI will auto-detect and populate all package fields.
      </p>

      {/* File picker */}
      <label className={cn(
        "flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed cursor-pointer transition-all",
        file ? "border-amber-500/50 bg-amber-500/5" : "border-white/10 hover:border-white/20 bg-white/3"
      )}>
        <input type="file" accept=".xlsx,.xls,.csv,.pdf,.docx,.txt" className="hidden" onChange={handleFile} />
        <Upload className={cn("w-5 h-5", file ? "text-amber-400" : "text-slate-500")} />
        <span className={cn("text-xs text-center", file ? "text-amber-300" : "text-slate-500")}>
          {file ? file.name : 'Drop file here or click to browse'}
        </span>
        <span className="text-[9px] text-slate-600">XLSX · CSV · PDF · DOCX · TXT</span>
      </label>

      {file && !result && (
        <Button
          size="sm"
          className="w-full h-8 text-xs gradient-gold text-white border-0 gap-1.5"
          onClick={handleParse}
          disabled={parsing}
        >
          {parsing ? (
            <><Loader2 className="w-3 h-3 animate-spin" /> Analyzing with AI…</>
          ) : (
            <><Sparkles className="w-3 h-3" /> Parse & Auto-Fill</>
          )}
        </Button>
      )}

      {error && (
        <div className="flex items-start gap-2 p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-lg">
          <AlertCircle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0 mt-0.5" />
          <p className="text-[10px] text-rose-300">{error}</p>
        </div>
      )}

      {result && detectedFields.length > 0 && (
        <div className="space-y-3">
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3">
            <p className="text-[10px] text-emerald-300 font-semibold mb-2 flex items-center gap-1">
              <Check className="w-3 h-3" /> {detectedFields.length} fields detected
            </p>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {detectedFields.map(([k, v]) => (
                <div key={k} className="flex gap-2 text-[9px]">
                  <span className="text-slate-400 font-mono w-28 flex-shrink-0">{k}:</span>
                  <span className="text-slate-200 truncate">{String(v).substring(0, 30)}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              className="flex-1 h-7 text-xs gradient-gold text-white border-0 gap-1"
              onClick={() => { onFieldsDetected({ _partial: true, ...result }); setFile(null); setResult(null); }}
            >
              <Zap className="w-3 h-3" /> Apply to Editor
            </Button>
            <Button size="sm" variant="ghost" className="h-7 text-xs text-slate-400 hover:text-white" onClick={() => { setFile(null); setResult(null); }}>
              Reset
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Sidebar ─────────────────────────────────────────────────────────────

export default function SmartImportSidebar({ open, onClose, collectives, onLoadPackage }) {
  const [tab, setTab] = useState('search');
  const [search, setSearch] = useState('');
  const [padText, setPadText] = useState('');
  const [parseResult, setParseResult] = useState(null);
  const [copied, setCopied] = useState(null);
  const [recentImports, setRecentImports] = useState([]);

  const results = search.trim()
    ? collectives.filter(c => {
        const q = search.toLowerCase();
        return c.name?.toLowerCase().includes(q) ||
          c.destination?.toLowerCase().includes(q) ||
          c.operator_name?.toLowerCase().includes(q) ||
          generateRefCode(c).toLowerCase().includes(q);
      }).slice(0, 8)
    : collectives.slice(0, 6);

  const handleLoad = useCallback((c) => {
    onLoadPackage(c);
    setRecentImports(prev => [c, ...prev.filter(r => r.id !== c.id)].slice(0, 5));
  }, [onLoadPackage]);

  const handleDuplicate = useCallback(async (c) => {
    const cloned = await base44.entities.Collective.create({
      ...c,
      id: undefined,
      name: `${c.name} (Copy)`,
      status: 'draft',
      booked_pax: 0,
      available_slots: c.total_slots || 0,
      total_revenue: 0,
    });
    onLoadPackage(cloned);
    setRecentImports(prev => [cloned, ...prev].slice(0, 5));
  }, [onLoadPackage]);

  const handlePadChange = (val) => {
    setPadText(val);
    setParseResult(val.trim().length > 5 ? parseRawText(val, collectives) : null);
  };

  const handleImport = () => {
    if (!parseResult) return;
    if (parseResult.collective) handleLoad(parseResult.collective);
    else if (parseResult.partial) {
      onLoadPackage({ _partial: true, ...parseResult.partial });
      setPadText(''); setParseResult(null);
    }
  };

  const copyCode = async (code, id) => {
    await navigator.clipboard.writeText(code);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const TABS = [
    { key: 'search', label: 'Search' },
    { key: 'codes', label: 'Codes' },
    { key: 'pad', label: 'Notepad' },
    { key: 'ai', label: '✨ AI Parse' },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn("fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-200",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Drawer — slides from right */}
      <div className={cn(
        "fixed right-0 top-0 h-full w-80 z-50 bg-slate-900 border-l border-slate-700 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out",
        open ? "translate-x-0" : "translate-x-full"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-700 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <span className="font-bold text-sm text-white font-jakarta">Smart Import</span>
            <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-[9px]">UTILITY</Badge>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-1 rounded hover:bg-white/10">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-700 flex-shrink-0 overflow-x-auto">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "flex-1 py-2.5 text-[11px] font-medium transition-colors whitespace-nowrap px-2",
                tab === t.key
                  ? "text-amber-400 border-b-2 border-amber-400 bg-white/3"
                  : "text-slate-400 hover:text-slate-200"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">

          {/* SEARCH TAB */}
          {tab === 'search' && (
            <div className="p-4 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  className="w-full pl-9 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-white placeholder:text-slate-500 outline-none focus:border-amber-500/50"
                  placeholder="Name, destination, code…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                {results.map(c => {
                  const code = generateRefCode(c);
                  const price = c.selling_price || c.base_price || 0;
                  return (
                    <div key={c.id} className="bg-white/5 border border-white/10 rounded-xl p-3 hover:border-amber-500/30 transition-all">
                      <div className="flex items-start justify-between gap-1 mb-1.5">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-white truncate">{c.name}</p>
                          <p className="text-[10px] text-slate-400">{c.destination}</p>
                        </div>
                        {price > 0 && <span className="text-[10px] font-bold text-amber-400 flex-shrink-0">₱{Number(price).toLocaleString()}</span>}
                      </div>
                      <div className="flex items-center gap-1 mb-2">
                        <code className="text-[9px] font-mono text-slate-400 bg-white/5 px-1.5 py-0.5 rounded flex-1 truncate">{code}</code>
                        <button onClick={() => copyCode(code, c.id)} className="p-0.5 text-slate-500 hover:text-amber-400 transition-colors">
                          {copied === c.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                      <div className="flex gap-1.5">
                        <Button size="sm" className="flex-1 h-6 text-[10px] gradient-gold text-white border-0 gap-1" onClick={() => handleLoad(c)}>
                          <Download className="w-2.5 h-2.5" /> Load
                        </Button>
                        <Button size="sm" variant="outline" className="h-6 text-[10px] gap-1 border-white/10 text-slate-300 hover:text-white hover:bg-white/10" onClick={() => handleDuplicate(c)}>
                          <Shuffle className="w-2.5 h-2.5" /> Clone
                        </Button>
                      </div>
                    </div>
                  );
                })}
                {results.length === 0 && <p className="text-center text-xs text-slate-500 py-6">No packages found</p>}
              </div>

              {recentImports.length > 0 && (
                <div className="pt-2 border-t border-white/10">
                  <p className="text-[10px] text-slate-400 flex items-center gap-1 mb-2">
                    <Clock className="w-3 h-3" /> Recently Loaded
                  </p>
                  <div className="space-y-1">
                    {recentImports.map(r => (
                      <button
                        key={r.id}
                        onClick={() => handleLoad(r)}
                        className="w-full text-left text-[10px] bg-white/5 hover:bg-amber-500/10 border border-white/5 hover:border-amber-500/30 text-slate-300 hover:text-white px-2.5 py-1.5 rounded-lg transition-all flex items-center justify-between gap-2"
                      >
                        <span className="truncate">{r.name}</span>
                        <ChevronRight className="w-3 h-3 flex-shrink-0 text-slate-500" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* REF CODES TAB */}
          {tab === 'codes' && (
            <div className="p-4 space-y-3">
              <p className="text-[10px] text-slate-400">All package reference codes. Click to load, or copy to share.</p>
              <div className="space-y-1.5">
                {collectives.map(c => {
                  const code = generateRefCode(c);
                  return (
                    <div key={c.id} className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2 hover:bg-white/8 group transition-all">
                      <div className="flex-1 min-w-0">
                        <code className="text-[10px] font-mono text-amber-300 block truncate">{code}</code>
                        <span className="text-[9px] text-slate-500 truncate">{c.name}</span>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => copyCode(code, c.id)} className="text-slate-400 hover:text-amber-400 transition-colors">
                          {copied === c.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        </button>
                        <button onClick={() => handleLoad(c)} className="text-slate-400 hover:text-amber-400 transition-colors">
                          <Download className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* NOTEPAD TAB */}
          {tab === 'pad' && (
            <div className="p-4 space-y-3">
              <p className="text-[10px] text-slate-400 leading-relaxed">
                Paste a ref code <span className="font-mono text-amber-400">EZQ-JAPAN-2026-XXXXX</span>, raw package details, or any text. System auto-detects fields.
              </p>
              <textarea
                value={padText}
                onChange={e => handlePadChange(e.target.value)}
                rows={10}
                placeholder={"Paste here:\n• EZQ-JAPAN-2026-XXXXX\n• Package name / destination\n• Duration, dates, pricing\n• Inclusions, exclusions\n• Any raw package details"}
                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-xs text-slate-300 placeholder:text-slate-600 font-mono outline-none focus:border-amber-500/50 resize-none transition-colors"
              />
              {parseResult && (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 space-y-2">
                  {parseResult.collective ? (
                    <p className="text-xs text-emerald-300 flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5" /> Match: <span className="font-semibold">{parseResult.collective.name}</span>
                    </p>
                  ) : parseResult.partial ? (
                    <div>
                      <p className="text-[10px] text-amber-300 font-semibold mb-1">Detected fields:</p>
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(parseResult.partial).filter(([, v]) => v).map(([k, v]) => (
                          <span key={k} className="text-[9px] bg-white/10 text-slate-300 px-1.5 py-0.5 rounded font-mono">
                            {k}: {String(v).substring(0, 18)}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1 h-7 text-xs gradient-gold text-white border-0 gap-1" onClick={handleImport}>
                      <Zap className="w-3 h-3" /> {parseResult.collective ? 'Load Package' : 'Pre-fill Fields'}
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 text-xs text-slate-400 hover:text-white" onClick={() => { setPadText(''); setParseResult(null); }}>
                      Clear
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* AI PARSE TAB */}
          {tab === 'ai' && (
            <AIParseTab onFieldsDetected={(fields) => { onLoadPackage(fields); }} />
          )}
        </div>
      </div>
    </>
  );
}