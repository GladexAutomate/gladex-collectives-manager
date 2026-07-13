// @ts-nocheck
import { useState, useEffect } from 'react';
import { useLocation, useNavigate as useSalesNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Search, Users, RefreshCw, Package, MapPin, Plane, Calendar, Hotel, X, ChevronRight, ChevronDown, Clock, FileText, AlertCircle, Info, Download, CheckCircle2 } from 'lucide-react';
import CopyPackageButton from '@/components/collectives/CopyPackageButton';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { cn } from '@/lib/utils';
import { pkgCodeStore } from '@/lib/packageCodeStore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const SALES_READY_STATUSES = ['active', 'open_booking', 'confirmed_departure', 'ongoing'];

// Infer dp_type from saved amounts when localStorage is unavailable (e.g. different browser/origin).
const inferDpType = (c) => {
  if (!c) return 'fixed';
  if ((c.book_buy_required || 0) > 0) return 'book_buy';
  const dp = Number(c.downpayment_required) || 0;
  const sp = Number(c.selling_price) || 0;
  if (dp > 0 && sp > 0) {
    if (dp === Math.round(sp * 0.5)) return '50pct';
    if (dp === Math.round(sp * 0.3)) return '30pct';
  }
  return 'fixed';
};

export default function Sales() {
  const [collectives, setCollectives] = useState([]);
  const [marketingAssets, setMarketingAssets] = useState([]);
  const [collectivesWithTasks, setCollectivesWithTasks] = useState(new Set());
  const [salesTasks, setSalesTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pkgSearch, setPkgSearch] = useState('');
  const getDpType = (c) => c?.dp_type || (c?.id ? localStorage.getItem(`dp_type_${c.id}`) : null) || inferDpType(c);
  const [viewingProduct, setViewingProduct] = useState(null);
  const [lightboxUrl, setLightboxUrl] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null); // 'international' | 'domestic'
  const [openDestination, setOpenDestination] = useState(null);

  // ── Deep-link: pre-populate search from global search bar ─────────────────
  const location = useLocation();
  const salesNavigate = useSalesNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const searchParam = params.get('search');
    if (searchParam) {
      setPkgSearch(searchParam);
      salesNavigate('/sales', { replace: true });
    }
  }, [location.search]);

  const loadData = async () => {
    try {
      const c = await base44.entities.Collective.list();
      const safeC = Array.isArray(c) ? c : [];
      setCollectives(safeC);
      setViewingProduct(prev => prev ? (safeC.find(x => x.id === prev.id) || prev) : null);
    } catch (e) {
      console.error('Sales loadData error:', e);
    }
    try {
      const ma = await base44.entities.MarketingAsset.list('-created_date');
      setMarketingAssets(ma || []);
    } catch (e) {
      setMarketingAssets([]);
    }
    try {
      const tasks = await base44.entities.ChecklistTask.list();
      const tasksArr = Array.isArray(tasks) ? tasks : [];
      const ids = new Set(tasksArr.map(t => t.collective_id).filter(Boolean));
      setCollectivesWithTasks(ids);
      setSalesTasks(tasksArr.filter(t => t.department === 'sales'));
    } catch (e) {
      setCollectivesWithTasks(new Set());
      setSalesTasks([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    const onFocus = () => loadData();
    const onRefresh = () => loadData();
    window.addEventListener('focus', onFocus);
    window.addEventListener('gladex:refresh', onRefresh);
    return () => {
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('gladex:refresh', onRefresh);
    };
  }, []);


  return (
    <div className="space-y-5 pb-6">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold font-jakarta text-foreground">Sales</h2>
          <p className="text-sm text-muted-foreground">Package catalog · Sales checklist progress</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={loadData} className="gap-1.5 text-xs">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </Button>
        </div>
      </div>


      {/* ── PACKAGES VIEW ───────────────────────────────────────────────── */}
      {true && <>

      {/* ── Package Code Search ─────────────────────────────────────────── */}
      <div className="relative">
        <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-4 py-3 shadow-sm focus-within:ring-2 focus-within:ring-violet-500 focus-within:border-violet-500 transition-all">
          <Search className="w-4 h-4 text-violet-400 flex-shrink-0" />
          <input
            value={pkgSearch}
            onChange={e => setPkgSearch(e.target.value.replace(/[^a-zA-Z0-9\-=_]/g, ''))}
            placeholder="Search by package code (e.g. GDX-12345)..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none font-mono"
          />
          {pkgSearch && (
            <button onClick={() => setPkgSearch('')} className="text-muted-foreground hover:text-foreground transition-colors text-xs px-1">✕</button>
          )}
          <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full font-medium hidden sm:block">Package Code</span>
        </div>
      </div>

      {/* ── Category → Destination → Packages (3-level) ───────────────── */}
      {(() => {
        const salesPkgs = collectives.filter(c => SALES_READY_STATUSES.includes(c.status));

        const intlPkgs = salesPkgs.filter(p => p.travel_type === 'international');
        const domPkgs  = salesPkgs.filter(p => p.travel_type !== 'international');

        const groupByDest = (pkgs) => {
          const g = {};
          pkgs.forEach(p => { const d = p.destination?.trim() || 'Others'; if (!g[d]) g[d] = []; g[d].push(p); });
          return g;
        };
        const intlGroups = groupByDest(intlPkgs);
        const domGroups  = groupByDest(domPkgs);
        const currentGroups = selectedCategory === 'international' ? intlGroups : domGroups;

        const hoverLift = (e) => {
          e.currentTarget.style.transform = 'translateY(-5px) scale(1.015)';
          e.currentTarget.style.boxShadow = '0 20px 50px rgba(0,0,0,0.28)';
        };
        const hoverReset = (e) => {
          e.currentTarget.style.transform = '';
          e.currentTarget.style.boxShadow = '';
        };

        const PackageCard = ({ c }) => {
          const pkgAssets = marketingAssets.filter(a => a.collective_id === c.id && a.file_url);
          // Collect all poster URLs for gallery (same as Marketing page)
          const posterUrls = pkgAssets.flatMap(a => (a.file_url || '').split('\n').filter(Boolean));
          const coverUrls = c.cover_image ? [c.cover_image] : c.image_url ? [c.image_url] : [];
          const allUrls = [...new Set([...coverUrls, ...posterUrls])];
          const SHOW = 4;
          const hasPD = collectivesWithTasks.has(c.id);
          const cardDp = Number(c.downpayment_required) || 0;
          const cardDpType = getDpType(c);
          const cardDpLabel = cardDpType === '50pct' ? ' · 50% of fare' : cardDpType === '30pct' ? ' · 30% of fare' : '';
          return (
            <div
              key={c.id}
              onClick={() => setViewingProduct(c)}
              className="bg-card border border-border rounded-xl overflow-hidden hover:border-violet-500 hover:shadow-xl transition-all cursor-pointer group"
            >
              {/* ── Poster Gallery ── */}
              {allUrls.length === 0 ? (
                <div className="w-full h-[150px] bg-muted/30 flex items-center justify-center relative">
                  <Package className="w-10 h-10 text-violet-300" />
                  <div className="absolute top-2 left-2 flex flex-col gap-1">
                    {hasPD && <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-emerald-500 text-white shadow">✅ PD Ready</span>}
                  </div>
                  <span className="absolute top-2 right-2 text-[9px] px-1.5 py-0.5 rounded-full font-semibold text-white shadow" style={{background:'linear-gradient(135deg,#6d28d9,#8b5cf6)'}}>For Sale</span>
                </div>
              ) : allUrls.length === 1 ? (
                <div className="w-full min-h-[150px] max-h-[240px] bg-muted/30 flex items-center justify-center overflow-hidden relative">
                  <img src={allUrls[0]} alt={c.name} className="w-full h-auto object-contain" onError={e => e.target.style.display='none'} />
                  <div className="absolute top-2 left-2 flex flex-col gap-1">
                    {hasPD && <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-emerald-500 text-white shadow">✅ PD Ready</span>}
                  </div>
                  <span className="absolute top-2 right-2 text-[9px] px-1.5 py-0.5 rounded-full font-semibold text-white shadow" style={{background:'linear-gradient(135deg,#6d28d9,#8b5cf6)'}}>For Sale</span>
                </div>
              ) : (
                <div className={cn("grid gap-0.5 relative", allUrls.length === 2 ? "grid-cols-2" : "grid-cols-3")}>
                  {allUrls.slice(0, SHOW).map((url, i) => (
                    <div key={i} className={cn("overflow-hidden bg-muted/30",
                      allUrls.length === 2 ? "aspect-square" : i === 0 && allUrls.length === 3 ? "col-span-2 aspect-video" : "aspect-square"
                    )}>
                      <img src={url} alt={c.name} className="w-full h-full object-cover" onError={e => e.target.style.display='none'} />
                      {i === SHOW - 1 && allUrls.length > SHOW && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <span className="text-white font-bold text-xl">+{allUrls.length - SHOW}</span>
                        </div>
                      )}
                    </div>
                  ))}
                  <div className="absolute top-2 left-2 flex flex-col gap-1">
                    {hasPD && <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-emerald-500 text-white shadow">✅ PD Ready</span>}
                  </div>
                  <span className="absolute top-2 right-2 text-[9px] px-1.5 py-0.5 rounded-full font-semibold text-white shadow" style={{background:'linear-gradient(135deg,#6d28d9,#8b5cf6)'}}>For Sale</span>
                </div>
              )}
              <div className="p-3">
                <p className="text-sm font-bold text-foreground group-hover:text-violet-500 transition-colors line-clamp-2 leading-snug">{c.name}</p>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  {c.nights && <span className="flex items-center gap-0.5 text-[11px] text-muted-foreground"><Clock className="w-3 h-3" />{c.nights}N</span>}
                  {c.travel_dates?.length > 0
                    ? <span className="text-[11px] text-violet-400 font-semibold">📅 {c.travel_dates.length} dep.</span>
                    : c.departure_date && <span className="flex items-center gap-0.5 text-[11px] text-muted-foreground"><Calendar className="w-3 h-3" />{c.departure_date}</span>
                  }
                </div>
                <div className="mt-2 pt-2 border-t border-border flex items-center justify-between">
                  <div>
                    {(c.rate_twin || c.selling_price)
                      ? <p className="text-sm font-bold text-violet-500">₱{Number(c.rate_twin || c.selling_price).toLocaleString()}<span className="text-[10px] font-normal text-muted-foreground ml-1">/twin</span></p>
                      : <p className="text-xs text-muted-foreground">See pricing</p>
                    }
                    {cardDpType === 'book_buy'
                      ? <p className="text-[10px] text-rose-600 font-semibold mt-0.5">⚡ Book & Buy — Full Payment</p>
                      : cardDp > 0 && <p className="text-[10px] text-sky-600 font-semibold mt-0.5">DP: ₱{cardDp.toLocaleString()} per pax{cardDpLabel}</p>
                    }
                  </div>
                  <span className="text-[10px] text-sky-500 font-semibold flex items-center gap-0.5 group-hover:gap-1 transition-all">View <ChevronRight className="w-3 h-3" /></span>
                </div>
              </div>
            </div>
          );
        };

        // ── Destination sub-cards (level 2) ──────────────────────────────────
        const DestCard = ({ dest, pkgs, onClick, isSelected, variant }) => {
          const soonest = pkgs.flatMap(p => (p.travel_dates || []).map(d => d.departure_date).concat(p.departure_date || [])).filter(Boolean).sort()[0];
          const destBg = variant === 'domestic'
            ? 'linear-gradient(135deg, #030010 0%, #1a0733 45%, #6d28d9 80%, #a78bfa 100%)'
            : 'linear-gradient(135deg, #05010f 0%, #16064a 45%, #5b21b6 80%, #8b5cf6 100%)';
          const glowColor = variant === 'domestic' ? 'rgba(192,132,252,0.4)' : 'rgba(139,92,246,0.4)';
          return (
            <div
              className="cursor-pointer rounded-xl overflow-hidden"
              style={{
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                outline: isSelected ? '2px solid #a78bfa' : '1px solid rgba(139,92,246,0.18)',
                outlineOffset: isSelected ? '2px' : '0px',
                boxShadow: isSelected ? '0 0 20px rgba(139,92,246,0.4), 0 4px 16px rgba(0,0,0,0.5)' : '0 2px 12px rgba(0,0,0,0.4)',
              }}
              onMouseEnter={hoverLift} onMouseLeave={hoverReset}
              onClick={onClick}
            >
              <div className="relative h-32 flex flex-col justify-between p-3 overflow-hidden" style={{ background: destBg }}>
                <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse at 80% 20%, ${glowColor}, transparent 60%)` }} />
                <div className="absolute inset-0 pointer-events-none opacity-10" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                <span className="self-start text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full relative z-10"
                  style={{ background: 'rgba(167,139,250,0.2)', color: 'rgba(233,213,255,0.9)', border: '1px solid rgba(167,139,250,0.25)' }}>
                  {pkgs.length} pkg{pkgs.length !== 1 ? 's' : ''}
                </span>
                <div className="relative z-10">
                  <h4 className="text-base font-black text-white leading-tight" style={{ textShadow: '0 1px 8px rgba(139,92,246,0.5)' }}>{dest}</h4>
                  {soonest && <p className="text-[10px] text-violet-200/50 mt-0.5">{new Date(soonest + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</p>}
                </div>
                <ChevronDown className={cn("absolute top-2.5 right-2.5 w-3.5 h-3.5 text-violet-300/60 transition-transform duration-300", isSelected && "rotate-180")} />
              </div>
            </div>
          );
        };

        // ── Category stat summary ─────────────────────────────────────────────
        const catStats = (pkgs) => ({
          total: pkgs.length,
          dests: [...new Set(pkgs.map(p => p.destination?.trim() || 'Others'))].length,
          pdReady: pkgs.filter(p => collectivesWithTasks.has(p.id)).length,
          assets: marketingAssets.filter(a => pkgs.some(p => p.id === a.collective_id)).length,
        });
        const intlStats = catStats(intlPkgs);
        const domStats  = catStats(domPkgs);

        // ── Package search results (flat view when searching by pkg code) ──
        const allLocalCodes = pkgCodeStore.getAll();
        const searchQ = pkgSearch.toLowerCase().trim();
        // Search ALL collectives (not just sales-ready) so no package slips through
        const matchingPkgs = searchQ.length >= 1 ? collectives.filter(p => {
          const code = p.package_code || allLocalCodes[p.id] || '';
          return code.toLowerCase().includes(searchQ)
            || p.name?.toLowerCase().includes(searchQ)
            || p.destination?.toLowerCase().includes(searchQ);
        }) : [];

        return (
          <>
            <style>{`
              @keyframes plane-orbit { from { transform: rotate(0deg) translateX(72px) rotate(0deg); } to { transform: rotate(360deg) translateX(72px) rotate(-360deg); } }
              @keyframes plane-orbit-rev { from { transform: rotate(0deg) translateX(68px) rotate(0deg); } to { transform: rotate(-360deg) translateX(68px) rotate(360deg); } }
              .plane-cw  { animation: plane-orbit     8s linear infinite; }
              .plane-ccw { animation: plane-orbit-rev 7s linear infinite; }
            `}</style>

            {/* Package code search results */}
            {searchQ.length >= 1 && (
              <div className="space-y-3">
                {matchingPkgs.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {matchingPkgs.map(c => <PackageCard key={c.id} c={c} />)}
                  </div>
                ) : (
                  <div className="py-8 text-center text-muted-foreground text-sm">
                    <Package className="w-8 h-8 mx-auto mb-2 text-muted-foreground/30" />
                    No package found for "<strong>{pkgSearch}</strong>"
                  </div>
                )}
              </div>
            )}

            <div className={searchQ.length >= 1 ? 'hidden' : 'space-y-5'}>
              {/* ── LEVEL 1: Category cards ──────────────────────────────── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {[
                  { key: 'international', label: 'International', emoji: '🌏', stats: intlStats,
                    bg: 'linear-gradient(135deg, #05010f 0%, #16064a 30%, #4c1d95 60%, #7c3aed 85%, #a78bfa 100%)',
                    glow1: 'rgba(139,92,246,0.55)', glow2: 'rgba(167,139,250,0.35)',
                    shimmer: 'rgba(196,181,253,0.08)',
                    orbitClass: 'plane-cw', planeStyle: '✈️' },
                  { key: 'domestic', label: 'Domestic', emoji: '🇵🇭', stats: domStats,
                    bg: 'linear-gradient(135deg, #030010 0%, #1a0733 30%, #5b21b6 60%, #8b5cf6 82%, #c084fc 100%)',
                    glow1: 'rgba(192,132,252,0.5)', glow2: 'rgba(109,40,217,0.45)',
                    shimmer: 'rgba(233,213,255,0.07)',
                    orbitClass: 'plane-ccw', planeStyle: '🛩️' },
                ].map(cat => {
                  const isActive = selectedCategory === cat.key;
                  return (
                    <div
                      key={cat.key}
                      className="cursor-pointer rounded-2xl overflow-hidden"
                      style={{
                        transition: 'transform 0.18s ease, box-shadow 0.18s ease',
                        outline: isActive ? '2px solid #a78bfa' : '1px solid rgba(139,92,246,0.2)',
                        outlineOffset: isActive ? '3px' : '0px',
                        boxShadow: isActive ? '0 0 32px rgba(139,92,246,0.45), 0 8px 32px rgba(0,0,0,0.5)' : '0 4px 20px rgba(0,0,0,0.4)',
                      }}
                      onMouseEnter={hoverLift} onMouseLeave={hoverReset}
                      onClick={() => { setSelectedCategory(isActive ? null : cat.key); setOpenDestination(null); }}
                    >
                      <div className="relative h-56 flex flex-col justify-between p-6 overflow-hidden" style={{ background: cat.bg }}>
                        {/* Radiant glow orbs */}
                        <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse at 75% 15%, ${cat.glow1} 0%, transparent 50%)` }} />
                        <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse at 20% 90%, ${cat.glow2} 0%, transparent 45%)` }} />

                        {/* Shimmer diagonal streak */}
                        <div className="absolute inset-0 pointer-events-none" style={{ background: `linear-gradient(120deg, transparent 30%, ${cat.shimmer} 50%, transparent 70%)` }} />

                        {/* Subtle grid lines */}
                        <div className="absolute inset-0 pointer-events-none opacity-10" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

                        {/* Orbiting airplane */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className={cat.orbitClass} style={{ fontSize: '22px', filter: 'drop-shadow(0 2px 12px rgba(167,139,250,0.6))' }}>{cat.planeStyle}</div>
                        </div>

                        {/* Top row */}
                        <div className="flex items-start justify-between relative z-10">
                          <span className="text-3xl" style={{ filter: 'drop-shadow(0 2px 8px rgba(139,92,246,0.5))' }}>{cat.emoji}</span>
                          <div className={cn(
                            "flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold transition-all border",
                            isActive
                              ? "bg-violet-500 border-violet-400 text-white shadow-lg shadow-violet-900/60"
                              : "bg-white/10 border-white/20 text-white/80 backdrop-blur-sm"
                          )}>
                            {isActive ? 'Open' : 'View'} <ChevronDown className={cn("w-3 h-3 transition-transform duration-300", isActive && "rotate-180")} />
                          </div>
                        </div>

                        {/* Title */}
                        <div className="relative z-10">
                          <h3 className="text-2xl font-black text-white tracking-tight" style={{ textShadow: '0 2px 16px rgba(139,92,246,0.6)' }}>{cat.label}</h3>
                          <p className="text-xs text-violet-200/60 mt-0.5 font-medium tracking-widest uppercase">Packages</p>

                          {/* Stats row */}
                          <div className="flex flex-wrap gap-2 mt-3">
                            <span className="text-[11px] font-semibold text-white bg-white/10 border border-white/15 px-2.5 py-1 rounded-full backdrop-blur-sm">
                              📦 {cat.stats.total} package{cat.stats.total !== 1 ? 's' : ''}
                            </span>
                            <span className="text-[11px] font-semibold text-white bg-white/10 border border-white/15 px-2.5 py-1 rounded-full backdrop-blur-sm">
                              🗺️ {cat.stats.dests} dest.
                            </span>
                            {cat.stats.pdReady > 0 && (
                              <span className="text-[11px] font-semibold text-white bg-emerald-500/25 border border-emerald-400/30 px-2.5 py-1 rounded-full backdrop-blur-sm">
                                ✅ {cat.stats.pdReady} PD ready
                              </span>
                            )}
                            {cat.stats.assets > 0 && (
                              <span className="text-[11px] font-semibold text-white bg-violet-500/25 border border-violet-400/30 px-2.5 py-1 rounded-full backdrop-blur-sm">
                                📸 {cat.stats.assets} assets
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ── LEVEL 2: Destination cards ──────────────────────────── */}
              {selectedCategory && (
                <div className="space-y-4">
                  {/* Breadcrumb */}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <button onClick={() => { setSelectedCategory(null); setOpenDestination(null); }} className="hover:text-foreground transition-colors">Sales</button>
                    <ChevronRight className="w-3 h-3" />
                    <span className="font-semibold text-foreground capitalize">{selectedCategory}</span>
                    {openDestination && <><ChevronRight className="w-3 h-3" /><span className="font-semibold text-foreground">{openDestination}</span></>}
                  </div>

                  {Object.keys(currentGroups).length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground text-sm">No {selectedCategory} packages available yet.</div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                      {Object.keys(currentGroups).sort().map(dest => (
                        <DestCard
                          key={dest} dest={dest} pkgs={currentGroups[dest]}
                          isSelected={openDestination === dest}
                          variant={selectedCategory}
                          onClick={() => setOpenDestination(openDestination === dest ? null : dest)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── LEVEL 3: Package cards ──────────────────────────────── */}
              {openDestination && currentGroups[openDestination] && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-px flex-1 bg-border" />
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800">
                      <MapPin className="w-3 h-3" /> {openDestination}
                      <span className="font-normal text-sky-400">· {currentGroups[openDestination].length} package{currentGroups[openDestination].length !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {currentGroups[openDestination].map(c => <PackageCard key={c.id} c={c} />)}
                  </div>
                </div>
              )}
            </div>
          </>
        );
      })()}

      </> /* end packages view */}

      {/* Product Detail Modal — always mounted so it works from both views */}
      <Dialog open={!!viewingProduct} onOpenChange={open => !open && setViewingProduct(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0">
          <VisuallyHidden><DialogTitle>Package Details</DialogTitle></VisuallyHidden>
          {viewingProduct && (() => {
            const c = viewingProduct;
            const currSymbol = c.currency === 'PHP' ? '₱' : c.currency === 'USD' ? '$' : c.currency === 'JPY' ? '¥' : c.currency === 'KRW' ? '₩' : '₱';
            const fmt = v => v != null && v !== '' ? `${currSymbol}${Number(v).toLocaleString()}` : null;
            const dp = Number(c.downpayment_required) || 0;
            const detailDpType = getDpType(c);
            const dpLabel = detailDpType === '50pct' ? ' (50% of fare)' : detailDpType === '30pct' ? ' (30% of fare)' : '';
            const rates = [
              { label: 'Twin Sharing', value: fmt(c.rate_twin) },
              { label: 'Triple Sharing', value: fmt(c.rate_triple) },
              { label: 'Quad Sharing', value: fmt(c.rate_quad) },
              { label: 'Single Room', value: fmt(c.rate_single) },
              { label: 'Child (No Bed)', value: fmt(c.rate_child_no_bed) },
              { label: 'Infant', value: fmt(c.rate_infant) },
              { label: 'Single Supplement', value: fmt(c.rate_single_supplement) },
            ].filter(r => r.value);

            return (
              <>
                {/* Header */}
                <div className="relative p-6 text-white rounded-t-xl overflow-hidden" style={{background: 'linear-gradient(135deg, #05010f 0%, #16064a 30%, #4c1d95 60%, #7c3aed 85%, #a78bfa 100%)'}}>
                  <div className="absolute inset-0 pointer-events-none" style={{background: 'radial-gradient(ellipse at 80% 20%, rgba(139,92,246,0.55) 0%, transparent 50%)'}} />
                  <div className="absolute inset-0 pointer-events-none" style={{background: 'radial-gradient(ellipse at 15% 85%, rgba(167,139,250,0.3) 0%, transparent 45%)'}} />
                  <div className="absolute inset-0 pointer-events-none opacity-10" style={{backgroundImage: 'linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)', backgroundSize: '28px 28px'}} />
                  <button onClick={() => setViewingProduct(null)} className="absolute top-4 right-4 text-white/70 hover:text-white z-10">
                    <X className="w-5 h-5" />
                  </button>
                  <div className="flex items-start gap-3 relative z-10">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{background: 'rgba(167,139,250,0.2)', border: '1px solid rgba(167,139,250,0.3)'}}>
                      <Package className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-violet-200/70 uppercase tracking-wide mb-0.5">{c.travel_type === 'domestic' ? 'Domestic' : 'International'} · {c.operator_name || 'GLADEX Tours'}</p>
                      <h2 className="text-xl font-bold font-jakarta leading-tight" style={{textShadow: '0 2px 16px rgba(139,92,246,0.5)'}}>{c.name}</h2>
                      <div className="flex flex-wrap gap-3 mt-2 text-sm text-violet-200/80">
                        {c.destination && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{c.destination}</span>}
                        {c.nights && <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{c.nights} nights</span>}
                        {c.departure_date && <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{c.departure_date}{c.return_date ? ` → ${c.return_date}` : ''}</span>}
                        {c.total_slots && <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{c.total_slots} slots</span>}
                        {c.guaranteed_departure && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{background:'rgba(167,139,250,0.25)', border:'1px solid rgba(167,139,250,0.4)'}}>✈ Guaranteed Departure</span>}
                      </div>
                    </div>
                  </div>
                  {/* Book Now CTA */}
                  <CopyPackageButton
                    pkg={c}
                    className="relative z-10 bg-white/20 hover:bg-white/30 text-white border-0 gap-1.5 font-semibold backdrop-blur-sm"
                  />
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                  <Tabs defaultValue="pricing">
                    <TabsList className="w-full">
                      <TabsTrigger value="pricing" className="flex-1 text-xs">Pricing</TabsTrigger>
                      <TabsTrigger value="itinerary" className="flex-1 text-xs">Itinerary</TabsTrigger>
                      <TabsTrigger value="inclusions" className="flex-1 text-xs">Inclusions</TabsTrigger>
                      <TabsTrigger value="details" className="flex-1 text-xs">Details</TabsTrigger>
                      <TabsTrigger value="marketing" className="flex-1 text-xs">Marketing</TabsTrigger>
                    </TabsList>

                    {/* PRICING TAB */}
                    <TabsContent value="pricing" className="mt-4 space-y-4">
                      {/* Travel Dates & Slots — Radiant Purple */}
                      {c.travel_dates?.length > 0 && (
                        <div className="mb-5 rounded-2xl overflow-hidden shadow-lg" style={{border: '1.5px solid rgba(139,92,246,0.5)'}}>
                          {/* Radiant purple header */}
                          <div className="relative px-4 py-3 flex items-center gap-2 overflow-hidden" style={{background: 'linear-gradient(135deg, #05010f 0%, #16064a 30%, #4c1d95 60%, #7c3aed 85%, #a78bfa 100%)'}}>
                            <div className="absolute inset-0 pointer-events-none" style={{background: 'radial-gradient(ellipse at 80% 20%, rgba(139,92,246,0.5) 0%, transparent 55%)'}} />
                            <div className="absolute inset-0 pointer-events-none" style={{background: 'radial-gradient(ellipse at 10% 80%, rgba(167,139,250,0.3) 0%, transparent 50%)'}} />
                            <div className="absolute inset-0 pointer-events-none opacity-10" style={{backgroundImage: 'linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)', backgroundSize: '20px 20px'}} />
                            <Calendar className="w-4 h-4 text-white relative z-10 drop-shadow" />
                            <span className="text-sm font-black text-white relative z-10 tracking-wide" style={{textShadow: '0 1px 8px rgba(139,92,246,0.6)'}}>Departure Schedules</span>
                            <span className="ml-auto relative z-10 text-[10px] font-bold text-white px-2.5 py-1 rounded-full" style={{background: 'rgba(167,139,250,0.25)', border: '1px solid rgba(167,139,250,0.3)', backdropFilter: 'blur(4px)'}}>
                              {c.travel_dates.length} departure{c.travel_dates.length !== 1 ? 's' : ''}
                            </span>
                          </div>

                          {/* Rows */}
                          <div className="bg-card divide-y divide-border">
                            {c.travel_dates.map((d, i) => {
                              const slotPct = d.total_slots > 0 ? Math.min(100, ((d.booked_slots || 0) / d.total_slots) * 100) : 0;
                              const depDate = d.departure_date ? new Date(d.departure_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
                              const retDate = d.return_date ? new Date(d.return_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : null;
                              const price = d.selling_price || (d.use_custom_pricing ? d.rate_twin : null) || c.selling_price || c.rate_twin;
                              const scMap = { open: {bg:'rgba(139,92,246,0.08)',color:'#a78bfa',border:'rgba(139,92,246,0.25)'}, almost_full: {bg:'rgba(192,132,252,0.1)',color:'#c084fc',border:'rgba(192,132,252,0.3)'}, sold_out: {bg:'#fff1f2',color:'#e11d48',border:'#fecdd3'}, closed: {bg:'#f8fafc',color:'#64748b',border:'#e2e8f0'} };
                              const sc = scMap[d.status] || scMap.open;
                              const almostFull = slotPct >= 80 && d.status === 'open';
                              return (
                                <div key={i} className="px-4 py-3 transition-colors" style={{backgroundColor: 'transparent'}}
                                  onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(139,92,246,0.06)'}
                                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                                  <div className="flex items-center gap-3">
                                    {/* Numbered date icon */}
                                    <div className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center text-xs font-black text-white shadow-sm" style={{background: 'linear-gradient(135deg, #4c1d95, #7c3aed)'}}>
                                      {i + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-sm font-bold text-foreground">{d.label || depDate}</span>
                                        <span className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold border" style={{background: sc.bg, color: sc.color, borderColor: sc.border}}>
                                          {d.status === 'almost_full' ? 'Almost Full' : d.status === 'sold_out' ? 'Sold Out' : d.status === 'closed' ? 'Closed' : 'Open'}
                                        </span>
                                        {almostFull && <span className="text-[9px] font-bold animate-pulse" style={{color:'#c084fc'}}>🔥 Filling Fast</span>}
                                      </div>
                                      <p className="text-[11px] text-muted-foreground mt-0.5">
                                        🛫 {depDate}{retDate && <> → 🛬 {retDate}</>}
                                      </p>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                      <p className="text-base font-black" style={{color: '#a78bfa'}}>
                                        {price ? `₱${Number(price).toLocaleString()}` : '—'}
                                        <span className="text-[10px] font-normal text-muted-foreground">/twin</span>
                                      </p>
                                      <p className="text-[10px] font-medium text-muted-foreground">{d.booked_slots || 0}/{d.total_slots || 0} slots</p>
                                    </div>
                                  </div>
                                  {d.total_slots > 0 && (
                                    <div className="mt-2 h-1.5 rounded-full overflow-hidden ml-12" style={{background: 'rgba(139,92,246,0.12)'}}>
                                      <div className="h-full rounded-full transition-all" style={{
                                        width: `${slotPct}%`,
                                        background: slotPct >= 90 ? '#ef4444' : 'linear-gradient(90deg, #6d28d9, #a78bfa)',
                                      }} />
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      {rates.length > 0 ? (
                        <div className="grid grid-cols-2 gap-2">
                          {rates.map(r => (
                            <div key={r.label} className="rounded-lg p-3 flex justify-between items-center" style={{background:'rgba(139,92,246,0.07)', border:'1px solid rgba(139,92,246,0.18)'}}>
                              <span className="text-xs text-muted-foreground">{r.label}</span>
                              <span className="text-sm font-bold" style={{color:'#a78bfa'}}>{r.value}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No rate breakdown available.</p>
                      )}
                      {c.commission_amount && (
                        <div className="bg-sky-50 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-800 rounded-lg p-3 flex justify-between">
                          <span className="text-xs text-muted-foreground">Commission</span>
                          <span className="text-sm font-bold text-sky-700 dark:text-sky-300">{fmt(c.commission_amount)}</span>
                        </div>
                      )}
                      {detailDpType === 'book_buy' ? (
                        <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 rounded-lg p-3 flex justify-between items-center">
                          <span className="text-xs text-muted-foreground">Payment Policy</span>
                          <span className="text-sm font-bold text-rose-700 dark:text-rose-300">⚡ Book & Buy — Full Payment Required</span>
                        </div>
                      ) : dp > 0 ? (
                        <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3 flex justify-between items-center">
                          <span className="text-xs text-muted-foreground">Required Downpayment <span className="text-[10px]">per pax</span></span>
                          <span className="text-sm font-bold text-purple-700 dark:text-purple-300">₱{dp.toLocaleString()} <span className="text-[10px] font-normal text-purple-500 dark:text-purple-400">per pax{dpLabel}</span></span>
                        </div>
                      ) : null}
                    </TabsContent>

                    {/* ITINERARY TAB */}
                    <TabsContent value="itinerary" className="mt-4">
                      {c.itinerary ? (
                        <div className="text-sm text-foreground whitespace-pre-line leading-relaxed bg-muted/30 rounded-lg p-4">
                          {c.itinerary}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-8">No itinerary uploaded yet.</p>
                      )}
                    </TabsContent>

                    {/* INCLUSIONS TAB */}
                    <TabsContent value="inclusions" className="mt-4 space-y-4">
                      {c.inclusions && (
                        <div>
                          <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-2">✅ Inclusions</p>
                          <div className="text-sm text-foreground whitespace-pre-line bg-emerald-50 dark:bg-emerald-950/20 rounded-lg p-4 border border-emerald-200 dark:border-emerald-800">
                            {c.inclusions}
                          </div>
                        </div>
                      )}
                      {c.exclusions && (
                        <div>
                          <p className="text-xs font-semibold text-rose-600 uppercase tracking-wide mb-2">❌ Exclusions</p>
                          <div className="text-sm text-foreground whitespace-pre-line bg-rose-50 dark:bg-rose-950/20 rounded-lg p-4 border border-rose-200 dark:border-rose-800">
                            {c.exclusions}
                          </div>
                        </div>
                      )}
                      {c.optional_tours && (
                        <div>
                          <p className="text-xs font-semibold text-sky-700 uppercase tracking-wide mb-2">⭐ Optional Tours / Add-ons</p>
                          <div className="text-sm text-foreground whitespace-pre-line bg-sky-50 dark:bg-sky-950/20 rounded-lg p-4 border border-sky-200 dark:border-sky-800">
                            {c.optional_tours}
                          </div>
                        </div>
                      )}
                      {!c.inclusions && !c.exclusions && (
                        <p className="text-sm text-muted-foreground text-center py-8">No inclusions/exclusions listed.</p>
                      )}
                    </TabsContent>

                    {/* DETAILS TAB */}
                    <TabsContent value="details" className="mt-4 space-y-4">
                      {c.flight_details && (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 flex items-center gap-1"><Plane className="w-3.5 h-3.5" /> Flight Details</p>
                          <div className="text-sm text-foreground whitespace-pre-line bg-muted/30 rounded-lg p-3">{c.flight_details}</div>
                        </div>
                      )}
                      {c.hotel_details && (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 flex items-center gap-1"><Hotel className="w-3.5 h-3.5" /> Hotel Details</p>
                          <div className="text-sm text-foreground whitespace-pre-line bg-muted/30 rounded-lg p-3">{c.hotel_details}</div>
                        </div>
                      )}
                      {c.cancellation_policy && (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> Cancellation Policy</p>
                          <div className="text-sm text-foreground whitespace-pre-line bg-muted/30 rounded-lg p-3">{c.cancellation_policy}</div>
                        </div>
                      )}
                      {c.terms_conditions && (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 flex items-center gap-1"><FileText className="w-3.5 h-3.5" /> Terms & Conditions</p>
                          <div className="text-sm text-foreground whitespace-pre-line bg-muted/30 rounded-lg p-3">{c.terms_conditions}</div>
                        </div>
                      )}
                      {c.remarks && (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 flex items-center gap-1"><Info className="w-3.5 h-3.5" /> Remarks</p>
                          <div className="text-sm text-foreground whitespace-pre-line bg-muted/30 rounded-lg p-3">{c.remarks}</div>
                        </div>
                      )}
                      {!c.flight_details && !c.hotel_details && !c.cancellation_policy && !c.terms_conditions && (
                        <p className="text-sm text-muted-foreground text-center py-8">No additional details available.</p>
                      )}
                    </TabsContent>

                    {/* MARKETING TAB */}
                    <TabsContent value="marketing" className="mt-4">
                      {(() => {
                        const pkgAssets = marketingAssets.filter(a => a.collective_id === c.id);
                        if (pkgAssets.length === 0) return (
                          <p className="text-sm text-muted-foreground text-center py-8">No marketing assets uploaded yet.</p>
                        );
                        return (
                          <div className="space-y-4">
                            {pkgAssets.filter(a => a.file_url).length > 0 && (
                              <div>
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Visuals & Posters</p>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                  {pkgAssets.filter(a => a.file_url).flatMap(a =>
                                    (a.file_url || '').split('\n').filter(Boolean).map((url, i) => ({ ...a, _url: url, _key: `${a.id}-${i}` }))
                                  ).map(a => (
                                    <div
                                      key={a._key}
                                      className="group relative rounded-lg overflow-hidden border border-border bg-muted/30 cursor-zoom-in flex items-center justify-center min-h-[140px]"
                                      onClick={() => setLightboxUrl(a._url)}
                                    >
                                      <img src={a._url} alt={a.title} className="w-full h-auto object-contain" onError={e => e.target.style.display='none'} />
                                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-1 transition-opacity p-2">
                                        <span className="text-white text-[10px] font-semibold text-center leading-tight">{a.title}</span>
                                        <span className={cn("text-[9px] px-1.5 py-0.5 rounded-full font-medium",
                                          a.status === 'published' ? 'bg-emerald-400 text-white' :
                                          a.status === 'approved' ? 'bg-sky-400 text-white' : 'bg-slate-400 text-white'
                                        )}>{a.status?.replace('_',' ')}</span>
                                        <span className="text-white text-[9px] mt-1 opacity-80">Click to expand</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {pkgAssets.filter(a => a.caption).length > 0 && (
                              <div>
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Captions & Copy</p>
                                <div className="space-y-2">
                                  {pkgAssets.filter(a => a.caption).map(a => (
                                    <div key={a.id} className="bg-muted/40 rounded-lg p-3 border border-border">
                                      <p className="text-[10px] font-semibold text-muted-foreground mb-1">{a.title} <span className="capitalize">· {a.asset_type}</span></p>
                                      <p className="text-sm text-foreground whitespace-pre-line">{a.caption}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </TabsContent>

                  </Tabs>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* ── Sales Checklist Progress ─────────────────────────────────────── */}
      {salesTasks.length > 0 && (() => {
        const byCollective = {};
        salesTasks.forEach(t => {
          if (!t.collective_id) return;
          if (!byCollective[t.collective_id]) byCollective[t.collective_id] = [];
          byCollective[t.collective_id].push(t);
        });
        const entries = Object.entries(byCollective).map(([cid, tasks]) => {
          const collective = collectives.find(c => c.id === cid);
          const done = tasks.filter(t => t.status === 'done' || t.status === 'completed').length;
          const total = tasks.length;
          const pct = total > 0 ? Math.round((done / total) * 100) : 0;
          return { cid, collective, tasks, done, total, pct };
        }).filter(e => e.collective).sort((a, b) => a.pct - b.pct);
        if (entries.length === 0) return null;
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-4 h-4" style={{ color: '#a78bfa' }} />
              <h3 className="text-base font-bold text-foreground">Sales Checklist Progress</h3>
              <span className="text-xs text-muted-foreground px-2 py-0.5 bg-muted rounded-full">{entries.length} collective{entries.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {entries.map(({ cid, collective, tasks, done, total, pct }) => {
                const stageGroups = {};
                tasks.forEach(t => {
                  const key = t.stage_code || t.stage || 'Task';
                  if (!stageGroups[key]) stageGroups[key] = { done: 0, total: 0 };
                  stageGroups[key].total++;
                  if (t.status === 'done' || t.status === 'completed') stageGroups[key].done++;
                });
                const allDone = pct === 100;
                return (
                  <div key={cid} className="bg-card border border-border rounded-xl p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-foreground truncate">{collective.name}</p>
                        <p className="text-xs text-muted-foreground">{collective.destination || '—'}</p>
                      </div>
                      <span className="text-sm font-black flex-shrink-0" style={{ color: allDone ? '#10b981' : '#a78bfa' }}>{pct}%</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(stageGroups).map(([stage, sg]) => (
                        <span key={stage} className={cn(
                          "text-[10px] font-semibold px-2 py-0.5 rounded-full border",
                          sg.done === sg.total
                            ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                            : "bg-violet-500/10 border-violet-500/20 text-violet-600 dark:text-violet-400"
                        )}>
                          {stage} · {sg.done}/{sg.total}
                        </span>
                      ))}
                    </div>
                    <div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden mb-1.5">
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: allDone ? 'linear-gradient(90deg, #10b981, #34d399)' : 'linear-gradient(90deg, #6d28d9, #a78bfa)' }} />
                      </div>
                      <div className="flex justify-between text-[10px] text-muted-foreground">
                        <span>{done} done</span>
                        <span>{total - done} remaining</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      

      {/* Lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center p-4"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            className="absolute top-4 right-4 text-white hover:text-white/70 transition-colors z-10"
            onClick={() => setLightboxUrl(null)}
          >
            <X className="w-8 h-8" />
          </button>
          <a
            href={lightboxUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute top-4 right-16 text-white hover:text-white/70 transition-colors z-10"
            onClick={e => e.stopPropagation()}
            title="Download / Open original"
          >
            <Download className="w-6 h-6" />
          </a>
          <img
            src={lightboxUrl}
            alt="Full view"
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}