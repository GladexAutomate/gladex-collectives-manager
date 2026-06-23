import { useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import {
  Save, RefreshCw, CheckCircle, ArrowRight, Plus, Search,
  FileText, Plane, DollarSign, Package, Calculator,
  Trash2, Sparkles, Globe, Eye, GitBranch, Menu
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import AISmartImport from '@/components/collectives/AISmartImport';
import PricingDatesManager from '@/components/collectives/PricingDatesManager';
import CopyPackageButton, { RawPackageJSON } from '@/components/collectives/CopyPackageButton';
import WorkflowProgressBadge from '@/components/workflow/WorkflowProgressBadge';
import { useNavigate } from 'react-router-dom';
import { generateRefCode } from '@/components/product/SmartImportSidebar';

// ── Constants ─────────────────────────────────────────────────────────────────

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

const STATUS_CONFIG = {
  draft:                { label: 'Draft',              class: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300' },
  active:               { label: '🟢 Active',           class: 'bg-emerald-100 text-emerald-700 font-semibold' },
  open_booking:         { label: '🟢 Open Booking',   class: 'bg-teal-100 text-teal-700 font-semibold' },
  confirmed_departure:  { label: '✈ Confirmed',       class: 'bg-sky-100 text-sky-700 font-semibold' },
  ongoing:              { label: '🌍 Ongoing',         class: 'bg-amber-100 text-amber-700 font-semibold' },
  completed:            { label: '✓ Completed',        class: 'bg-emerald-100 text-emerald-700 font-semibold' },
  cancelled:            { label: 'Cancelled',          class: 'bg-rose-100 text-rose-700' },
};

const BLANK = () => ({
  name: '', destination: '', travel_type: 'international',
  operator_name: '', departure_date: '', return_date: '', nights: '',
  total_slots: 20, slots_for_confirmation: false,
  booked_pax: 0, guaranteed_departure: false,
  currency: 'USD', exchange_rate: 57, base_price_foreign: 0,
  markup_amount: 0, markup_pct: 0, use_markup_pct: false,
  commission_amount: 0, downpayment_required: 0,
  rate_twin: '', rate_twin_age_min: '', rate_twin_age_max: '',
  rate_triple: '', rate_triple_age_min: '', rate_triple_age_max: '',
  rate_quad: '', rate_quad_age_min: '', rate_quad_age_max: '',
  rate_single: '', rate_single_age_min: '', rate_single_age_max: '',
  rate_solo: '', rate_solo_age_min: '', rate_solo_age_max: '',
  rate_single_supplement: '',
  rate_child_no_bed: '', rate_child_no_bed_age_min: '', rate_child_no_bed_age_max: '',
  rate_child: '', rate_child_age_min: '', rate_child_age_max: '',
  rate_infant: '', rate_infant_age_min: '', rate_infant_age_max: '',
  inclusions: '', exclusions: '', cancellation_policy: '',
  itinerary: '', terms_conditions: '',
  optional_tours: '', flight_details: '', hotel_details: '', remarks: '',
  travel_dates: [],
  status: 'draft',
  _use_markup_pct: false,
});

// ── Field wrapper ──────────────────────────────────────────────────────────────
function F({ label, children, className }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {label && <Label className="text-xs font-medium text-muted-foreground">{label}</Label>}
      {children}
    </div>
  );
}

// ── Editor Tabs ────────────────────────────────────────────────────────────────
function EditorTabs({ active, onChange, collective }) {
  const tabs = [
    { key: 'ai_import', label: '✦ AI Import',   icon: Sparkles, gold: true },
    { key: 'info',      label: 'Package Info',  icon: Package },
    { key: 'pricing_dates', label: 'Pricing & Dates', icon: DollarSign },
    { key: 'content',   label: 'Inclusions',    icon: FileText },
    { key: 'itinerary', label: 'Itinerary',     icon: FileText },
    { key: 'terms',     label: 'Terms',         icon: FileText },
    { key: 'workflow',  label: 'Workflow',      icon: GitBranch, show: !!collective?.id },
  ];
  return (
    <div className="flex border-b border-border bg-muted/20 overflow-x-auto flex-shrink-0">
      {tabs.filter(t => t.show !== false).map(t => {
        const Icon = t.icon;
        return (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium whitespace-nowrap border-b-2 transition-colors flex-shrink-0",
              active === t.key && t.gold ? "border-amber-500 text-amber-600 bg-amber-50/60 dark:bg-amber-950/20" :
              active === t.key ? "border-amber-500 text-amber-600 bg-card" :
              t.gold ? "border-transparent text-amber-500 hover:bg-amber-50/40" :
              "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30"
            )}
          >
            <Icon className="w-3.5 h-3.5" /> {t.label}
          </button>
        );
      })}
    </div>
  );
}

