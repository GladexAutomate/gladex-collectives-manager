import { useState, useRef, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import {
  Clipboard, Search, Link2, Copy, Check, ChevronDown, ChevronUp,
  Zap, Package, Clock, X, Download, Shuffle, Plane, Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// ─── Generate EZQ reference code from collective ────────────────────────────

function generateRefCode(collective) {
  const dest = (collective.destination || 'PKG')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .substring(0, 6);
  const year = collective.departure_date
    ? new Date(collective.departure_date).getFullYear()
    : new Date().getFullYear();
  const id = (collective.id || '').substring(0, 5).toUpperCase();
  return `EZQ-${dest}-${year}-${id}`;
}

// ─── Parse pasted raw text into partial quote fields ──────────────────────

function parseRawText(text, collectives) {
  const result = {};

  // Try to match a reference code: EZQ-XXXX-XXXX-XXXXX
  const codeMatch = text.match(/EZQ-[A-Z0-9-]+/i);
  if (codeMatch) {
    const code = codeMatch[0].toUpperCase();
    const match = collectives.find(c => generateRefCode(c) === code);
    if (match) return { collective: match };
  }

  // Try to extract destination-like tokens (country names, cities)
  const lines = text.split(/\n/).map(l => l.trim()).filter(Boolean);

  if (lines[0]) result.package_name = lines[0];

  // Duration: 3D2N / 4D3N / 5 days / 3 nights
  const durMatch = text.match(/(\d+)[D\s]?\s*(\d+)[N]/i) || text.match(/(\d+)\s*nights?/i);
  if (durMatch) result.nights = durMatch[1] || durMatch[2];

  // Destination from lines
  const destLine = lines.find(l => /japan|korea|bohol|cebu|taiwan|singapore|dubai|europe|bali|thailand|vietnam|hongkong|macau|manila|boracay/i.test(l));
  if (destLine) result.destination = destLine;

  // Date
  const dateMatch = text.match(/(\w+ \d{1,2})[–\-,\s]+(\w+ ?\d{1,2})/i) ||
    text.match(/(\d{4}-\d{2}-\d{2})/);
  if (dateMatch) result.departure_date = '';

  // Price: ₱XX,XXX or PHP XX,XXX or $XXX
  const priceMatch = text.match(/[₱$]\s*([\d,]+)/);
  if (priceMatch) result.base_cost_foreign = parseFloat(priceMatch[1].replace(/,/g, ''));

  return { partial: result };
}

// ─── Package result card ────────────────────────────────────────────────────

function PackageResultCard({ collective, onLoad, onDuplicate, refCode }) {
  const [copied, setCopied] = useState(false);
  const sellingPrice = collective.selling_price || collective.base_price || 0;

  const copyCode = async () => {
    await navigator.clipboard.writeText(refCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4 hover:border-amber-300 dark:hover:border-amber-700 transition-all group">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-foreground font-jakarta truncate">{collective.name}</p>
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
            <Plane className="w-3 h-3" /> {collective.destination}
            {collective.departure_date && ` · ${new Date(collective.departure_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}`}
          </p>
        </div>
        <div className="flex flex-col gap-1 items-end flex-shrink-0">
          {sellingPrice > 0 && (
            <span className="text-xs font-bold text-amber-600">₱{Number(sellingPrice).toLocaleString()}</span>
          )}
          <Badge className={cn("text-[9px]",
            collective.status === 'active' || collective.status === 'launched' ? "bg-emerald-100 text-emerald-700" :
            collective.status === 'draft' ? "bg-slate-100 text-slate-600" : "bg-sky-100 text-sky-700"
          )}>{collective.status}</Badge>
        </div>
      </div>

      {/* Ref code pill */}
      <div className="flex items-center gap-1.5 mb-3">
        <code className="text-[10px] font-mono bg-muted px-2 py-0.5 rounded-md text-muted-foreground flex-1 truncate">{refCode}</code>
        <button onClick={copyCode} className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
          {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
        </button>
      </div>

      {/* Quick stats */}
      <div className="flex gap-3 text-[10px] text-muted-foreground mb-3">
        {collective.total_slots > 0 && <span>🪑 {collective.booked_pax || 0}/{collective.total_slots} pax</span>}
        {collective.travel_type && <span>{collective.travel_type === 'international' ? '🌍' : '🏠'} {collective.travel_type}</span>}
        {collective.operator_name && <span>🏢 {collective.operator_name}</span>}
      </div>

      <div className="flex gap-2">
        <Button
          size="sm"
          className="flex-1 h-7 text-xs gradient-gold text-white border-0 gap-1"
          onClick={() => onLoad(collective)}
        >
          <Download className="w-3 h-3" /> Load into EZQuote
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs gap-1"
          onClick={() => onDuplicate(collective)}
        >
          <Shuffle className="w-3 h-3" /> Clone
        </Button>
      </div>
    </div>
  );
}

// ─── Main SmartPackagePad ─────────────────────────────────────────────────────

export default function SmartPackagePad({ collectives, onLoadPackage }) {
  const [open, setOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [padText, setPadText] = useState('');
  const [parseResult, setParseResult] = useState(null);
  const [recentImports, setRecentImports] = useState([]);
  const padRef = useRef(null);

  // ── Search results ──
  const searchResults = searchQuery.trim().length > 0
    ? collectives.filter(c => {
        const q = searchQuery.toLowerCase();
        const refCode = generateRefCode(c).toLowerCase();
        return (
          c.name?.toLowerCase().includes(q) ||
          c.destination?.toLowerCase().includes(q) ||
          c.operator_name?.toLowerCase().includes(q) ||
          refCode.includes(q)
        );
      }).slice(0, 6)
    : collectives.slice(0, 4);

  // ── Handle pad change + auto-detect ──
  const handlePadChange = (val) => {
    setPadText(val);
    setParseResult(null);
    if (val.trim().length > 5) {
      const result = parseRawText(val, collectives);
      setParseResult(result);
    }
  };

  // ── Handle paste event ──
  const handlePaste = (e) => {
    setTimeout(() => {
      const val = e.target.value;
      handlePadChange(val);
    }, 0);
  };

  // ── Load a collective into EZQuote ──
  const handleLoad = useCallback((collective) => {
    onLoadPackage(collective);
    setRecentImports(prev => {
      const filtered = prev.filter(r => r.id !== collective.id);
      return [collective, ...filtered].slice(0, 5);
    });
    setSearchQuery('');
    setPadText('');
    setParseResult(null);
  }, [onLoadPackage]);

  // ── Duplicate/clone a collective ──
  const handleDuplicate = useCallback(async (collective) => {
    const cloned = await base44.entities.Collective.create({
      ...collective,
      id: undefined,
      name: `${collective.name} (Copy)`,
      status: 'draft',
      booked_pax: 0,
      available_slots: collective.total_slots || 0,
      total_revenue: 0,
    });
    onLoadPackage(cloned);
    setRecentImports(prev => [cloned, ...prev].slice(0, 5));
  }, [onLoadPackage]);

  // ── Import from pad parse result ──
  const handleImportFromPad = () => {
    if (!parseResult) return;
    if (parseResult.collective) {
      handleLoad(parseResult.collective);
    } else if (parseResult.partial) {
      onLoadPackage({ _partial: true, ...parseResult.partial });
      setPadText('');
      setParseResult(null);
    }
  };

  return (
    <div className={cn(
      "rounded-xl border shadow-sm overflow-hidden transition-all",
      "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-slate-700"
    )}>
      {/* Header */}
      <button
        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-white/5 transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center">
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-left">
            <span className="font-bold text-sm font-jakarta text-white">Smart Package Pad</span>
            <span className="text-[10px] text-slate-400 ml-2">— paste link · search · clone any package instantly</span>
          </div>
          <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-[9px]">SMART IMPORT</Badge>
        </div>
        {open
          ? <ChevronUp className="w-4 h-4 text-slate-400" />
          : <ChevronDown className="w-4 h-4 text-slate-400" />
        }
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            {/* Left: Search / Browse */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5 text-sky-400" /> Search & Browse Packages
              </p>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <Input
                  placeholder='Search by name, destination, code, operator...'
                  className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-slate-500 text-xs h-9 focus:border-amber-500/50"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {searchResults.length === 0 ? (
                  <div className="text-center py-6 text-slate-500 text-xs">No packages found</div>
                ) : searchResults.map(c => (
                  <PackageResultCard
                    key={c.id}
                    collective={c}
                    refCode={generateRefCode(c)}
                    onLoad={handleLoad}
                    onDuplicate={handleDuplicate}
                  />
                ))}
              </div>

              {/* Recent imports */}
              {recentImports.length > 0 && (
                <div className="pt-2 border-t border-white/10">
                  <p className="text-[10px] text-slate-400 flex items-center gap-1 mb-2">
                    <Clock className="w-3 h-3" /> Recently Loaded
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {recentImports.map(r => (
                      <button
                        key={r.id}
                        onClick={() => handleLoad(r)}
                        className="text-[10px] bg-white/5 hover:bg-white/10 border border-white/10 hover:border-amber-500/40 text-slate-300 hover:text-white px-2 py-1 rounded-lg transition-all truncate max-w-[140px]"
                      >
                        {r.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right: Smart Paste Pad */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Clipboard className="w-3.5 h-3.5 text-purple-400" /> Smart Paste Pad
              </p>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                Paste a package reference code <span className="font-mono text-amber-400">EZQ-JAPAN-2026-XXXXX</span>, a package link, or raw package details. The system auto-detects and populates.
              </p>
              <textarea
                ref={padRef}
                value={padText}
                onChange={e => handlePadChange(e.target.value)}
                onPaste={handlePaste}
                rows={7}
                placeholder={"Paste here:\n• EZQ-JAPAN-2026-XXXXX\n• gladex.app/package/JPN-CB-2026\n• Japan Cherry Blossom 2026\n  4D3N Tokyo Osaka\n  March 28 - April 1\n  ₱95,000"}
                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-xs text-slate-300 placeholder:text-slate-600 font-mono outline-none focus:border-amber-500/50 resize-none transition-colors"
              />

              {/* Parse result preview */}
              {parseResult && (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 space-y-2">
                  {parseResult.collective ? (
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-emerald-300">Package match found!</p>
                        <p className="text-[10px] text-slate-400 truncate">{parseResult.collective.name} · {parseResult.collective.destination}</p>
                      </div>
                    </div>
                  ) : parseResult.partial && Object.keys(parseResult.partial).length > 0 ? (
                    <div>
                      <p className="text-[10px] text-amber-300 font-semibold mb-1.5">⚡ Detected fields:</p>
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(parseResult.partial).map(([k, v]) => v && (
                          <span key={k} className="text-[9px] bg-white/10 text-slate-300 px-1.5 py-0.5 rounded font-mono">
                            {k}: {String(v).substring(0, 20)}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {(parseResult.collective || (parseResult.partial && Object.keys(parseResult.partial).length > 0)) && (
                    <div className="flex gap-2 pt-1">
                      <Button
                        size="sm"
                        className="flex-1 h-7 text-xs gradient-gold text-white border-0 gap-1"
                        onClick={handleImportFromPad}
                      >
                        <Zap className="w-3 h-3" />
                        {parseResult.collective ? 'Load Full Package' : 'Pre-fill Fields'}
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 text-xs text-slate-400 hover:text-white" onClick={() => { setPadText(''); setParseResult(null); }}>
                        Clear
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* How to use */}
              {!parseResult && !padText && (
                <div className="rounded-lg bg-white/3 border border-white/5 p-3 space-y-1.5">
                  <p className="text-[10px] font-semibold text-slate-400">How to use:</p>
                  {[
                    ['🔗', 'Paste a package reference code (EZQ-...)'],
                    ['🔍', 'Search by destination, name, or operator'],
                    ['📋', 'Paste raw package details for auto-detection'],
                    ['⚡', 'Click "Load" to instantly populate EZQuote'],
                    ['🔁', 'Clone any package to create a variation'],
                  ].map(([icon, text]) => (
                    <p key={text} className="text-[10px] text-slate-500 flex items-start gap-1.5">
                      <span>{icon}</span> {text}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* All packages reference codes */}
          {collectives.length > 0 && (
            <div className="pt-2 border-t border-white/10">
              <p className="text-[10px] text-slate-400 mb-2 flex items-center gap-1">
                <Link2 className="w-3 h-3" /> All Package Reference Codes
              </p>
              <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
                {collectives.map(c => {
                  const code = generateRefCode(c);
                  return (
                    <button
                      key={c.id}
                      onClick={() => handleLoad(c)}
                      title={`Load: ${c.name}`}
                      className="text-[9px] font-mono bg-white/5 hover:bg-amber-500/10 border border-white/10 hover:border-amber-500/40 text-slate-400 hover:text-amber-300 px-2 py-1 rounded transition-all"
                    >
                      {code}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}