// @ts-nocheck
import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, Search, Users, RefreshCw, Edit, Package, MapPin, Plane, Calendar, Hotel, UtensilsCrossed, X, ChevronRight, ChevronDown, Clock, Star, FileText, AlertCircle, Info, Download, Globe, Navigation } from 'lucide-react';
import { broadcastRefresh } from '@/lib/dataSync';
import CopyPackageButton from '@/components/collectives/CopyPackageButton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const statusConfig = {
  inquiry: { label: 'Inquiry', class: 'bg-slate-100 text-slate-600' },
  slot_held: { label: 'Slot Held', class: 'bg-amber-100 text-amber-700' },
  confirmed: { label: 'Confirmed', class: 'bg-sky-100 text-sky-700' },
  paid: { label: 'Paid', class: 'bg-emerald-100 text-emerald-700' },
  cancelled: { label: 'Cancelled', class: 'bg-rose-100 text-rose-700' },
  completed: { label: 'Completed', class: 'bg-purple-100 text-purple-700' },
};

const visaStatusConfig = {
  not_required: 'bg-slate-100 text-slate-600',
  pending: 'bg-amber-100 text-amber-700',
  submitted: 'bg-sky-100 text-sky-700',
  approved: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-rose-100 text-rose-700',
};

const SALES_READY_STATUSES = ['active', 'open_booking', 'confirmed_departure', 'ongoing'];

