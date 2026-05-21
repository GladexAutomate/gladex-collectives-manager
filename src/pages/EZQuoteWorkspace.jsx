import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import {
  Plus, Search, Save, RefreshCw, CheckCircle, ArrowRight,
  Calculator, FileText, Plane, Hotel, DollarSign, Info,
  Package, Zap, Trash2, MoreVertical, Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import SmartImportSidebar, { generateRefCode } from '@/components/product/SmartImportSidebar';

// ─── Constants ────────────────────────────────────────────────────────────────

const CURRENCIES = [
  { value: 'PHP', symbol: '₱', label: 'PHP' },
  { value: 'USD', symbol: '$', label: 'USD' },
  { value: 'EUR', symbol: '€', label: 'EUR' },
  { value: 'JPY', symbol: '¥', label: 'JPY' },
  { value: 'KRW', symbol: '₩', label: 'KRW' },
  { value: 'SGD', symbol: 'S$', label: 'SGD' },
  { value: 'HKD', symbol: 'HK$', label: 'HKD' },
  { value: 'AUD', symbol: 'A$', label: 'AUD' },
];

const HOTEL_CATEGORIES = [
  { value: 'budget', label: '🏨 Budget' },
  { value: 'standard', label: '🏨 Standard' },
  { value: 'deluxe', label: '🏨 Deluxe' },
  { value: '4star', label: '⭐ 4-Star' },
  { value: '5star', label: '⭐ 5-Star' },
  { value: 'luxury', label: '👑 Luxury' },
];

const STATUS_CONFIG = {
  draft:               { label: 'Draft',         class: 'bg-slate-100 text-slate-600' },
  for_approval:        { label: 'For Approval',  class: 'bg-purple-100 text-purple-700' },
  product_development: { label: 'In Dev',        class: 'bg-amber-100 text-amber-700' },
  marketing_prep:      { label: 'Mktg Prep',     class: 'bg-pink-100 text-pink-700' },
  active:              { label: 'Active',         class: 'bg-emerald-100 text-emerald-700' },
  launched:            { label: 'Launched',       class: 'bg-sky-100 text-sky-700' },
  open_booking:        { label: 'Open Booking',  class: 'bg-teal-100 text-teal-700' },
  completed:           { label: 'Completed',      class: 'bg-purple-100 text-purple-700' },
  cancelled:           { label: 'Cancelled',      class: 'bg-rose-100 text-rose-700' },
};

const BLANK_HOTEL = () => ({
  id: Date.now() + Math.random(),
  category: 'standard', hotel_name: '', location: '',
  twin: '', triple: '', quad: '', solo: '',
  child_no_bed: '', child_bed: '', infant: '',
});

const BLANK_QUOTE = () => ({
  package_name: '', destination: '', travel_type: 'international',
  operator_name: '', departure_date: '', return_date: '', nights: '',
  pax_estimate: 20, guaranteed_departure_pax: 0,
  currency: 'USD', exchange_rate: 57, base_cost_foreign: '',
  markup_php: 0, markup_pct: 0, use_markup_pct: false,
  commission_per_pax: 0, downpayment_required: 0,
  inclusions: '', exclusions: '', cancellation_policy: '',
  optional_tours: '', flight_details: '', remarks: '',
  hotel_rows: [BLANK_HOTEL()],
  status: 'draft',
});

// ─── Sidebar Package Row ──────────────────────────────────────────────────────

function PackageListItem({ collective, isSelected, onSelect, onDelete }) {
  const [showMenu, setShowMenu] = useState(false);
  const price = collective.selling_price || collective.base_price || 0;
  const sc = STATUS_CONFIG[collective.status] || STATUS_CONFIG.draft;
  const refCode = generateRefCode(collective);

  return (
    <div
      className={cn(
        "relative w-full border-b border-border group transition-all",
        isSelected ? "bg-amber-50 dark:bg-amber-950/20 border-l-2 border-l-amber-500" : "hover:bg-muted/40"
      )}
    >
      <button onClick={() => onSelect(collective)} className="w-full text-left px-3 py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className={cn("text-xs font-semibold truncate", isSelected ? "text-amber-700 dark:text-amber-400" : "text-foreground")}>
              {collective.name}
            </p>
            <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
              <Plane className="w-2.5 h-2.5" /> {collective.destination}
            </p>
          </div>
          <Badge className={cn("text-[8px] flex-shrink-0", sc.class)}>{sc.label}</Badge>
        </div>
        <div className="flex items-center justify-between mt-1.5">
          <code className="text-[9px] font-mono text-muted-foreground/60">{refCode}</code>
          {price > 0 && <span className="text-[10px] font-bold text-amber-600">₱{Number(price).toLocaleString()}</span>}
        </div>
      </button>
      {/* Delete action — appears on hover */}
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(collective); }}
        className="absolute top-2 right-2 w-5 h-5 rounded flex items-center justify-center text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 opacity-0 group-hover:opacity-100 transition-all"
      >
        <Trash2 className="w-3 h-3" />
      </button>
    </div>
  );
}