// ── Collective List Item ───────────────────────────────────────────────────────
function CollectiveListItem({ c, isSelected, onSelect, onDelete, coverImage }) {
  const sc = STATUS_CONFIG[c.status] || STATUS_CONFIG.draft;
  return (
    <div className={cn(
      "relative group border-b border-border transition-all",
      isSelected ? "bg-amber-50 dark:bg-amber-950/20 border-l-2 border-l-amber-500" : "hover:bg-muted/40"
    )}>
      <button onClick={() => onSelect(c)} className="w-full text-left">
        {coverImage && (
          <div className="h-12 w-full overflow-hidden">
            <img src={coverImage} alt={c.name} className="w-full h-full object-cover" onError={e => e.target.style.display='none'} />
          </div>
        )}
        <div className="px-3 py-2.5">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className={cn("text-xs font-semibold truncate", isSelected ? "text-amber-700 dark:text-amber-400" : "text-foreground")}>
                {c.name || 'Unnamed Collective'}
              </p>
              <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                <Plane className="w-2.5 h-2.5" /> {c.destination || '—'}
              </p>
            </div>
            <Badge className={cn("text-[8px] flex-shrink-0 leading-tight", sc.class)}>{sc.label}</Badge>
          </div>
          <div className="flex items-center justify-between mt-1.5">
            <WorkflowProgressBadge collective={c} mini />
            {(c.selling_price || c.base_price) > 0 && (
              <span className="text-[10px] font-bold text-amber-600">₱{Number(c.selling_price || c.base_price).toLocaleString()}</span>
            )}
          </div>
        </div>
      </button>
      <div className="absolute top-1.5 right-1.5 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all">
        <CopyPackageButton pkg={c} size="iconSm" variant="ghost"
          className="w-5 h-5 rounded text-muted-foreground hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950/30 [&_svg]:w-3 [&_svg]:h-3"
        />
        <button
          onClick={e => { e.stopPropagation(); onDelete(c); }}
          className="w-5 h-5 rounded flex items-center justify-center text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function CollectiveWorkspace({ collectives, onCollectivesChange, marketingAssets }) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedCollective, setSelectedCollective] = useState(null);
  const [form, setForm] = useState(BLANK());
  const [activeTab, setActiveTab] = useState('ai_import');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [autoSaved, setAutoSaved] = useState(false);
  const [autoSaveTimer, setAutoSaveTimer] = useState(null);
  const [isNew, setIsNew] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [generatingWorkflow, setGeneratingWorkflow] = useState(false);

  // ── Computed pricing ──
  const currSymbol = CURRENCIES.find(c => c.value === form.currency)?.symbol || '$';
  const baseForeign = Number(form.base_price_foreign) || 0;
  const exRate = Number(form.exchange_rate) || 1;
  const basePHP = form.currency === 'PHP' ? baseForeign : baseForeign * exRate;
  const markupPHP = form._use_markup_pct ? basePHP * (Number(form.markup_pct) / 100) : Number(form.markup_amount) || 0;
  const sellingPrice = basePHP + markupPHP;
  const balance = sellingPrice - Number(form.downpayment_required);
  const grossMargin = sellingPrice > 0 ? ((markupPHP / sellingPrice) * 100).toFixed(1) : 0;

  const setF = useCallback((key, val) => {
    setForm(prev => {
      const next = { ...prev, [key]: val };
      // Auto-save for existing collectives
      if (selectedCollective?.id) {
        if (autoSaveTimer) clearTimeout(autoSaveTimer);
        const t = setTimeout(async () => {
          const bF = Number(next.base_price_foreign) || 0;
          const eR = Number(next.exchange_rate) || 1;
          const bP = next.currency === 'PHP' ? bF : bF * eR;
          const mP = next._use_markup_pct ? bP * (Number(next.markup_pct) / 100) : Number(next.markup_amount) || 0;
          await base44.entities.Collective.update(selectedCollective.id, buildPayload(next, bP, mP));
          setAutoSaved(true);
          setTimeout(() => setAutoSaved(false), 2000);
        }, 2000);
        setAutoSaveTimer(t);
      }
      return next;
    });
  }, [selectedCollective, autoSaveTimer]);

  const buildPayload = (f, bPHP_val, mPHP_val) => {
    const bP = bPHP_val !== undefined ? bPHP_val : basePHP;
    const mP = mPHP_val !== undefined ? mPHP_val : markupPHP;
    return {
      name: f.name,
      destination: f.destination,
      travel_type: f.travel_type || 'international',
      operator_name: f.operator_name,
      departure_date: f.departure_date || undefined,
      return_date: f.return_date || undefined,
      base_price_currency: f.currency,
      base_price_foreign: Number(f.base_price_foreign) || 0,
      exchange_rate: Number(f.exchange_rate) || 1,
      base_price_php: bP,
      markup_amount: mP,
      selling_price: bP + mP,
      commission_amount: Number(f.commission_amount) || 0,
      downpayment_required: Number(f.downpayment_required) || 0,
      rate_twin: Number(f.rate_twin) || undefined, rate_twin_age_min: Number(f.rate_twin_age_min) || undefined, rate_twin_age_max: Number(f.rate_twin_age_max) || undefined,
      rate_triple: Number(f.rate_triple) || undefined, rate_triple_age_min: Number(f.rate_triple_age_min) || undefined, rate_triple_age_max: Number(f.rate_triple_age_max) || undefined,
      rate_quad: Number(f.rate_quad) || undefined, rate_quad_age_min: Number(f.rate_quad_age_min) || undefined, rate_quad_age_max: Number(f.rate_quad_age_max) || undefined,
      rate_single: Number(f.rate_single) || undefined, rate_single_age_min: Number(f.rate_single_age_min) || undefined, rate_single_age_max: Number(f.rate_single_age_max) || undefined,
      rate_solo: Number(f.rate_solo) || undefined, rate_solo_age_min: Number(f.rate_solo_age_min) || undefined, rate_solo_age_max: Number(f.rate_solo_age_max) || undefined,
      rate_single_supplement: Number(f.rate_single_supplement) || undefined,
      rate_child_no_bed: Number(f.rate_child_no_bed) || undefined, rate_child_no_bed_age_min: Number(f.rate_child_no_bed_age_min) || undefined, rate_child_no_bed_age_max: Number(f.rate_child_no_bed_age_max) || undefined,
      rate_child: Number(f.rate_child) || undefined, rate_child_age_min: Number(f.rate_child_age_min) || undefined, rate_child_age_max: Number(f.rate_child_age_max) || undefined,
      rate_infant: Number(f.rate_infant) || undefined, rate_infant_age_min: Number(f.rate_infant_age_min) || undefined, rate_infant_age_max: Number(f.rate_infant_age_max) || undefined,
      slots_for_confirmation: f.slots_for_confirmation || false,
      total_slots: Number(f.total_slots) || 0,
      available_slots: Math.max(0, (Number(f.total_slots) || 0) - (Number(f.booked_pax) || 0)),
      booked_pax: Number(f.booked_pax) || 0,
      guaranteed_departure: f.guaranteed_departure || false,
      inclusions: f.inclusions,
      exclusions: f.exclusions,
      cancellation_policy: f.cancellation_policy,
      itinerary: f.itinerary,
      terms_conditions: f.terms_conditions,
      optional_tours: f.optional_tours,
      flight_details: f.flight_details,
      hotel_details: f.hotel_details,
      remarks: f.remarks,
      travel_dates: (f.travel_dates || []).map(d => ({
        ...d,
        total_slots: Number(d.total_slots) || 0,
        booked_slots: Number(d.booked_slots) || 0,
        price_override: d.price_override ? Number(d.price_override) : undefined,
      })),
      status: f.status || 'draft',
    };
  };

  const loadCollective = (c) => {
    setSelectedCollective(c);
    setIsNew(false);
    setSaved(false);
    setForm({
      name: c.name || '',
      destination: c.destination || '',
      travel_type: c.travel_type || 'international',
      operator_name: c.operator_name || '',
      departure_date: c.departure_date || '',
      return_date: c.return_date || '',
      nights: c.nights || '',
      total_slots: c.total_slots || 20,
      slots_for_confirmation: c.slots_for_confirmation || false,
      booked_pax: c.booked_pax || 0,
      guaranteed_departure: c.guaranteed_departure || false,
      currency: c.base_price_currency || 'USD',
      exchange_rate: c.exchange_rate || 57,
      base_price_foreign: c.base_price_foreign || 0,
      markup_amount: c.markup_amount || 0,
      markup_pct: 0,
      _use_markup_pct: false,
      commission_amount: c.commission_amount || 0,
      downpayment_required: c.downpayment_required || 0,
      rate_twin: c.rate_twin || '', rate_twin_age_min: c.rate_twin_age_min || '', rate_twin_age_max: c.rate_twin_age_max || '',
      rate_triple: c.rate_triple || '', rate_triple_age_min: c.rate_triple_age_min || '', rate_triple_age_max: c.rate_triple_age_max || '',
      rate_quad: c.rate_quad || '', rate_quad_age_min: c.rate_quad_age_min || '', rate_quad_age_max: c.rate_quad_age_max || '',
      rate_single: c.rate_single || '', rate_single_age_min: c.rate_single_age_min || '', rate_single_age_max: c.rate_single_age_max || '',
      rate_solo: c.rate_solo || '', rate_solo_age_min: c.rate_solo_age_min || '', rate_solo_age_max: c.rate_solo_age_max || '',
      rate_single_supplement: c.rate_single_supplement || '',
      rate_child_no_bed: c.rate_child_no_bed || '', rate_child_no_bed_age_min: c.rate_child_no_bed_age_min || '', rate_child_no_bed_age_max: c.rate_child_no_bed_age_max || '',
      rate_child: c.rate_child || '', rate_child_age_min: c.rate_child_age_min || '', rate_child_age_max: c.rate_child_age_max || '',
      rate_infant: c.rate_infant || '', rate_infant_age_min: c.rate_infant_age_min || '', rate_infant_age_max: c.rate_infant_age_max || '',
      inclusions: c.inclusions || '',
      exclusions: c.exclusions || '',
      cancellation_policy: c.cancellation_policy || '',
      itinerary: c.itinerary || '',
      terms_conditions: c.terms_conditions || '',
      optional_tours: c.optional_tours || '',
      flight_details: c.flight_details || '',
      hotel_details: c.hotel_details || '',
      remarks: c.remarks || '',
      travel_dates: c.travel_dates || [],
      status: c.status || 'draft',
    });
    setActiveTab('info');
  };

  const startNew = () => {
    setSelectedCollective(null);
    setIsNew(true);
    setForm(BLANK());
    setSaved(false);
    setActiveTab('ai_import');
  };

  const handleSave = async () => {
    if (!form.name || !form.destination) return;
    setSaving(true);
    const payload = buildPayload(form);
    let saved_c;
    if (selectedCollective?.id) {
      saved_c = await base44.entities.Collective.update(selectedCollective.id, payload);
    } else {
      saved_c = await base44.entities.Collective.create(payload);
      setSelectedCollective(saved_c);
      setIsNew(false);
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    if (onCollectivesChange) onCollectivesChange();
  };

  const handleDelete = async (c) => {
    await base44.entities.Collective.delete(c.id);
    if (selectedCollective?.id === c.id) {
      setSelectedCollective(null);
      setIsNew(false);
      setForm(BLANK());
    }
    setConfirmDelete(null);
    if (onCollectivesChange) onCollectivesChange();
  };

  const handleAIParsed = (parsed) => {
    setForm(prev => ({
      ...prev,
      name: parsed.name || prev.name,
      destination: parsed.destination || prev.destination,
      travel_type: parsed.travel_type || prev.travel_type,
      operator_name: parsed.operator_name || prev.operator_name,
      departure_date: parsed.departure_date || prev.departure_date,
      return_date: parsed.return_date || prev.return_date,
      total_slots: parsed.total_slots || prev.total_slots,
      selling_price: parsed.selling_price || prev.selling_price,
      base_price_foreign: parsed.base_price || parsed.selling_price || prev.base_price_foreign,
      commission_amount: parsed.commission_amount || prev.commission_amount,
      downpayment_required: parsed.downpayment_required || prev.downpayment_required,
      flight_details: parsed.flight_details || prev.flight_details,
      hotel_details: parsed.hotel_details || prev.hotel_details,
      inclusions: parsed.inclusions || prev.inclusions,
      exclusions: parsed.exclusions || prev.exclusions,
      terms_conditions: parsed.terms_conditions || prev.terms_conditions,
      cancellation_policy: parsed.cancellation_policy || prev.cancellation_policy,
      optional_tours: parsed.optional_tours || prev.optional_tours,
      remarks: parsed.remarks || prev.remarks,
      guaranteed_departure: parsed.guaranteed_departure !== undefined ? parsed.guaranteed_departure : prev.guaranteed_departure,
      status: parsed.status || prev.status,
      itinerary: parsed.itinerary || prev.itinerary,
    }));
    setActiveTab('info');
  };

  const handleGenerateWorkflow = async () => {
    if (!selectedCollective?.id) return;
    setGeneratingWorkflow(true);
    await base44.functions.invoke('autoGenerateWorkflow', { collective_id: selectedCollective.id });
    setGeneratingWorkflow(false);
    navigate(`/workflow?collective=${selectedCollective.id}`);
  };

  const getCoverImage = (id) => {
    const assets = (marketingAssets || []).filter(a => a.collective_id === id && a.file_url);
    return (assets.find(a => a.status === 'published') || assets[0])?.file_url || null;
  };

  const filtered = (collectives || []).filter(c => {
    const q = search.toLowerCase();
    const matchSearch = !search || c.name?.toLowerCase().includes(q) || c.destination?.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // Completion validation
  const hasRates = !!(form.rate_twin || form.rate_triple || form.rate_quad || form.rate_single || form.rate_solo || form.rate_child_no_bed || form.rate_child || form.rate_infant);
  const hasSlots = form.slots_for_confirmation || (Number(form.total_slots) > 0);
  const hasItinerary = !!(form.itinerary && form.itinerary.trim());
  const hasTerms = !!(form.terms_conditions && form.terms_conditions.trim());
  const completionItems = [
    { key: 'rates', label: 'Rates', done: hasRates, tab: 'pricing_dates' },
    { key: 'slots', label: 'Slots', done: hasSlots, tab: 'info' },
    { key: 'itinerary', label: 'Itinerary', done: hasItinerary, tab: 'itinerary' },
    { key: 'terms', label: 'Terms', done: hasTerms, tab: 'terms' },
  ];
  const completionPct = Math.round((completionItems.filter(i => i.done).length / completionItems.length) * 100);

  const isEditorVisible = selectedCollective || isNew;
  const [showList, setShowList] = useState(true);

  return (
    <div className="flex h-full min-h-[700px] bg-background rounded-xl border border-border overflow-hidden">

      {/* ── LEFT: Collective List Panel ── */}
      <div className={cn(
        "flex-shrink-0 flex flex-col border-r border-border bg-card transition-all",
        showList ? "w-64" : "w-0 overflow-hidden",
        "md:w-64 md:overflow-visible"
      )}>
        <div className="px-3 py-3 border-b border-border space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Collectives</span>
            <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">{(collectives || []).length}</span>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              className="w-full pl-8 pr-3 py-1.5 bg-muted/50 border border-border rounded-lg text-[11px] outline-none focus:border-amber-400 transition-colors placeholder:text-muted-foreground/60"
              placeholder="Search collectives…"
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
          <Button size="sm" className="w-full h-7 text-xs gradient-gold text-white border-0 gap-1" onClick={startNew}>
            <Plus className="w-3 h-3" /> New Collective
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">No collectives found</div>
          ) : (
            filtered.map(c => (
              <CollectiveListItem
                key={c.id}
                c={c}
                isSelected={selectedCollective?.id === c.id}
                onSelect={loadCollective}
                onDelete={c => setConfirmDelete(c)}
                coverImage={getCoverImage(c.id)}
              />
            ))
          )}
        </div>
      </div>

      {/* ── RIGHT: Editor ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {!isEditorVisible ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-8">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/20 flex items-center justify-center">
              <Globe className="w-8 h-8 text-amber-500" />
            </div>
            <div>
              <h3 className="font-bold text-lg font-jakarta text-foreground">Collective Workspace</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                Select a collective to edit, or create a new one. Use AI Smart Import to auto-populate from operator documents.
              </p>
            </div>
            <Button size="sm" className="gradient-gold text-white border-0 gap-1.5 text-xs" onClick={startNew}>
              <Plus className="w-3.5 h-3.5" /> New Collective
            </Button>
          </div>
        ) : (
          <>
            {/* Topbar */}
            <div className="flex items-center justify-between px-3 md:px-5 py-3 border-b border-border bg-card/80 flex-shrink-0 gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <button
                  onClick={() => setShowList(v => !v)}
                  className="md:hidden p-1.5 rounded hover:bg-muted text-muted-foreground flex-shrink-0"
                  title="Toggle list"
                >
                  <Menu className="w-4 h-4" />
                </button>
                <div className="min-w-0">
                  <h3 className="font-bold text-sm font-jakarta text-foreground truncate">
                    {form.name || 'New Collective'}
                  </h3>
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1.5 flex-wrap">
                    {selectedCollective && <code className="font-mono bg-muted px-1.5 py-0.5 rounded">{generateRefCode(selectedCollective)}</code>}
                    {form.destination && <span>{form.destination}</span>}
                    {sellingPrice > 0 && <span className="text-amber-600 font-semibold">₱{sellingPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}/pax</span>}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Select value={form.status} onValueChange={v => setF('status', v)}>
                  <SelectTrigger className="h-7 text-[11px] w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                      <SelectItem key={k} value={k} className="text-xs">{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {autoSaved && <span className="text-[10px] text-emerald-600 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Auto-saved</span>}
                {(selectedCollective || form) && (
                  <CopyPackageButton pkg={{ ...selectedCollective, ...form }} size="sm" variant="outline" className="h-7 text-xs gap-1" />
                )}
                {selectedCollective?.id && (
                  <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={handleGenerateWorkflow} disabled={generatingWorkflow}>
                    <GitBranch className="w-3 h-3" /> {generatingWorkflow ? 'Starting...' : 'Workflow'}
                  </Button>
                )}
                <Button
                  size="sm"
                  className={cn("h-7 text-xs gap-1 text-white", saved ? "bg-emerald-600 hover:bg-emerald-700" : "gradient-gold border-0")}
                  onClick={handleSave}
                  disabled={saving || !form.name}
                >
                  {saving ? <RefreshCw className="w-3 h-3 animate-spin" /> : saved ? <CheckCircle className="w-3 h-3" /> : <Save className="w-3 h-3" />}
                  {saving ? 'Saving…' : saved ? 'Saved!' : selectedCollective?.id ? 'Update' : 'Create'}
                </Button>
              </div>
            </div>

            {/* Pricing Banner */}
            {sellingPrice > 0 && (
              <div className="px-5 py-2 bg-gradient-to-r from-amber-500/10 to-orange-500/5 border-b border-amber-200/50 dark:border-amber-700/30 flex flex-wrap items-center gap-4 flex-shrink-0">
                <div className="flex items-center gap-3">
                  {form.currency !== 'PHP' && baseForeign > 0 && (
                    <>
                      <span className="text-xs text-muted-foreground">{currSymbol}{baseForeign.toLocaleString()} × {exRate}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-xs font-semibold text-sky-700">₱{basePHP.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                    </>
                  )}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-muted-foreground">Selling Price</span>
                    <span className="text-sm font-black text-amber-600 font-jakarta">₱{sellingPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground ml-auto flex-wrap">
                  <span>Margin: <strong className="text-foreground">{grossMargin}%</strong></span>
                  <span>DP: <strong className="text-foreground">₱{Number(form.downpayment_required).toLocaleString()}</strong></span>
                  <span>Pax: <strong className="text-foreground">{form.total_slots}</strong></span>
                  {form.rate_twin && <span>Twin: <strong className="text-amber-600">₱{Number(form.rate_twin).toLocaleString()}</strong></span>}
                </div>
              </div>
            )}

            {/* Completion Checklist */}
            <div className={cn("px-5 py-2 border-b border-border flex flex-wrap items-center gap-3 flex-shrink-0", completionPct === 100 ? "bg-emerald-50 dark:bg-emerald-950/20" : "bg-amber-50/60 dark:bg-amber-950/10")}>
              <span className="text-[10px] font-semibold text-muted-foreground whitespace-nowrap">Publication Checklist:</span>
              {completionItems.map(item => (
                <button key={item.key} onClick={() => setActiveTab(item.tab)}
                  className={cn("flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border transition-colors",
                    item.done ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200"
                  )}
                >
                  <span>{item.done ? '✓' : '⚠'}</span> {item.label}
                </button>
              ))}
              <span className={cn("ml-auto text-[10px] font-bold", completionPct === 100 ? "text-emerald-600" : "text-amber-600")}>{completionPct}% Ready</span>
            </div>

            {/* Tabs */}
            <EditorTabs active={activeTab} onChange={setActiveTab} collective={selectedCollective} />

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-5">

              {/* ── AI IMPORT ── */}
              {activeTab === 'ai_import' && (
                <div className="max-w-2xl mx-auto">
                  <AISmartImport
                    onParsed={handleAIParsed}
                    onClose={() => setActiveTab('info')}
                  />
                </div>
              )}

              {/* ── PACKAGE INFO ── */}
              {activeTab === 'info' && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <F label="Collective Name *" className="col-span-2">
                    <Input placeholder="e.g. Japan Cherry Blossom 2026" value={form.name} onChange={e => setF('name', e.target.value)} className={cn("h-9 text-sm", !form.name && 'border-amber-300')} />
                  </F>
                  <F label="Travel Type">
                    <Select value={form.travel_type} onValueChange={v => setF('travel_type', v)}>
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="domestic">🏠 Domestic</SelectItem>
                        <SelectItem value="international">🌍 International</SelectItem>
                      </SelectContent>
                    </Select>
                  </F>
                  <F label="Destination *">
                    <Input placeholder="e.g. Tokyo, Japan" value={form.destination} onChange={e => setF('destination', e.target.value)} className="h-9" />
                  </F>
                  <F label="Operator / DMC">
                    <Input placeholder="Tour operator name" value={form.operator_name} onChange={e => setF('operator_name', e.target.value)} className="h-9" />
                  </F>
                  <F label="No. of Nights">
                    <Input type="number" placeholder="e.g. 5" value={form.nights} onChange={e => setF('nights', e.target.value)} className="h-9" />
                  </F>
                  <F label="Departure Date">
                    <Input type="date" value={form.departure_date} onChange={e => setF('departure_date', e.target.value)} className="h-9" />
                  </F>
                  <F label="Return Date">
                    <Input type="date" value={form.return_date} onChange={e => setF('return_date', e.target.value)} className="h-9" />
                  </F>
                  <F label="Slot Allocation">
                    <div className="space-y-2">
                      <Input type="number" placeholder="e.g. 30" value={form.total_slots} onChange={e => setF('total_slots', Number(e.target.value))} className={cn("h-9", form.slots_for_confirmation && 'opacity-40 pointer-events-none')} disabled={form.slots_for_confirmation} />
                      <button
                        type="button"
                        onClick={() => setF('slots_for_confirmation', !form.slots_for_confirmation)}
                        className={cn("flex items-center gap-2 w-full px-3 py-1.5 rounded-md border text-xs font-medium transition-all",
                          form.slots_for_confirmation ? "bg-amber-500 text-white border-amber-500" : "bg-muted/50 text-muted-foreground border-border hover:border-amber-400")}
                      >
                        <span className={cn("w-3 h-3 rounded-full border-2 flex-shrink-0", form.slots_for_confirmation ? "bg-white border-white" : "border-muted-foreground")} />
                        For Confirmation
                      </button>
                    </div>
                  </F>
                  <F label="Booked Pax">
                    <Input type="number" value={form.booked_pax} onChange={e => setF('booked_pax', Number(e.target.value))} className="h-9" />
                  </F>
                  <F label="Guaranteed Departure" className="flex flex-col justify-end">
                    <button
                      type="button"
                      onClick={() => setF('guaranteed_departure', !form.guaranteed_departure)}
                      className={cn("flex items-center gap-2 w-full px-3 py-2 rounded-md border text-xs font-medium transition-all h-9",
                        form.guaranteed_departure ? "bg-emerald-500 text-white border-emerald-500" : "bg-muted/50 text-muted-foreground border-border hover:border-emerald-400")}
                    >
                      <span className={cn("w-3 h-3 rounded-full border-2 flex-shrink-0", form.guaranteed_departure ? "bg-white border-white" : "border-muted-foreground")} />
                      {form.guaranteed_departure ? 'Guaranteed ✓' : 'Not Guaranteed'}
                    </button>
                  </F>
                  <F label="Flight Details" className="col-span-2 md:col-span-3">
                    <Input placeholder="e.g. PR 405 MNL-NRT · PR 406 NRT-MNL" value={form.flight_details} onChange={e => setF('flight_details', e.target.value)} className="h-9" />
                  </F>
                  <F label="Hotel Details" className="col-span-2 md:col-span-3">
                    <Textarea rows={2} placeholder="Hotel names, categories, check-in/out..." value={form.hotel_details} onChange={e => setF('hotel_details', e.target.value)} className="text-xs resize-none" />
                  </F>
                </div>
              )}

              {/* ── PRICING & DATES ── */}
              {activeTab === 'pricing_dates' && (
                <PricingDatesManager
                  form={form} setF={setF}
                  basePHP={basePHP} markupPHP={markupPHP} sellingPrice={sellingPrice} grossMargin={grossMargin}
                  currency={form.currency} baseForeign={baseForeign} exRate={exRate}
                  travelDates={form.travel_dates || []}
                  onChangeDates={dates => setF('travel_dates', dates)}
                />
              )}

              {/* ── CONTENT / INCLUSIONS ── */}
              {activeTab === 'content' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <F label="✔ Inclusions">
                    <Textarea rows={6} placeholder={"• Round-trip airfare\n• Hotel accommodation\n• Daily breakfast"} value={form.inclusions} onChange={e => setF('inclusions', e.target.value)} className="text-xs font-mono resize-none" />
                  </F>
                  <F label="✘ Exclusions">
                    <Textarea rows={6} placeholder={"• Visa fees\n• Personal expenses\n• Travel insurance"} value={form.exclusions} onChange={e => setF('exclusions', e.target.value)} className="text-xs font-mono resize-none" />
                  </F>
                  <F label="Optional Tours">
                    <Textarea rows={3} placeholder="List optional add-on tours..." value={form.optional_tours} onChange={e => setF('optional_tours', e.target.value)} className="text-xs resize-none" />
                  </F>
                  <F label="Cancellation Policy">
                    <Textarea rows={3} placeholder="Cancellation terms..." value={form.cancellation_policy} onChange={e => setF('cancellation_policy', e.target.value)} className="text-xs resize-none" />
                  </F>
                  <F label="Remarks" className="md:col-span-2">
                    <Textarea rows={2} value={form.remarks} onChange={e => setF('remarks', e.target.value)} className="text-xs resize-none" />
                  </F>
                </div>
              )}

              {/* ── ITINERARY ── */}
              {activeTab === 'itinerary' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-foreground">Day-by-Day Itinerary</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Required before package publication.</p>
                    </div>
                    {form.itinerary
                      ? <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-semibold">✓ Filled</span>
                      : <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-semibold">⚠ Required</span>
                    }
                  </div>
                  <Textarea
                    rows={20}
                    placeholder={"Day 1 – Arrival\n• Arrive at [Airport], check-in at hotel\n• Welcome dinner\n\nDay 2 – City Tour\n• Breakfast at hotel\n• Morning: Visit [landmark]\n• Afternoon: Shopping at [area]"}
                    value={form.itinerary}
                    onChange={e => setF('itinerary', e.target.value)}
                    className="text-xs font-mono resize-none min-h-[400px]"
                  />
                </div>
              )}

              {/* ── TERMS ── */}
              {activeTab === 'terms' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-foreground">Terms & Conditions</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Required before package publication.</p>
                    </div>
                    {form.terms_conditions
                      ? <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-semibold">✓ Filled</span>
                      : <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-semibold">⚠ Required</span>
                    }
                  </div>
                  <Textarea
                    rows={20}
                    placeholder={"1. BOOKING & PAYMENT\n• A downpayment of [amount] is required to confirm the booking.\n\n2. CANCELLATION POLICY\n• Cancellations made [X] days before: [refund policy]\n\n3. GENERAL CONDITIONS\n..."}
                    value={form.terms_conditions}
                    onChange={e => setF('terms_conditions', e.target.value)}
                    className="text-xs font-mono resize-none min-h-[400px]"
                  />
                </div>
              )}

              {/* ── WORKFLOW ── */}
              {activeTab === 'workflow' && selectedCollective?.id && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-foreground">Workflow & Operations</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Department task tracking and lifecycle management.</p>
                    </div>
                    <WorkflowProgressBadge collective={selectedCollective} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-muted/30 rounded-lg border border-border p-4 text-center">
                      <p className="text-xs text-muted-foreground mb-1">Phase</p>
                      <p className="text-2xl font-bold font-jakarta text-amber-600">{selectedCollective.current_phase || 1}</p>
                      <p className="text-xs text-muted-foreground">of 7</p>
                    </div>
                    <div className="bg-muted/30 rounded-lg border border-border p-4 text-center">
                      <p className="text-xs text-muted-foreground mb-1">Stage</p>
                      <p className="text-2xl font-bold font-jakarta text-sky-600">{selectedCollective.current_stage || 1}</p>
                      <p className="text-xs text-muted-foreground">of 15</p>
                    </div>
                    <div className="bg-muted/30 rounded-lg border border-border p-4 text-center">
                      <p className="text-xs text-muted-foreground mb-1">Completion</p>
                      <p className="text-2xl font-bold font-jakarta text-emerald-600">{selectedCollective.checklist_completion || 0}%</p>
                      <p className="text-xs text-muted-foreground">checklist</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button className="gradient-gold text-white border-0 gap-2" onClick={() => navigate(`/workflow?collective=${selectedCollective.id}`)}>
                      <Eye className="w-4 h-4" /> Open Full Workflow
                    </Button>
                    <Button variant="outline" className="gap-2" onClick={handleGenerateWorkflow} disabled={generatingWorkflow}>
                      <GitBranch className="w-4 h-4" /> {generatingWorkflow ? 'Generating...' : 'Regenerate Workflow'}
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Raw Package JSON Viewer */}
            {selectedCollective && (
              <div className="px-5 pb-4 flex-shrink-0">
                <RawPackageJSON pkg={selectedCollective} />
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Confirm Delete ── */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-xl shadow-2xl p-6 max-w-sm w-full space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-950/30 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-foreground">Delete Collective?</h3>
                <p className="text-xs text-muted-foreground mt-0.5">This will permanently delete <strong>{confirmDelete.name}</strong>.</p>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setConfirmDelete(null)}>Cancel</Button>
              <Button size="sm" className="bg-rose-600 hover:bg-rose-700 text-white" onClick={() => handleDelete(confirmDelete)}>Delete</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}