export default function Sales() {
  const [bookings, setBookings] = useState([]);
  const [collectives, setCollectives] = useState([]);
  const [marketingAssets, setMarketingAssets] = useState([]);
  const [collectivesWithTasks, setCollectivesWithTasks] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [viewingProduct, setViewingProduct] = useState(null);
  const [lightboxUrl, setLightboxUrl] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null); // 'international' | 'domestic'
  const [openDestination, setOpenDestination] = useState(null);

  const loadData = async () => {
    try {
      const [b, c] = await Promise.all([
        base44.entities.Booking.list('-created_date'),
        base44.entities.Collective.list(),
      ]);
      setBookings(b);
      setCollectives(c);
      // Keep viewingProduct in sync with fresh data
      setViewingProduct(prev => prev ? (c.find(x => x.id === prev.id) || prev) : null);
    } catch (e) {
      console.error('Sales loadData error:', e);
    }
    // Load marketing assets separately so it never blocks the main data
    try {
      const ma = await base44.entities.MarketingAsset.list('-created_date');
      setMarketingAssets(ma || []);
    } catch (e) {
      console.error('MarketingAsset load error:', e);
      setMarketingAssets([]);
    }
    // Load tasks to know which packages have a real workflow
    try {
      const tasks = await base44.entities.ChecklistTask.list();
      const ids = new Set(tasks.map(t => t.collective_id).filter(Boolean));
      setCollectivesWithTasks(ids);
    } catch (e) {
      setCollectivesWithTasks(new Set());
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

  const openAdd = () => {
    setEditingBooking(null);
    setFormData({ status: 'inquiry', source: 'direct', visa_status: 'not_required', pax_count: 1 });
    setFormError('');
    setShowModal(true);
  };

  const openEdit = (b) => {
    setEditingBooking(b);
    setFormData({ ...b });
    setFormError('');
    setShowModal(true);
  };

  const handleSave = async () => {
    setFormError('');
    const selectedCollective = collectives.find(c => c.id === formData.collective_id);
    if (!selectedCollective) {
      setFormError('Please select a collective.');
      return;
    }
    if (!SALES_READY_STATUSES.includes(selectedCollective.status)) {
      setFormError('This package is not yet ready for Sales. Product Development must complete their workflow first.');
      return;
    }
    setSaving(true);
    if (editingBooking) {
      await base44.entities.Booking.update(editingBooking.id, formData);
    } else {
      await base44.entities.Booking.create(formData);
    }
    setSaving(false);
    setShowModal(false);
    loadData();
    broadcastRefresh();
  };

  const filtered = bookings.filter(b => {
    const matchSearch = !search || b.client_name?.toLowerCase().includes(search.toLowerCase()) || b.booking_reference?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || b.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const getCollectiveName = (id) => collectives.find(c => c.id === id)?.name || '—';
  const formatCurrency = (val) => val ? `₱${Number(val).toLocaleString()}` : '—';

  const summaryStats = [
    { label: 'Total Bookings', value: bookings.length, color: 'text-foreground' },
    { label: 'Confirmed', value: bookings.filter(b => b.status === 'confirmed').length, color: 'text-sky-600' },
    { label: 'Paid', value: bookings.filter(b => b.status === 'paid').length, color: 'text-emerald-600' },
    { label: 'Pending Payment', value: bookings.filter(b => !b.full_payment_paid && b.status !== 'cancelled').length, color: 'text-amber-600' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-jakarta text-foreground">Sales & Reservations</h2>
          <p className="text-sm text-muted-foreground">Manage all bookings and client reservations</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadData} className="gap-1.5 text-xs">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </Button>
          <Button onClick={openAdd} className="gradient-gold text-white border-0 gap-2">
            <Plus className="w-4 h-4" /> New Booking
          </Button>
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

        const tilt = (e) => {
          const card = e.currentTarget;
          const r = card.getBoundingClientRect();
          const x = e.clientX - r.left, y = e.clientY - r.top;
          const cx = r.width / 2, cy = r.height / 2;
          const rx = (cy - y) / 10, ry = (x - cx) / 10;
          card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(14px) scale(1.03)`;
          card.style.boxShadow = `${ry * 2.5}px ${-rx * 2.5}px 45px rgba(0,0,0,0.4)`;
        };
        const untilt = (e) => {
          const card = e.currentTarget;
          card.style.transform = 'perspective(900px) rotateX(0) rotateY(0) translateZ(0) scale(1)';
          card.style.boxShadow = '';
        };

        const PackageCard = ({ c }) => {
          const pkgAssets = marketingAssets.filter(a => a.collective_id === c.id && a.file_url);
          const heroImage = c.cover_image || c.image_url ||
            pkgAssets.find(a => a.status === 'published')?.file_url ||
            pkgAssets.find(a => a.status === 'approved')?.file_url ||
            pkgAssets[0]?.file_url || null;
          const totalAssets = marketingAssets.filter(a => a.collective_id === c.id).length;
          const hasPD = collectivesWithTasks.has(c.id);
          return (
            <div
              key={c.id}
              onClick={() => setViewingProduct(c)}
              className="bg-card border border-border rounded-xl overflow-hidden hover:border-violet-400 hover:shadow-xl transition-all cursor-pointer group"
            >
              <div className="w-full min-h-[150px] max-h-[220px] bg-muted/30 flex items-center justify-center overflow-hidden relative">
                {heroImage
                  ? <img src={heroImage} alt={c.name} className="w-full h-auto object-contain" onError={e => e.target.style.display='none'} />
                  : <Package className="w-10 h-10 text-violet-300" />
                }
                {/* PD + Marketing badges */}
                <div className="absolute top-2 left-2 flex flex-col gap-1">
                  {hasPD && <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-emerald-500 text-white shadow">✅ PD Ready</span>}
                  {totalAssets > 0 && <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-sky-500 text-white shadow">📸 {totalAssets} asset{totalAssets !== 1 ? 's' : ''}</span>}
                </div>
                <span className="absolute top-2 right-2 text-[9px] px-1.5 py-0.5 rounded-full font-semibold bg-orange-500 text-white shadow">For Sale</span>
              </div>
              <div className="p-3">
                <p className="text-sm font-bold text-foreground group-hover:text-violet-600 transition-colors line-clamp-2 leading-snug">{c.name}</p>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  {c.nights && <span className="flex items-center gap-0.5 text-[11px] text-muted-foreground"><Clock className="w-3 h-3" />{c.nights}N</span>}
                  {c.travel_dates?.length > 0
                    ? <span className="text-[11px] text-orange-500 font-semibold">📅 {c.travel_dates.length} dep.</span>
                    : c.departure_date && <span className="flex items-center gap-0.5 text-[11px] text-muted-foreground"><Calendar className="w-3 h-3" />{c.departure_date}</span>
                  }
                </div>
                <div className="mt-2 pt-2 border-t border-border flex items-center justify-between">
                  {(c.rate_twin || c.selling_price)
                    ? <p className="text-sm font-bold text-orange-600">₱{Number(c.rate_twin || c.selling_price).toLocaleString()}<span className="text-[10px] font-normal text-muted-foreground ml-1">/twin</span></p>
                    : <p className="text-xs text-muted-foreground">See pricing</p>
                  }
                  <span className="text-[10px] text-violet-500 font-semibold flex items-center gap-0.5 group-hover:gap-1 transition-all">View <ChevronRight className="w-3 h-3" /></span>
                </div>
              </div>
            </div>
          );
        };

        // ── Destination sub-cards (level 2) ──────────────────────────────────
        const DestCard = ({ dest, pkgs, onClick, isSelected }) => {
          const soonest = pkgs.flatMap(p => (p.travel_dates || []).map(d => d.departure_date).concat(p.departure_date || [])).filter(Boolean).sort()[0];
          return (
            <div
              className="cursor-pointer rounded-xl overflow-hidden"
              style={{ transition: 'transform 0.15s ease, box-shadow 0.15s ease', outline: isSelected ? '2.5px solid #f97316' : 'none', outlineOffset: '2px' }}
              onMouseMove={tilt} onMouseLeave={untilt}
              onClick={onClick}
            >
              <div className="relative h-32 flex flex-col justify-between p-3 overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #3b0764 0%, #6d28d9 50%, #7c3aed 100%)' }}>
                <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 75% 25%, rgba(255,255,255,0.15), transparent 60%)' }} />
                <span className="self-start text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full relative z-10"
                  style={{ background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.9)' }}>
                  {pkgs.length} pkg{pkgs.length !== 1 ? 's' : ''}
                </span>
                <div className="relative z-10">
                  <h4 className="text-base font-black text-white leading-tight">{dest}</h4>
                  {soonest && <p className="text-[10px] text-white/50 mt-0.5">{new Date(soonest + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</p>}
                </div>
                <ChevronDown className={cn("absolute top-2.5 right-2.5 w-3.5 h-3.5 text-white/60 transition-transform duration-300", isSelected && "rotate-180")} />
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

        return (
          <>
            <style>{`
              @keyframes plane-orbit { from { transform: rotate(0deg) translateX(72px) rotate(0deg); } to { transform: rotate(360deg) translateX(72px) rotate(-360deg); } }
              @keyframes plane-orbit-rev { from { transform: rotate(0deg) translateX(68px) rotate(0deg); } to { transform: rotate(-360deg) translateX(68px) rotate(360deg); } }
              .plane-cw  { animation: plane-orbit     8s linear infinite; }
              .plane-ccw { animation: plane-orbit-rev 7s linear infinite; }
            `}</style>

            <div className="space-y-5">
              {/* ── LEVEL 1: Category cards ──────────────────────────────── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {[
                  { key: 'international', label: 'International', emoji: '🌏', stats: intlStats,
                    bg: 'linear-gradient(135deg, #1e0a3c 0%, #4c1d95 35%, #6d28d9 65%, #7c3aed 100%)',
                    glow: 'rgba(139,92,246,0.5)', orbitClass: 'plane-cw', planeStyle: '✈️' },
                  { key: 'domestic', label: 'Domestic', emoji: '🇵🇭', stats: domStats,
                    bg: 'linear-gradient(135deg, #200e3a 0%, #5b21b6 35%, #7c3aed 65%, #a855f7 100%)',
                    glow: 'rgba(168,85,247,0.5)', orbitClass: 'plane-ccw', planeStyle: '🛩️' },
                ].map(cat => {
                  const isActive = selectedCategory === cat.key;
                  return (
                    <div
                      key={cat.key}
                      className="cursor-pointer rounded-2xl overflow-hidden"
                      style={{ transition: 'transform 0.15s ease, box-shadow 0.15s ease', outline: isActive ? '3px solid #f97316' : 'none', outlineOffset: '3px' }}
                      onMouseMove={tilt} onMouseLeave={untilt}
                      onClick={() => { setSelectedCategory(isActive ? null : cat.key); setOpenDestination(null); }}
                    >
                      <div className="relative h-56 flex flex-col justify-between p-6 overflow-hidden" style={{ background: cat.bg }}>
                        {/* Glow orbs */}
                        <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse at 80% 20%, ${cat.glow} 0%, transparent 55%)` }} />
                        <div className="absolute -bottom-10 -left-10 w-44 h-44 rounded-full pointer-events-none" style={{ background: 'rgba(0,0,0,0.2)', filter: 'blur(30px)' }} />

                        {/* Orbiting airplane */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className={cat.orbitClass} style={{ fontSize: '22px', filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.4))' }}>{cat.planeStyle}</div>
                        </div>

                        {/* Top row */}
                        <div className="flex items-start justify-between relative z-10">
                          <span className="text-3xl">{cat.emoji}</span>
                          <div className={cn("flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all", isActive ? "bg-orange-500 text-white" : "bg-white/15 text-white/80")}>
                            {isActive ? 'Open' : 'View'} <ChevronDown className={cn("w-3 h-3 transition-transform duration-300", isActive && "rotate-180")} />
                          </div>
                        </div>

                        {/* Title */}
                        <div className="relative z-10">
                          <h3 className="text-2xl font-black text-white tracking-tight drop-shadow">{cat.label}</h3>
                          <p className="text-sm text-white/60 mt-0.5">Packages</p>

                          {/* Stats row */}
                          <div className="flex flex-wrap gap-2 mt-3">
                            <span className="text-[11px] font-semibold text-white bg-white/15 px-2.5 py-1 rounded-full backdrop-blur-sm">
                              📦 {cat.stats.total} package{cat.stats.total !== 1 ? 's' : ''}
                            </span>
                            <span className="text-[11px] font-semibold text-white bg-white/15 px-2.5 py-1 rounded-full backdrop-blur-sm">
                              🗺️ {cat.stats.dests} dest.
                            </span>
                            {cat.stats.pdReady > 0 && (
                              <span className="text-[11px] font-semibold text-white bg-emerald-500/30 px-2.5 py-1 rounded-full backdrop-blur-sm">
                                ✅ {cat.stats.pdReady} PD ready
                              </span>
                            )}
                            {cat.stats.assets > 0 && (
                              <span className="text-[11px] font-semibold text-white bg-sky-500/30 px-2.5 py-1 rounded-full backdrop-blur-sm">
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
                          onClick={() => setOpenDestination(openDestination === dest ? null : dest)}
                        />
                      ))}
                      {/* Manual booking card */}
                      <div
                        className="cursor-pointer rounded-xl border-2 border-dashed border-border h-32 flex flex-col items-center justify-center gap-1.5 hover:border-violet-400 hover:bg-violet-50/50 dark:hover:bg-violet-950/10 transition-all group"
                        style={{ transition: 'transform 0.15s ease, box-shadow 0.15s ease' }}
                        onMouseMove={tilt} onMouseLeave={untilt}
                        onClick={openAdd}
                      >
                        <div className="w-9 h-9 rounded-xl bg-muted group-hover:bg-violet-100 dark:group-hover:bg-violet-950/30 flex items-center justify-center transition-colors">
                          <Plus className="w-4 h-4 text-muted-foreground group-hover:text-violet-500 transition-colors" />
                        </div>
                        <span className="text-[11px] font-semibold text-muted-foreground group-hover:text-violet-600 transition-colors">New Booking</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── LEVEL 3: Package cards ──────────────────────────────── */}
              {openDestination && currentGroups[openDestination] && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-px flex-1 bg-border" />
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-violet-700 bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800">
                      <MapPin className="w-3 h-3" /> {openDestination}
                      <span className="font-normal text-violet-400">· {currentGroups[openDestination].length} package{currentGroups[openDestination].length !== 1 ? 's' : ''}</span>
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

      {/* Product Detail Modal */}
      <Dialog open={!!viewingProduct} onOpenChange={open => !open && setViewingProduct(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0">
          {viewingProduct && (() => {
            const c = viewingProduct;
            const currSymbol = c.currency === 'PHP' ? '₱' : c.currency === 'USD' ? '$' : c.currency === 'JPY' ? '¥' : c.currency === 'KRW' ? '₩' : '₱';
            const fmt = v => v != null && v !== '' ? `${currSymbol}${Number(v).toLocaleString()}` : null;
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
                <div className="relative p-6 text-white rounded-t-xl overflow-hidden" style={{background: 'linear-gradient(135deg, #c2410c 0%, #ea580c 30%, #f97316 65%, #fbbf24 100%)'}}>
                  <div className="absolute inset-0 animate-pulse" style={{background: 'linear-gradient(90deg, transparent 20%, rgba(255,255,255,0.08) 50%, transparent 80%)'}} />
                  <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full" style={{background: 'radial-gradient(circle, rgba(253,230,138,0.35) 0%, transparent 70%)'}} />
                  <button onClick={() => setViewingProduct(null)} className="absolute top-4 right-4 text-white/70 hover:text-white z-10">
                    <X className="w-5 h-5" />
                  </button>
                  <div className="flex items-start gap-3 relative z-10">
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                      <Package className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-orange-100 uppercase tracking-wide mb-0.5">{c.travel_type === 'domestic' ? 'Domestic' : 'International'} · {c.operator_name || 'GLADEX Tours'}</p>
                      <h2 className="text-xl font-bold font-jakarta leading-tight">{c.name}</h2>
                      <div className="flex flex-wrap gap-3 mt-2 text-sm text-orange-100">
                        {c.destination && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{c.destination}</span>}
                        {c.nights && <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{c.nights} nights</span>}
                        {c.departure_date && <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{c.departure_date}{c.return_date ? ` → ${c.return_date}` : ''}</span>}
                        {c.total_slots && <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{c.total_slots} slots</span>}
                        {c.guaranteed_departure && <span className="bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">✈ Guaranteed Departure</span>}
                      </div>
                    </div>
                  </div>
                  {/* Book Now CTA */}
                  <Button
                    className="mt-4 relative z-10 bg-white font-semibold gap-2 border-0 hover:bg-orange-50" style={{color: '#ea580c'}}
                    onClick={() => {
                      setViewingProduct(null);
                      setEditingBooking(null);
                      setFormData({ status: 'inquiry', source: 'direct', visa_status: 'not_required', pax_count: 1, collective_id: c.id });
                      setFormError('');
                      setShowModal(true);
                    }}
                  >
                    <Plus className="w-4 h-4" /> Book This Package
                  </Button>
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
                      {/* Travel Dates & Slots — Radiant Orange */}
                      {c.travel_dates?.length > 0 && (
                        <div className="mb-5 rounded-2xl overflow-hidden shadow-lg" style={{border: '1.5px solid #fb923c'}}>
                          {/* Radiant orange header with shimmer animation */}
                          <div className="relative px-4 py-3 flex items-center gap-2 overflow-hidden" style={{background: 'linear-gradient(135deg, #c2410c 0%, #ea580c 30%, #f97316 60%, #fb923c 80%, #fbbf24 100%)'}}>
                            <div className="absolute inset-0 animate-pulse" style={{background: 'linear-gradient(90deg, transparent 20%, rgba(255,255,255,0.15) 50%, transparent 80%)'}} />
                            <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full animate-pulse" style={{background: 'radial-gradient(circle, rgba(253,230,138,0.5) 0%, transparent 70%)'}} />
                            <div className="absolute -bottom-4 left-8 w-16 h-16 rounded-full animate-pulse" style={{background: 'radial-gradient(circle, rgba(251,191,36,0.3) 0%, transparent 70%)', animationDelay: '1s'}} />
                            <Calendar className="w-4 h-4 text-white relative z-10 drop-shadow" />
                            <span className="text-sm font-black text-white relative z-10 tracking-wide" style={{textShadow: '0 1px 4px rgba(0,0,0,0.2)'}}>Departure Schedules</span>
                            <span className="ml-auto relative z-10 text-[10px] font-bold text-white px-2.5 py-1 rounded-full" style={{background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(4px)'}}>
                              {c.travel_dates.length} departure{c.travel_dates.length !== 1 ? 's' : ''}
                            </span>
                          </div>

                          {/* White rows */}
                          <div className="bg-white divide-y" style={{borderColor: '#fff7ed'}}>
                            {c.travel_dates.map((d, i) => {
                              const slotPct = d.total_slots > 0 ? Math.min(100, ((d.booked_slots || 0) / d.total_slots) * 100) : 0;
                              const depDate = d.departure_date ? new Date(d.departure_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
                              const retDate = d.return_date ? new Date(d.return_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : null;
                              const price = d.selling_price || (d.use_custom_pricing ? d.rate_twin : null) || c.selling_price || c.rate_twin;
                              const scMap = { open: {bg:'#fff7ed',color:'#ea580c',border:'#fdba74'}, almost_full: {bg:'#fff7ed',color:'#c2410c',border:'#fb923c'}, sold_out: {bg:'#fff1f2',color:'#e11d48',border:'#fecdd3'}, closed: {bg:'#f8fafc',color:'#64748b',border:'#e2e8f0'} };
                              const sc = scMap[d.status] || scMap.open;
                              const almostFull = slotPct >= 80 && d.status === 'open';
                              return (
                                <div key={i} className="px-4 py-3 transition-colors" style={{backgroundColor: 'white'}}
                                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fff7ed'}
                                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'white'}>
                                  <div className="flex items-center gap-3">
                                    {/* Numbered date icon */}
                                    <div className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center text-xs font-black text-white shadow-sm" style={{background: 'linear-gradient(135deg, #f97316, #fbbf24)'}}>
                                      {i + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-sm font-bold text-gray-900">{d.label || depDate}</span>
                                        <span className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold border" style={{background: sc.bg, color: sc.color, borderColor: sc.border}}>
                                          {d.status === 'almost_full' ? 'Almost Full' : d.status === 'sold_out' ? 'Sold Out' : d.status === 'closed' ? 'Closed' : 'Open'}
                                        </span>
                                        {almostFull && <span className="text-[9px] font-bold animate-pulse" style={{color:'#ea580c'}}>🔥 Filling Fast</span>}
                                      </div>
                                      <p className="text-[11px] text-gray-400 mt-0.5">
                                        🛫 {depDate}{retDate && <> → 🛬 {retDate}</>}
                                      </p>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                      <p className="text-base font-black" style={{color: '#ea580c'}}>
                                        {price ? `₱${Number(price).toLocaleString()}` : '—'}
                                        <span className="text-[10px] font-normal text-gray-400">/twin</span>
                                      </p>
                                      <p className="text-[10px] font-medium text-gray-400">{d.booked_slots || 0}/{d.total_slots || 0} slots</p>
                                    </div>
                                  </div>
                                  {d.total_slots > 0 && (
                                    <div className="mt-2 h-1.5 rounded-full overflow-hidden ml-12" style={{background: '#fff7ed'}}>
                                      <div className="h-full rounded-full transition-all" style={{
                                        width: `${slotPct}%`,
                                        background: slotPct >= 90 ? '#ef4444' : 'linear-gradient(90deg, #f97316, #fbbf24)',
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
                            <div key={r.label} className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 flex justify-between items-center">
                              <span className="text-xs text-muted-foreground">{r.label}</span>
                              <span className="text-sm font-bold text-amber-700">{r.value}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No rate breakdown available.</p>
                      )}
                      {c.commission_amount && (
                        <div className="bg-sky-50 dark:bg-sky-950/20 border border-sky-200 rounded-lg p-3 flex justify-between">
                          <span className="text-xs text-muted-foreground">Commission</span>
                          <span className="text-sm font-bold text-sky-700">{fmt(c.commission_amount)}</span>
                        </div>
                      )}
                      {c.downpayment_required && (
                        <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 rounded-lg p-3 flex justify-between">
                          <span className="text-xs text-muted-foreground">Required Downpayment</span>
                          <span className="text-sm font-bold text-purple-700">{fmt(c.downpayment_required)}</span>
                        </div>
                      )}
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
                          <div className="text-sm text-foreground whitespace-pre-line bg-emerald-50 dark:bg-emerald-950/20 rounded-lg p-4 border border-emerald-200">
                            {c.inclusions}
                          </div>
                        </div>
                      )}
                      {c.exclusions && (
                        <div>
                          <p className="text-xs font-semibold text-rose-600 uppercase tracking-wide mb-2">❌ Exclusions</p>
                          <div className="text-sm text-foreground whitespace-pre-line bg-rose-50 dark:bg-rose-950/20 rounded-lg p-4 border border-rose-200">
                            {c.exclusions}
                          </div>
                        </div>
                      )}
                      {c.optional_tours && (
                        <div>
                          <p className="text-xs font-semibold text-sky-700 uppercase tracking-wide mb-2">⭐ Optional Tours / Add-ons</p>
                          <div className="text-sm text-foreground whitespace-pre-line bg-sky-50 dark:bg-sky-950/20 rounded-lg p-4 border border-sky-200">
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
                                  {pkgAssets.filter(a => a.file_url).map(a => (
                                    <div
                                      key={a.id}
                                      className="group relative rounded-lg overflow-hidden border border-border bg-muted/30 cursor-zoom-in flex items-center justify-center min-h-[140px]"
                                      onClick={() => setLightboxUrl(a.file_url)}
                                    >
                                      <img src={a.file_url} alt={a.title} className="w-full h-auto object-contain" onError={e => e.target.style.display='none'} />
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

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {summaryStats.map((s, i) => (
          <div key={i} className="bg-card rounded-xl border border-border p-4">
            <p className={cn("text-2xl font-bold font-jakarta", s.color)}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by client name or reference..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {Object.entries(statusConfig).map(([val, cfg]) => (
              <SelectItem key={val} value={val}>{cfg.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3,4,5].map(i => <div key={i} className="h-16 bg-card rounded-lg border animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold text-foreground mb-2">No bookings found</h3>
          <Button onClick={openAdd} className="gradient-gold text-white border-0">
            <Plus className="w-4 h-4 mr-2" /> Add First Booking
          </Button>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Client</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3 hidden sm:table-cell">Collective</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3 hidden sm:table-cell">Pax</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Amount</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Status</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3 hidden md:table-cell">Visa</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3 hidden md:table-cell">Payment</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map(b => (
                  <tr key={b.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-foreground">{b.client_name}</p>
                        <p className="text-xs text-muted-foreground">{b.client_email || b.booking_reference}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <p className="text-sm text-foreground truncate max-w-[150px]">{getCollectiveName(b.collective_id)}</p>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="text-sm text-foreground">{b.pax_count || 1}</span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-foreground">{formatCurrency(b.total_amount)}</p>
                      {b.balance > 0 && <p className="text-xs text-rose-500">Bal: {formatCurrency(b.balance)}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={cn("text-[10px]", statusConfig[b.status]?.class)}>
                        {statusConfig[b.status]?.label}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <Badge className={cn("text-[10px] capitalize", visaStatusConfig[b.visa_status])}>
                        {b.visa_status?.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="flex items-center gap-2 text-xs">
                        <span className={cn("w-2 h-2 rounded-full", b.downpayment_paid ? 'bg-emerald-500' : 'bg-slate-300')} title={b.downpayment_paid ? 'DP Paid' : 'DP Pending'} />
                        <span className={cn("w-2 h-2 rounded-full", b.full_payment_paid ? 'bg-emerald-500' : 'bg-slate-300')} title={b.full_payment_paid ? 'Full Paid' : 'Balance Pending'} />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => openEdit(b)}>
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Booking Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-jakarta">{editingBooking ? 'Edit Booking' : 'New Booking'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="md:col-span-2 space-y-1.5">
              <Label>Collective * <span className="text-xs font-normal text-muted-foreground">(Active or Open Booking packages only — PD workflow must be completed)</span></Label>
              <Select value={formData.collective_id} onValueChange={v => setFormData({...formData, collective_id: v})}>
                <SelectTrigger><SelectValue placeholder="Select collective" /></SelectTrigger>
                <SelectContent>
                  {collectives.filter(c => SALES_READY_STATUSES.includes(c.status) && collectivesWithTasks.has(c.id) || (editingBooking && c.id === editingBooking.collective_id)).length === 0 ? (
                    <SelectItem value="_none" disabled>No active packages available</SelectItem>
                  ) : (
                    collectives.filter(c => SALES_READY_STATUSES.includes(c.status) && collectivesWithTasks.has(c.id) || (editingBooking && c.id === editingBooking.collective_id)).map(c => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name} {!SALES_READY_STATUSES.includes(c.status) && collectivesWithTasks.has(c.id) && <span className="text-xs text-muted-foreground ml-1">({c.status})</span>}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            {/* Departure date select — show travel_dates when available */}
            {(() => {
              const sel = collectives.find(c => c.id === formData.collective_id);
              const dates = sel?.travel_dates?.filter(d => d.departure_date) || [];
              if (dates.length === 0) return null;
              return (
                <div className="space-y-1.5">
                  <Label>Departure Date *</Label>
                  <Select value={formData.departure_date_option || ''} onValueChange={v => setFormData({...formData, departure_date_option: v})}>
                    <SelectTrigger><SelectValue placeholder="Select departure date" /></SelectTrigger>
                    <SelectContent>
                      {dates.map((d, i) => {
                        const depLabel = d.label || (d.departure_date ? new Date(d.departure_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : `Date ${i+1}`);
                        const retLabel = d.return_date ? ` → ${new Date(d.return_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}` : '';
                        const slots = d.total_slots > 0 ? ` · ${(d.total_slots - (d.booked_slots||0))} slots left` : '';
                        return <SelectItem key={i} value={d.departure_date}>{depLabel}{retLabel}{slots}</SelectItem>;
                      })}
                    </SelectContent>
                  </Select>
                </div>
              );
            })()}
            <div className="space-y-1.5">
              <Label>Client Name *</Label>
              <Input value={formData.client_name || ''} onChange={e => setFormData({...formData, client_name: e.target.value})} />
            </div>
            <div className="space-y-1.5">
              <Label>Client Email</Label>
              <Input type="email" value={formData.client_email || ''} onChange={e => setFormData({...formData, client_email: e.target.value})} />
            </div>
            <div className="space-y-1.5">
              <Label>Client Phone</Label>
              <Input value={formData.client_phone || ''} onChange={e => setFormData({...formData, client_phone: e.target.value})} />
            </div>
            <div className="space-y-1.5">
              <Label>Pax Count</Label>
              <Input type="number" min="1" value={formData.pax_count || 1} onChange={e => setFormData({...formData, pax_count: Number(e.target.value)})} />
            </div>
            <div className="space-y-1.5">
              <Label>Booking Status</Label>
              <Select value={formData.status} onValueChange={v => setFormData({...formData, status: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(statusConfig).map(([val, cfg]) => <SelectItem key={val} value={val}>{cfg.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Source</Label>
              <Select value={formData.source} onValueChange={v => setFormData({...formData, source: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="direct">Direct</SelectItem>
                  <SelectItem value="sub_agent">Sub-Agent</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="referral">Referral</SelectItem>
                  <SelectItem value="walk_in">Walk-In</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Total Amount (₱)</Label>
              <Input type="number" value={formData.total_amount || ''} onChange={e => setFormData({...formData, total_amount: Number(e.target.value)})} />
            </div>
            <div className="space-y-1.5">
              <Label>Downpayment (₱)</Label>
              <Input type="number" value={formData.downpayment_amount || ''} onChange={e => setFormData({...formData, downpayment_amount: Number(e.target.value)})} />
            </div>
            <div className="space-y-1.5">
              <Label>DP Paid?</Label>
              <Select value={formData.downpayment_paid ? 'yes' : 'no'} onValueChange={v => setFormData({...formData, downpayment_paid: v === 'yes'})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="no">No</SelectItem>
                  <SelectItem value="yes">Yes</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Full Payment Due</Label>
              <Input type="date" value={formData.full_payment_due || ''} onChange={e => setFormData({...formData, full_payment_due: e.target.value})} />
            </div>
            <div className="space-y-1.5">
              <Label>Full Payment Paid?</Label>
              <Select value={formData.full_payment_paid ? 'yes' : 'no'} onValueChange={v => setFormData({...formData, full_payment_paid: v === 'yes'})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="no">No</SelectItem>
                  <SelectItem value="yes">Yes</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Visa Status</Label>
              <Select value={formData.visa_status} onValueChange={v => setFormData({...formData, visa_status: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="not_required">Not Required</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Assigned Agent</Label>
              <Input value={formData.assigned_agent || ''} onChange={e => setFormData({...formData, assigned_agent: e.target.value})} />
            </div>
            <div className="md:col-span-2 space-y-1.5">
              <Label>Remarks</Label>
              <Textarea rows={2} value={formData.remarks || ''} onChange={e => setFormData({...formData, remarks: e.target.value})} />
            </div>
          </div>
          {formError && (
            <p className="text-sm text-rose-500 bg-rose-50 dark:bg-rose-950/20 px-3 py-2 rounded-lg mt-4">{formError}</p>
          )}
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="gradient-gold text-white border-0">
              {saving ? 'Saving...' : editingBooking ? 'Save Changes' : 'Create Booking'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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