// ─── Editor Tabs ──────────────────────────────────────────────────────────────

function EditorTabs({ active, onChange }) {
  const tabs = [
    { key: 'info', label: 'Package Info', icon: Package },
    { key: 'pricing', label: 'Pricing', icon: DollarSign },
    { key: 'hotels', label: 'Hotels', icon: Hotel },
    { key: 'content', label: 'Inclusions & Terms', icon: FileText },
  ];
  return (
    <div className="flex border-b border-border bg-muted/20 overflow-x-auto">
      {tabs.map(t => {
        const Icon = t.icon;
        return (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium whitespace-nowrap border-b-2 transition-colors",
              active === t.key
                ? "border-amber-500 text-amber-600 bg-card"
                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30"
            )}
          >
            <Icon className="w-3.5 h-3.5" /> {t.label}
          </button>
        );
      })}
    </div>
  );
}

// ─── NumField helper ──────────────────────────────────────────────────────────

function F({ label, children, className }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {label && <Label className="text-xs font-medium text-muted-foreground">{label}</Label>}
      {children}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function EZQuoteWorkspace({ collectives: externalCollectives, onCollectivesChange }) {
  const [collectives, setCollectives] = useState(externalCollectives || []);
  const [bookings, setBookings] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedCollective, setSelectedCollective] = useState(null);
  const [quote, setQuote] = useState(BLANK_QUOTE());
  const [activeEditorTab, setActiveEditorTab] = useState('info');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isNewPackage, setIsNewPackage] = useState(false);
  const [autoSaveTimer, setAutoSaveTimer] = useState(null);
  const [autoSaved, setAutoSaved] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  // Sync external collectives
  useEffect(() => {
    if (externalCollectives) setCollectives(externalCollectives);
  }, [externalCollectives]);

  useEffect(() => {
    base44.entities.Booking.list().then(setBookings).catch(() => {});
  }, []);

  const setQ = useCallback((key, val) => {
    setQuote(prev => {
      const next = { ...prev, [key]: val };
      // Auto-save debounce (only for existing packages)
      if (selectedCollective?.id) {
        if (autoSaveTimer) clearTimeout(autoSaveTimer);
        const t = setTimeout(async () => {
          const bForeign = Number(next.base_cost_foreign) || 0;
          const eRate = Number(next.exchange_rate) || 1;
          const bPHP = next.currency === 'PHP' ? bForeign : bForeign * eRate;
          const mPHP = next.use_markup_pct ? bPHP * (Number(next.markup_pct) / 100) : Number(next.markup_php) || 0;
          await base44.entities.Collective.update(selectedCollective.id, {
            name: next.package_name,
            destination: next.destination,
            travel_type: next.travel_type,
            operator_name: next.operator_name,
            departure_date: next.departure_date || undefined,
            return_date: next.return_date || undefined,
            base_price_currency: next.currency,
            base_price_foreign: bForeign,
            exchange_rate: eRate,
            base_price_php: bPHP,
            markup_amount: mPHP,
            selling_price: bPHP + mPHP,
            commission_amount: Number(next.commission_per_pax),
            downpayment_required: Number(next.downpayment_required),
            total_slots: Number(next.pax_estimate) || 0,
            inclusions: next.inclusions,
            exclusions: next.exclusions,
            cancellation_policy: next.cancellation_policy,
            optional_tours: next.optional_tours,
            flight_details: next.flight_details,
            remarks: next.remarks,
            status: next.status || 'draft',
          });
          setAutoSaved(true);
          setTimeout(() => setAutoSaved(false), 2000);
        }, 2000);
        setAutoSaveTimer(t);
      }
      return next;
    });
  }, [selectedCollective, autoSaveTimer]);

  // ── Load collective into editor ──
  const loadCollective = useCallback((c) => {
    if (c && c._partial) {
      const { _partial, ...partial } = c;
      setQuote(prev => ({ ...prev, ...partial }));
      setSelectedCollective(null);
      setIsNewPackage(true);
      setSaved(false);
      return;
    }
    setSelectedCollective(c);
    setIsNewPackage(false);
    setSaved(false);
    setQuote({
      package_name: c.name || '',
      destination: c.destination || '',
      travel_type: c.travel_type || 'international',
      operator_name: c.operator_name || '',
      departure_date: c.departure_date || '',
      return_date: c.return_date || '',
      nights: c.nights || '',
      pax_estimate: c.total_slots || 20,
      guaranteed_departure_pax: c.guaranteed_departure || 0,
      currency: c.base_price_currency || 'USD',
      exchange_rate: c.exchange_rate || 57,
      base_cost_foreign: c.base_price_foreign || '',
      markup_php: c.markup_amount || 0,
      markup_pct: 0,
      use_markup_pct: false,
      commission_per_pax: c.commission_amount || 0,
      downpayment_required: c.downpayment_required || 0,
      inclusions: c.inclusions || '',
      exclusions: c.exclusions || '',
      cancellation_policy: c.cancellation_policy || '',
      optional_tours: c.optional_tours || '',
      flight_details: c.flight_details || '',
      remarks: c.remarks || '',
      hotel_rows: [BLANK_HOTEL()],
      status: c.status || 'draft',
    });
  }, []);

  const startNewPackage = () => {
    setSelectedCollective(null);
    setIsNewPackage(true);
    setQuote(BLANK_QUOTE());
    setSaved(false);
    setActiveEditorTab('info');
  };

  // ── Computed pricing ──
  const currSymbol = CURRENCIES.find(c => c.value === quote.currency)?.symbol || '$';
  const baseForeign = Number(quote.base_cost_foreign) || 0;
  const exRate = Number(quote.exchange_rate) || 1;
  const basePHP = quote.currency === 'PHP' ? baseForeign : baseForeign * exRate;
  const markupPHP = quote.use_markup_pct ? basePHP * (Number(quote.markup_pct) / 100) : Number(quote.markup_php) || 0;
  const sellingPrice = basePHP + markupPHP;
  const balance = sellingPrice - Number(quote.downpayment_required);
  const grossMargin = sellingPrice > 0 ? ((markupPHP / sellingPrice) * 100).toFixed(1) : 0;
  const estRevenue = sellingPrice * Number(quote.pax_estimate || 0);

  // ── Save ──
  const handleSave = async () => {
    if (!quote.package_name || !quote.destination) return;
    setSaving(true);
    const payload = {
      name: quote.package_name,
      destination: quote.destination,
      travel_type: quote.travel_type,
      operator_name: quote.operator_name,
      departure_date: quote.departure_date || undefined,
      return_date: quote.return_date || undefined,
      base_price_currency: quote.currency,
      base_price_foreign: baseForeign,
      exchange_rate: exRate,
      base_price_php: basePHP,
      markup_amount: markupPHP,
      selling_price: sellingPrice,
      commission_amount: Number(quote.commission_per_pax),
      downpayment_required: Number(quote.downpayment_required),
      total_slots: Number(quote.pax_estimate) || 0,
      available_slots: Number(quote.pax_estimate) || 0,
      inclusions: quote.inclusions,
      exclusions: quote.exclusions,
      cancellation_policy: quote.cancellation_policy,
      optional_tours: quote.optional_tours,
      flight_details: quote.flight_details,
      remarks: quote.remarks,
      status: quote.status || 'draft',
    };

    let saved_c;
    if (selectedCollective?.id) {
      saved_c = await base44.entities.Collective.update(selectedCollective.id, payload);
    } else {
      saved_c = await base44.entities.Collective.create(payload);
      setSelectedCollective(saved_c);
      setIsNewPackage(false);
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    if (onCollectivesChange) onCollectivesChange();
  };

  // ── Delete package ──
  const handleDelete = async (collective) => {
    await base44.entities.Collective.delete(collective.id);
    if (selectedCollective?.id === collective.id) {
      setSelectedCollective(null);
      setIsNewPackage(false);
      setQuote(BLANK_QUOTE());
    }
    setConfirmDelete(null);
    if (onCollectivesChange) onCollectivesChange();
  };

  // ── Filter packages ──
  const filtered = collectives.filter(c => {
    const q = search.toLowerCase();
    const matchSearch = !search || c.name?.toLowerCase().includes(q) || c.destination?.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // ── Hotel row helpers ──
  const updateHotelRow = (id, key, val) => setQ('hotel_rows', quote.hotel_rows.map(r => r.id === id ? { ...r, [key]: val } : r));
  const addHotelRow = () => setQ('hotel_rows', [...quote.hotel_rows, BLANK_HOTEL()]);
  const removeHotelRow = (id) => { if (quote.hotel_rows.length > 1) setQ('hotel_rows', quote.hotel_rows.filter(r => r.id !== id)); };

  const isEditorVisible = selectedCollective || isNewPackage;

  return (
    <div className="flex h-full min-h-[600px] bg-background rounded-xl border border-border overflow-hidden">

      {/* ── LEFT: Package List Panel ── */}
      <div className="w-64 flex-shrink-0 flex flex-col border-r border-border bg-card">
        {/* Panel Header */}
        <div className="px-3 py-3 border-b border-border space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Packages</span>
            <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">{collectives.length}</span>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              className="w-full pl-8 pr-3 py-1.5 bg-muted/50 border border-border rounded-lg text-[11px] outline-none focus:border-amber-400 transition-colors placeholder:text-muted-foreground/60"
              placeholder="Search packages…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-7 text-[11px] bg-muted/50 border-border">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All Status</SelectItem>
              {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                <SelectItem key={k} value={k} className="text-xs">{v.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" className="w-full h-7 text-xs gradient-gold text-white border-0 gap-1" onClick={startNewPackage}>
            <Plus className="w-3 h-3" /> New Package
          </Button>
        </div>

        {/* Package list */}
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">No packages found</div>
          ) : (
            filtered.map(c => (
              <PackageListItem
                key={c.id}
                collective={c}
                isSelected={selectedCollective?.id === c.id}
                onSelect={loadCollective}
                onDelete={(c) => setConfirmDelete(c)}
              />
            ))
          )}
        </div>
      </div>

      {/* ── RIGHT: Editor or Welcome ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {!isEditorVisible ? (
          /* Welcome state */
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-8">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/20 flex items-center justify-center">
              <Calculator className="w-8 h-8 text-amber-500" />
            </div>
            <div>
              <h3 className="font-bold text-lg font-jakarta text-foreground">EZQuote Workspace</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                Select a package from the list to edit, or create a new one. Use Smart Import to load from existing data.
              </p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" className="gradient-gold text-white border-0 gap-1.5 text-xs" onClick={startNewPackage}>
                <Plus className="w-3.5 h-3.5" /> New Package
              </Button>
              <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => setSidebarOpen(true)}>
                <Zap className="w-3.5 h-3.5" /> Smart Import
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Editor Topbar */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-card/80">
              <div className="flex items-center gap-3 min-w-0">
                <div className="min-w-0">
                  <h3 className="font-bold text-sm font-jakarta text-foreground truncate">
                    {quote.package_name || 'New Package'}
                  </h3>
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                    {selectedCollective && (
                      <code className="font-mono bg-muted px-1.5 py-0.5 rounded">
                        {generateRefCode(selectedCollective)}
                      </code>
                    )}
                    {quote.destination && <span>{quote.destination}</span>}
                    {sellingPrice > 0 && (
                      <span className="text-amber-600 font-semibold">₱{sellingPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}/pax</span>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Select value={quote.status} onValueChange={v => setQ('status', v)}>
                  <SelectTrigger className="h-7 text-[11px] w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                      <SelectItem key={k} value={k} className="text-xs">{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {autoSaved && (
                  <span className="text-[10px] text-emerald-600 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Auto-saved
                  </span>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs gap-1"
                  onClick={() => setSidebarOpen(true)}
                >
                  <Zap className="w-3 h-3" /> Smart Import
                </Button>
                <Button
                  size="sm"
                  className={cn("h-7 text-xs gap-1 text-white", saved ? "bg-emerald-600 hover:bg-emerald-700" : "gradient-gold border-0")}
                  onClick={handleSave}
                  disabled={saving || !quote.package_name}
                >
                  {saving ? <RefreshCw className="w-3 h-3 animate-spin" /> : saved ? <CheckCircle className="w-3 h-3" /> : <Save className="w-3 h-3" />}
                  {saving ? 'Saving…' : saved ? 'Saved!' : selectedCollective?.id ? 'Update' : 'Save to DB'}
                </Button>
              </div>
            </div>

            {/* Pricing Banner */}
            {sellingPrice > 0 && (
              <div className="px-5 py-2 bg-gradient-to-r from-amber-500/10 to-orange-500/5 border-b border-amber-200/50 dark:border-amber-700/30 flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-3">
                  {quote.currency !== 'PHP' && baseForeign > 0 && (
                    <>
                      <span className="text-xs text-muted-foreground">{currSymbol}{baseForeign.toLocaleString()} × {exRate}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-xs font-semibold text-sky-700">₱{basePHP.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                      {markupPHP > 0 && <><ArrowRight className="w-3.5 h-3.5 text-muted-foreground" /><span className="text-xs text-emerald-600">+₱{markupPHP.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span></>}
                      <ArrowRight className="w-3.5 h-3.5 text-amber-500" />
                    </>
                  )}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-muted-foreground">Selling Price</span>
                    <span className="text-sm font-black text-amber-600 font-jakarta">₱{sellingPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground ml-auto">
                  <span>Margin: <strong className="text-foreground">{grossMargin}%</strong></span>
                  <span>DP: <strong className="text-foreground">₱{Number(quote.downpayment_required).toLocaleString()}</strong></span>
                  <span>Est. Rev: <strong className="text-emerald-600">₱{(estRevenue / 1000).toFixed(0)}K</strong></span>
                  <span>Pax: <strong className="text-foreground">{quote.pax_estimate}</strong></span>
                </div>
              </div>
            )}

            {/* Editor Tabs */}
            <EditorTabs active={activeEditorTab} onChange={setActiveEditorTab} />

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-5">

              {/* ── INFO TAB ── */}
              {activeEditorTab === 'info' && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <F label="Package Name *" className="col-span-2">
                    <Input
                      placeholder="e.g. Japan Cherry Blossom 2026"
                      value={quote.package_name}
                      onChange={e => setQ('package_name', e.target.value)}
                      className={cn("h-9 text-sm", !quote.package_name && 'border-amber-300')}
                    />
                  </F>
                  <F label="Travel Type">
                    <Select value={quote.travel_type} onValueChange={v => setQ('travel_type', v)}>
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="domestic">🏠 Domestic</SelectItem>
                        <SelectItem value="international">🌍 International</SelectItem>
                      </SelectContent>
                    </Select>
                  </F>
                  <F label="Destination *">
                    <Input placeholder="e.g. Tokyo, Japan" value={quote.destination} onChange={e => setQ('destination', e.target.value)} className="h-9" />
                  </F>
                  <F label="Operator / DMC">
                    <Input placeholder="Tour operator name" value={quote.operator_name} onChange={e => setQ('operator_name', e.target.value)} className="h-9" />
                  </F>
                  <F label="No. of Nights">
                    <Input type="number" placeholder="e.g. 5" value={quote.nights} onChange={e => setQ('nights', e.target.value)} className="h-9" />
                  </F>
                  <F label="Departure Date">
                    <Input type="date" value={quote.departure_date} onChange={e => setQ('departure_date', e.target.value)} className="h-9" />
                  </F>
                  <F label="Return Date">
                    <Input type="date" value={quote.return_date} onChange={e => setQ('return_date', e.target.value)} className="h-9" />
                  </F>
                  <F label="Estimated Pax">
                    <Input type="number" value={quote.pax_estimate} onChange={e => setQ('pax_estimate', Number(e.target.value))} className="h-9" />
                  </F>
                  <F label="Guaranteed Dept. Pax">
                    <Input type="number" placeholder="Min pax to confirm" value={quote.guaranteed_departure_pax} onChange={e => setQ('guaranteed_departure_pax', Number(e.target.value))} className="h-9" />
                  </F>
                  <F label="Flight Details" className="col-span-2 md:col-span-3">
                    <Input placeholder="e.g. PR 405 MNL-NRT · PR 406 NRT-MNL" value={quote.flight_details} onChange={e => setQ('flight_details', e.target.value)} className="h-9" />
                  </F>
                </div>
              )}

              {/* ── PRICING TAB ── */}
              {activeEditorTab === 'pricing' && (
                <div className="space-y-5">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <F label="Base Currency">
                      <Select value={quote.currency} onValueChange={v => setQ('currency', v)}>
                        <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>{CURRENCIES.map(c => <SelectItem key={c.value} value={c.value} className="text-xs">{c.value} – {c.label}</SelectItem>)}</SelectContent>
                      </Select>
                    </F>
                    <F label={`Base Cost (${currSymbol})`}>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{currSymbol}</span>
                        <Input type="number" className="pl-7 h-9 text-sm" value={quote.base_cost_foreign} onChange={e => setQ('base_cost_foreign', e.target.value)} />
                      </div>
                    </F>
                    {quote.currency !== 'PHP' && (
                      <F label="Exchange Rate (→ PHP)">
                        <Input type="number" className="h-9 text-sm" placeholder="e.g. 57.50" value={quote.exchange_rate} onChange={e => setQ('exchange_rate', Number(e.target.value))} />
                      </F>
                    )}
                    <F label="Base Cost PHP">
                      <div className="h-9 flex items-center px-3 bg-sky-50 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-800 rounded-md">
                        <span className="text-sm font-bold text-sky-700">₱{basePHP.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                      </div>
                    </F>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <F label="Markup Type">
                      <Select value={quote.use_markup_pct ? 'pct' : 'fixed'} onValueChange={v => setQ('use_markup_pct', v === 'pct')}>
                        <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fixed" className="text-xs">Fixed Amount (₱)</SelectItem>
                          <SelectItem value="pct" className="text-xs">Percentage (%)</SelectItem>
                        </SelectContent>
                      </Select>
                    </F>
                    <F label={quote.use_markup_pct ? 'Markup %' : 'Markup Amount (₱)'}>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{quote.use_markup_pct ? '%' : '₱'}</span>
                        <Input
                          type="number" className="pl-7 h-9 text-sm"
                          value={quote.use_markup_pct ? quote.markup_pct : quote.markup_php}
                          onChange={e => quote.use_markup_pct ? setQ('markup_pct', Number(e.target.value)) : setQ('markup_php', Number(e.target.value))}
                        />
                      </div>
                    </F>
                    <F label="Gross Margin">
                      <div className="h-9 flex items-center px-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 rounded-md">
                        <span className="text-sm font-bold text-emerald-700">{grossMargin}%</span>
                      </div>
                    </F>
                    <F label="Selling Price / Pax">
                      <div className="h-9 flex items-center px-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-300 rounded-md">
                        <span className="text-sm font-black text-amber-700">₱{sellingPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                      </div>
                    </F>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <F label="Commission / Pax (₱)">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">₱</span>
                        <Input type="number" className="pl-7 h-9 text-sm" value={quote.commission_per_pax} onChange={e => setQ('commission_per_pax', Number(e.target.value))} />
                      </div>
                    </F>
                    <F label="Required Downpayment (₱)">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">₱</span>
                        <Input type="number" className="pl-7 h-9 text-sm" value={quote.downpayment_required} onChange={e => setQ('downpayment_required', Number(e.target.value))} />
                      </div>
                    </F>
                    <F label="Balance after DP">
                      <div className="h-9 flex items-center px-3 bg-muted rounded-md">
                        <span className="text-sm font-semibold">₱{balance.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                      </div>
                    </F>
                  </div>
                </div>
              )}

              {/* ── HOTELS TAB ── */}
              {activeEditorTab === 'hotels' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Info className="w-3.5 h-3.5" /> Click any cell to edit. Add one row per hotel or category.
                    </p>
                    <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={addHotelRow}>
                      <Plus className="w-3 h-3" /> Add Row
                    </Button>
                  </div>
                  <div className="overflow-x-auto rounded-lg border border-border">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-muted/60 border-b border-border">
                          <th className="text-left px-3 py-2 font-semibold text-muted-foreground w-28">Category</th>
                          <th className="text-left px-3 py-2 font-semibold text-muted-foreground w-32">Hotel Name</th>
                          <th className="text-left px-3 py-2 font-semibold text-muted-foreground w-24">Location</th>
                          {['Twin', 'Triple', 'Quad', 'Solo', 'Child NB', 'Child Bed', 'Infant'].map(h => (
                            <th key={h} className="text-right px-3 py-2 font-semibold text-amber-700 w-20">{h} (₱)</th>
                          ))}
                          <th className="w-8" />
                        </tr>
                      </thead>
                      <tbody>
                        {quote.hotel_rows.map((row, i) => (
                          <tr key={row.id} className={cn("border-b border-border last:border-0 hover:bg-muted/20 transition-colors", i % 2 ? "bg-muted/5" : "")}>
                            <td className="px-1 py-1">
                              <Select value={row.category} onValueChange={v => updateHotelRow(row.id, 'category', v)}>
                                <SelectTrigger className="h-7 text-[11px] border-0 bg-transparent"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  {HOTEL_CATEGORIES.map(c => <SelectItem key={c.value} value={c.value} className="text-xs">{c.label}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </td>
                            <td className="px-1 py-1">
                              <input className="w-full px-2 py-1 text-xs rounded hover:bg-sky-50 dark:hover:bg-sky-950/20 transition-colors outline-none focus:bg-sky-50 dark:focus:bg-sky-950/20 border border-transparent focus:border-sky-300" value={row.hotel_name} onChange={e => updateHotelRow(row.id, 'hotel_name', e.target.value)} placeholder="Hotel name" />
                            </td>
                            <td className="px-1 py-1">
                              <input className="w-full px-2 py-1 text-xs rounded hover:bg-sky-50 dark:hover:bg-sky-950/20 transition-colors outline-none focus:bg-sky-50 border border-transparent focus:border-sky-300" value={row.location} onChange={e => updateHotelRow(row.id, 'location', e.target.value)} placeholder="City" />
                            </td>
                            {['twin', 'triple', 'quad', 'solo', 'child_no_bed', 'child_bed', 'infant'].map(k => (
                              <td key={k} className="px-1 py-1">
                                <input type="number" className="w-full px-2 py-1 text-xs text-right rounded hover:bg-amber-50 dark:hover:bg-amber-950/20 transition-colors outline-none focus:bg-amber-50 border border-transparent focus:border-amber-300" value={row[k] || ''} onChange={e => updateHotelRow(row.id, k, Number(e.target.value))} placeholder="—" />
                              </td>
                            ))}
                            <td className="px-1 py-1 text-center">
                              {quote.hotel_rows.length > 1 && (
                                <button onClick={() => removeHotelRow(row.id)} className="w-6 h-6 rounded hover:bg-rose-100 dark:hover:bg-rose-950/40 flex items-center justify-center text-rose-400 hover:text-rose-600 transition-colors">
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ── CONTENT TAB ── */}
              {activeEditorTab === 'content' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <F label="✔ Inclusions">
                    <Textarea rows={5} placeholder={"• Round-trip airfare\n• Hotel accommodation\n• Daily breakfast"} value={quote.inclusions} onChange={e => setQ('inclusions', e.target.value)} className="text-xs font-mono resize-none" />
                  </F>
                  <F label="✘ Exclusions">
                    <Textarea rows={5} placeholder={"• Visa fees\n• Personal expenses\n• Travel insurance"} value={quote.exclusions} onChange={e => setQ('exclusions', e.target.value)} className="text-xs font-mono resize-none" />
                  </F>
                  <F label="Optional Tours">
                    <Textarea rows={3} placeholder="List optional add-on tours..." value={quote.optional_tours} onChange={e => setQ('optional_tours', e.target.value)} className="text-xs resize-none" />
                  </F>
                  <F label="Cancellation Policy">
                    <Textarea rows={3} placeholder="Cancellation terms..." value={quote.cancellation_policy} onChange={e => setQ('cancellation_policy', e.target.value)} className="text-xs resize-none" />
                  </F>
                  <F label="Remarks" className="md:col-span-2">
                    <Textarea rows={2} value={quote.remarks} onChange={e => setQ('remarks', e.target.value)} className="text-xs resize-none" />
                  </F>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* ── Smart Import Sidebar ── */}
      <SmartImportSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collectives={collectives}
        onLoadPackage={(c) => { loadCollective(c); setSidebarOpen(false); }}
      />

      {/* ── Confirm Delete Modal ── */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-xl shadow-2xl p-6 max-w-sm w-full space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-950/30 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-foreground">Delete Package?</h3>
                <p className="text-xs text-muted-foreground mt-0.5">This will permanently delete <strong>{confirmDelete.name}</strong> and all associated data.</p>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setConfirmDelete(null)} className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground border border-border rounded-lg transition-colors">
                Cancel
              </button>
              <button onClick={() => handleDelete(confirmDelete)} className="px-3 py-1.5 text-xs bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors">
                Delete Package
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}