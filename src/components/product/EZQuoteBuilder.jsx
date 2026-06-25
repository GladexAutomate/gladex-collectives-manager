// @ts-nocheck
import { useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, Trash2, Save, RefreshCw, ChevronDown, ChevronUp, CheckCircle, ArrowRight, Calculator, FileText, Plane, Hotel, Users, DollarSign, Info, TrendingUp } from 'lucide-react';
import SmartPackagePad from '@/components/product/SmartPackagePad';
import AvailabilityRatesPricing from '@/components/product/AvailabilityRatesPricing';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

// ─── Constants ────────────────────────────────────────────────────────────────

const CURRENCIES = [
  { value: 'PHP', symbol: '₱', label: 'PHP – Philippine Peso' },
  { value: 'USD', symbol: '$', label: 'USD – US Dollar' },
  { value: 'EUR', symbol: '€', label: 'EUR – Euro' },
  { value: 'JPY', symbol: '¥', label: 'JPY – Japanese Yen' },
  { value: 'KRW', symbol: '₩', label: 'KRW – Korean Won' },
  { value: 'SGD', symbol: 'S$', label: 'SGD – Singapore Dollar' },
  { value: 'HKD', symbol: 'HK$', label: 'HKD – Hong Kong Dollar' },
  { value: 'AUD', symbol: 'A$', label: 'AUD – Australian Dollar' },
];

const HOTEL_CATEGORIES = [
  { value: 'budget',   label: '🏨 Budget',   stars: 2 },
  { value: 'standard', label: '🏨 Standard',  stars: 3 },
  { value: 'deluxe',   label: '🏨 Deluxe',   stars: 3 },
  { value: '4star',    label: '⭐ 4-Star',   stars: 4 },
  { value: '5star',    label: '⭐ 5-Star',   stars: 5 },
  { value: 'luxury',   label: '👑 Luxury',   stars: 5 },
];

const ROOM_TYPES = [
  { key: 'twin',    label: 'Twin Sharing',    desc: '2 pax per room' },
  { key: 'triple',  label: 'Triple Sharing',  desc: '3 pax per room' },
  { key: 'quad',    label: 'Quad Sharing',    desc: '4 pax per room' },
  { key: 'solo',    label: 'Single/Solo',     desc: 'Single occupancy supplement' },
];

const SPECIAL_RATES = [
  { key: 'child_no_bed', label: 'Child w/o Bed', desc: '6 y/o below, max 1.1m ht.' },
  { key: 'child_bed',    label: 'Child w/ Bed',  desc: 'Adult & child with bed' },
  { key: 'child_rate',   label: 'Child Rate',    desc: '6 y/o below' },
  { key: 'infant',       label: 'Infant Fee',    desc: 'Estimated infant fee' },
];

const TRAVEL_TYPES = ['domestic', 'international'];

const BLANK_HOTEL_ROW = () => ({
  id: Date.now() + Math.random(),
  category: 'standard',
  hotel_name: '',
  location: '',
  twin: '',
  triple: '',
  quad: '',
  solo: '',
  child_no_bed: '',
  child_bed: '',
  child_rate: '',
  infant: '',
  notes: '',
});

const BLANK_QUOTE = () => ({
  package_name: '',
  destination: '',
  travel_type: 'international',
  operator_name: '',
  departure_date: '',
  return_date: '',
  nights: '',
  pax_estimate: 20,
  currency: 'USD',
  exchange_rate: 57,
  base_cost_foreign: '',
  markup_php: 0,
  markup_pct: 0,
  commission_per_pax: 0,
  downpayment_required: 0,
  guaranteed_departure_pax: 0,
  inclusions: '',
  exclusions: '',
  cancellation_policy: '',
  optional_tours: '',
  flight_details: '',
  remarks: '',
  hotel_rows: [BLANK_HOTEL_ROW()],
  use_markup_pct: false,
});

// ─── Inline editable cell ──────────────────────────────────────────────────────

function NumCell({ value, onChange, className, prefix = '₱', readOnly = false }) {
  const [editing, setEditing] = useState(false);
  if (readOnly) {
    return (
      <div className={cn("px-2 py-1 text-right text-xs font-medium tabular-nums", className)}>
        {prefix}{Number(value || 0).toLocaleString()}
      </div>
    );
  }
  return editing ? (
    <input
      autoFocus
      type="number"
      defaultValue={value}
      className="w-full px-2 py-1 text-xs text-right bg-amber-50 dark:bg-amber-950/30 border border-amber-400 rounded outline-none tabular-nums"
      onBlur={e => { onChange(Number(e.target.value)); setEditing(false); }}
      onKeyDown={e => { if (e.key === 'Enter') e.target.blur(); if (e.key === 'Escape') setEditing(false); }}
    />
  ) : (
    <div
      className={cn("px-2 py-1 text-right text-xs cursor-pointer hover:bg-amber-50 dark:hover:bg-amber-950/20 rounded tabular-nums transition-colors group", className)}
      onClick={() => setEditing(true)}
    >
      <span className="text-muted-foreground group-hover:text-foreground">
        {value ? `${prefix}${Number(value).toLocaleString()}` : <span className="text-muted-foreground/40">—</span>}
      </span>
    </div>
  );
}

function TextCell({ value, onChange, placeholder = '' }) {
  const [editing, setEditing] = useState(false);
  return editing ? (
    <input
      autoFocus
      type="text"
      defaultValue={value}
      placeholder={placeholder}
      className="w-full px-2 py-1 text-xs bg-sky-50 dark:bg-sky-950/30 border border-sky-400 rounded outline-none"
      onBlur={e => { onChange(e.target.value); setEditing(false); }}
      onKeyDown={e => { if (e.key === 'Enter') e.target.blur(); if (e.key === 'Escape') setEditing(false); }}
    />
  ) : (
    <div
      className="px-2 py-1 text-xs cursor-pointer hover:bg-sky-50 dark:hover:bg-sky-950/20 rounded truncate transition-colors"
      onClick={() => setEditing(true)}
    >
      {value || <span className="text-muted-foreground/40">{placeholder || '—'}</span>}
    </div>
  );
}

// ─── Section wrapper ────────────────────────────────────────────────────────────

function Section({ title, icon: Icon, iconColor = 'text-primary', children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-muted/30 transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex items-center gap-2">
          <Icon className={cn("w-4 h-4", iconColor)} />
          <span className="font-semibold text-sm font-jakarta text-foreground">{title}</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>
      {open && <div className="px-5 pb-5 pt-1">{children}</div>}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function EZQuoteBuilder({ collectives }) {
  const [quote, setQuote] = useState(BLANK_QUOTE());
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [savedId, setSavedId] = useState(null);
  const [activeTemplate, setActiveTemplate] = useState('');

  const setQ = useCallback((key, val) => setQuote(prev => ({ ...prev, [key]: val })), []);

  // ── Hotel row helpers ──
  const updateHotelRow = (id, key, val) =>
    setQ('hotel_rows', quote.hotel_rows.map(r => r.id === id ? { ...r, [key]: val } : r));
  const addHotelRow = () => setQ('hotel_rows', [...quote.hotel_rows, BLANK_HOTEL_ROW()]);
  const removeHotelRow = (id) => setQ('hotel_rows', quote.hotel_rows.filter(r => r.id !== id));

  // ── Computed pricing ──
  const currSymbol = CURRENCIES.find(c => c.value === quote.currency)?.symbol || '$';
  const baseForeign = Number(quote.base_cost_foreign) || 0;
  const exRate = Number(quote.exchange_rate) || 1;
  const basePHP = quote.currency === 'PHP' ? baseForeign : baseForeign * exRate;

  const markupPHP = quote.use_markup_pct
    ? basePHP * (Number(quote.markup_pct) / 100)
    : Number(quote.markup_php) || 0;

  const sellingPrice = basePHP + markupPHP;
  const balance = sellingPrice - Number(quote.downpayment_required);
  const estRevenue = sellingPrice * Number(quote.pax_estimate || 0);
  const estCommission = Number(quote.commission_per_pax) * Number(quote.pax_estimate || 0);
  const netRevenue = estRevenue - estCommission;
  const grossMargin = sellingPrice > 0 ? ((markupPHP / sellingPrice) * 100).toFixed(1) : 0;

  // ── Load from existing collective or partial data ──
  const loadFromCollective = useCallback((c) => {
    // If called from toolbar dropdown (passes id string)
    if (typeof c === 'string') {
      c = collectives.find(x => x.id === c);
      if (!c) return;
    }
    // Partial import (from SmartPad raw text parse)
    if (c && c._partial) {
      const { _partial: _p, ...partial } = c;
      setQuote(prev => ({ ...prev, ...partial }));
      setSaved(false);
      return;
    }
    setActiveTemplate(c.id);
    setSavedId(null);
    setQuote(prev => ({
      ...prev,
      package_name: c.name || '',
      destination: c.destination || '',
      travel_type: c.travel_type || 'international',
      operator_name: c.operator_name || '',
      departure_date: c.departure_date || '',
      return_date: c.return_date || '',
      nights: c.nights || '',
      pax_estimate: c.total_slots || prev.pax_estimate,
      guaranteed_departure_pax: c.guaranteed_departure || 0,
      currency: c.base_price_currency || 'USD',
      exchange_rate: c.exchange_rate || 57,
      base_cost_foreign: c.base_price_foreign || '',
      markup_php: c.markup_amount || 0,
      commission_per_pax: c.commission_amount || 0,
      downpayment_required: c.downpayment_required || 0,
      inclusions: c.inclusions || '',
      exclusions: c.exclusions || '',
      cancellation_policy: c.cancellation_policy || '',
      optional_tours: c.optional_tours || '',
      flight_details: c.flight_details || '',
      remarks: c.remarks || '',
    }));
    setSaved(false);
  }, [collectives]);

  // ── Save to Collectives DB ──
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
      status: 'draft',
    };

    let id = savedId || activeTemplate;
    if (id) {
      await base44.entities.Collective.update(id, payload);
    } else {
      const created = await base44.entities.Collective.create(payload);
      id = created.id;
      setSavedId(id);
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleReset = () => {
    setQuote(BLANK_QUOTE());
    setActiveTemplate('');
    setSavedId(null);
    setSaved(false);
  };

  return (
    <div className="space-y-4">
      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-card rounded-xl border border-border px-4 py-3 shadow-sm">
        <div className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-primary" />
          <span className="font-bold font-jakarta text-foreground">EZQuote Builder</span>
          <Badge className="bg-amber-100 text-amber-700 text-[10px]">Auto-Compute</Badge>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Load from existing */}
          <Select value={activeTemplate} onValueChange={(id) => loadFromCollective(id)}>
            <SelectTrigger className="h-8 text-xs w-52">
              <SelectValue placeholder="📂 Load from package..." />
            </SelectTrigger>
            <SelectContent>
              {collectives.map(c => (
                <SelectItem key={c.id} value={c.id} className="text-xs">{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5" onClick={handleReset}>
            <RefreshCw className="w-3 h-3" /> New Quote
          </Button>
          <Button
            size="sm"
            className={cn("h-8 text-xs gap-1.5 text-white", saved ? "bg-emerald-600 hover:bg-emerald-700" : "gradient-gold border-0")}
            onClick={handleSave}
            disabled={saving || !quote.package_name}
          >
            {saving ? <RefreshCw className="w-3 h-3 animate-spin" /> : saved ? <CheckCircle className="w-3 h-3" /> : <Save className="w-3 h-3" />}
            {saving ? 'Saving...' : saved ? 'Saved!' : savedId || activeTemplate ? 'Update Package' : 'Save to Collectives'}
          </Button>
        </div>
      </div>

      {/* ── Smart Package Pad ── */}
      <SmartPackagePad collectives={collectives} onLoadPackage={loadFromCollective} />

      {/* ── 1. Package Info ── */}
      <Section title="Package Information" icon={Plane} iconColor="text-sky-500">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
          <div className="sm:col-span-2 lg:col-span-2 space-y-1.5">
            <Label className="text-xs font-medium">Package Name *</Label>
            <Input
              placeholder="e.g. Japan Cherry Blossom 2026"
              value={quote.package_name}
              onChange={e => setQ('package_name', e.target.value)}
              className={cn(!quote.package_name && 'border-amber-300 focus:border-amber-500')}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Travel Type</Label>
            <Select value={quote.travel_type} onValueChange={v => setQ('travel_type', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TRAVEL_TYPES.map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Destination *</Label>
            <Input placeholder="e.g. Tokyo, Japan" value={quote.destination} onChange={e => setQ('destination', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Operator / DMC</Label>
            <Input placeholder="Tour operator name" value={quote.operator_name} onChange={e => setQ('operator_name', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">No. of Nights</Label>
            <Input type="number" placeholder="e.g. 5" value={quote.nights} onChange={e => setQ('nights', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Departure Date</Label>
            <Input type="date" value={quote.departure_date} onChange={e => setQ('departure_date', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Return Date</Label>
            <Input type="date" value={quote.return_date} onChange={e => setQ('return_date', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Estimated Pax</Label>
            <Input type="number" value={quote.pax_estimate} onChange={e => setQ('pax_estimate', Number(e.target.value))} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Guaranteed Departure Pax</Label>
            <Input type="number" placeholder="Min pax to confirm trip" value={quote.guaranteed_departure_pax} onChange={e => setQ('guaranteed_departure_pax', Number(e.target.value))} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Flight Details</Label>
            <Input placeholder="e.g. PR 405 MNL-NRT" value={quote.flight_details} onChange={e => setQ('flight_details', e.target.value)} />
          </div>
        </div>
      </Section>

      {/* ── 2. Pricing Computation ── */}
      <Section title="Pricing Computation" icon={DollarSign} iconColor="text-amber-500">
        <div className="space-y-5 pt-2">
          {/* Base cost row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Base Currency</Label>
              <Select value={quote.currency} onValueChange={v => setQ('currency', v)}>
                <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{CURRENCIES.map(c => <SelectItem key={c.value} value={c.value} className="text-xs">{c.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Base Cost ({currSymbol})</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">{currSymbol}</span>
                <Input type="number" className="pl-7 h-9 text-xs" value={quote.base_cost_foreign} onChange={e => setQ('base_cost_foreign', e.target.value)} />
              </div>
            </div>
            {quote.currency !== 'PHP' && (
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Exchange Rate (→ PHP)</Label>
                <Input type="number" className="h-9 text-xs" placeholder="e.g. 57.50" value={quote.exchange_rate} onChange={e => setQ('exchange_rate', Number(e.target.value))} />
              </div>
            )}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-sky-600">= Base Cost PHP</Label>
              <div className="h-9 flex items-center px-3 bg-sky-50 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-800 rounded-lg">
                <span className="text-xs font-bold text-sky-700">₱{basePHP.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          {/* Markup row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Markup Type</Label>
              <Select value={quote.use_markup_pct ? 'pct' : 'fixed'} onValueChange={v => setQ('use_markup_pct', v === 'pct')}>
                <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed" className="text-xs">Fixed Amount (₱)</SelectItem>
                  <SelectItem value="pct" className="text-xs">Percentage (%)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">{quote.use_markup_pct ? 'Markup %' : 'Markup Amount (₱)'}</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{quote.use_markup_pct ? '%' : '₱'}</span>
                <Input
                  type="number"
                  className="pl-7 h-9 text-xs"
                  value={quote.use_markup_pct ? quote.markup_pct : quote.markup_php}
                  onChange={e => quote.use_markup_pct ? setQ('markup_pct', Number(e.target.value)) : setQ('markup_php', Number(e.target.value))}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">= Markup PHP</Label>
              <div className="h-9 flex items-center px-3 bg-muted rounded-lg">
                <span className="text-xs font-semibold text-foreground">₱{markupPHP.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-emerald-600">= Gross Margin</Label>
              <div className="h-9 flex items-center px-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                <span className="text-xs font-bold text-emerald-700">{grossMargin}%</span>
              </div>
            </div>
          </div>

          {/* Final price row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Commission / Pax (₱)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">₱</span>
                <Input type="number" className="pl-7 h-9 text-xs" value={quote.commission_per_pax} onChange={e => setQ('commission_per_pax', Number(e.target.value))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Required Downpayment (₱)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">₱</span>
                <Input type="number" className="pl-7 h-9 text-xs" value={quote.downpayment_required} onChange={e => setQ('downpayment_required', Number(e.target.value))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Balance (after DP)</Label>
              <div className="h-9 flex items-center px-3 bg-muted rounded-lg">
                <span className="text-xs font-semibold">₱{balance.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          {/* Selling Price Hero */}
          <div className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 p-px shadow-lg">
            <div className="rounded-[11px] bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40 p-4">
              <div className="flex flex-wrap items-center gap-4 justify-between">
                <div className="flex flex-wrap items-center gap-3">
                  {quote.currency !== 'PHP' && baseForeign > 0 && (
                    <>
                      <div className="text-center">
                        <p className="text-[10px] text-muted-foreground">Base ({currSymbol})</p>
                        <p className="text-sm font-bold text-foreground">{currSymbol}{baseForeign.toLocaleString()}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                      <div className="text-center">
                        <p className="text-[10px] text-muted-foreground">× {exRate} = PHP</p>
                        <p className="text-sm font-bold text-sky-700">₱{basePHP.toLocaleString(undefined, {maximumFractionDigits:0})}</p>
                      </div>
                    </>
                  )}
                  {markupPHP > 0 && (
                    <>
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                      <div className="text-center">
                        <p className="text-[10px] text-muted-foreground">+ Markup</p>
                        <p className="text-sm font-bold text-emerald-700">+₱{markupPHP.toLocaleString(undefined,{maximumFractionDigits:0})}</p>
                      </div>
                    </>
                  )}
                  <ArrowRight className="w-4 h-4 text-amber-600" />
                  <div className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl text-center shadow-md">
                    <p className="text-[10px] text-amber-100 font-medium">SELLING PRICE</p>
                    <p className="text-xl font-black text-white font-jakarta">₱{sellingPrice.toLocaleString(undefined,{maximumFractionDigits:0})}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="bg-white/60 dark:bg-card/60 rounded-lg px-3 py-2">
                    <p className="text-[9px] text-muted-foreground uppercase">Est. Revenue</p>
                    <p className="text-xs font-bold text-emerald-700">₱{(estRevenue/1000).toFixed(0)}K</p>
                  </div>
                  <div className="bg-white/60 dark:bg-card/60 rounded-lg px-3 py-2">
                    <p className="text-[9px] text-muted-foreground uppercase">Net Revenue</p>
                    <p className="text-xs font-bold text-emerald-600">₱{(netRevenue/1000).toFixed(0)}K</p>
                  </div>
                  <div className="bg-white/60 dark:bg-card/60 rounded-lg px-3 py-2">
                    <p className="text-[9px] text-muted-foreground uppercase">Downpayment</p>
                    <p className="text-xs font-bold text-amber-700">₱{Number(quote.downpayment_required).toLocaleString()}</p>
                  </div>
                  <div className="bg-white/60 dark:bg-card/60 rounded-lg px-3 py-2">
                    <p className="text-[9px] text-muted-foreground uppercase">Commission Total</p>
                    <p className="text-xs font-bold text-purple-700">₱{(estCommission/1000).toFixed(0)}K</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* ── 3. Availability Rates & Exchange Rate ── */}
      <Section title="Availability Rates & Exchange Rate" icon={TrendingUp} iconColor="text-amber-500">
        <div className="pt-2">
          <AvailabilityRatesPricing quote={quote} setQ={setQ} />
        </div>
      </Section>

      {/* ── 4. Hotel Category Pricing Table ── */}
      <Section title="Hotel Category Pricing Table" icon={Hotel} iconColor="text-purple-500">
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Info className="w-3.5 h-3.5" /> Click any cell to edit inline. Prices auto-compute against base cost.
            </p>
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={addHotelRow}>
              <Plus className="w-3 h-3" /> Add Row
            </Button>
          </div>

          {/* Desktop table */}
          <div className="hidden lg:block overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-muted/60 border-b border-border">
                  <th className="text-left px-3 py-2.5 font-semibold text-muted-foreground w-28">Category</th>
                  <th className="text-left px-3 py-2.5 font-semibold text-muted-foreground w-36">Hotel Name</th>
                  <th className="text-left px-3 py-2.5 font-semibold text-muted-foreground w-28">Location</th>
                  <th className="text-right px-3 py-2.5 font-semibold text-amber-700 w-24">Twin (₱)</th>
                  <th className="text-right px-3 py-2.5 font-semibold text-amber-700 w-24">Triple (₱)</th>
                  <th className="text-right px-3 py-2.5 font-semibold text-amber-700 w-24">Quad (₱)</th>
                  <th className="text-right px-3 py-2.5 font-semibold text-amber-700 w-24">Solo (₱)</th>
                  <th className="text-right px-3 py-2.5 font-semibold text-sky-700 w-24">Child NB (₱)</th>
                  <th className="text-right px-3 py-2.5 font-semibold text-sky-700 w-24">Child Bed (₱)</th>
                  <th className="text-right px-3 py-2.5 font-semibold text-sky-700 w-22">Infant (₱)</th>
                  <th className="w-8"></th>
                </tr>
              </thead>
              <tbody>
                {quote.hotel_rows.map((row, i) => (
                  <tr key={row.id} className={cn("border-b border-border last:border-0 hover:bg-muted/20 transition-colors", i % 2 === 0 ? "" : "bg-muted/10")}>
                    <td className="px-1 py-1">
                      <Select value={row.category} onValueChange={v => updateHotelRow(row.id, 'category', v)}>
                        <SelectTrigger className="h-7 text-[11px] border-0 bg-transparent">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {HOTEL_CATEGORIES.map(c => <SelectItem key={c.value} value={c.value} className="text-xs">{c.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-1 py-1"><TextCell value={row.hotel_name} placeholder="Hotel name" onChange={v => updateHotelRow(row.id, 'hotel_name', v)} /></td>
                    <td className="px-1 py-1"><TextCell value={row.location} placeholder="City/Area" onChange={v => updateHotelRow(row.id, 'location', v)} /></td>
                    <td className="px-1 py-1"><NumCell value={row.twin} onChange={v => updateHotelRow(row.id, 'twin', v)} /></td>
                    <td className="px-1 py-1"><NumCell value={row.triple} onChange={v => updateHotelRow(row.id, 'triple', v)} /></td>
                    <td className="px-1 py-1"><NumCell value={row.quad} onChange={v => updateHotelRow(row.id, 'quad', v)} /></td>
                    <td className="px-1 py-1"><NumCell value={row.solo} onChange={v => updateHotelRow(row.id, 'solo', v)} /></td>
                    <td className="px-1 py-1"><NumCell value={row.child_no_bed} onChange={v => updateHotelRow(row.id, 'child_no_bed', v)} /></td>
                    <td className="px-1 py-1"><NumCell value={row.child_bed} onChange={v => updateHotelRow(row.id, 'child_bed', v)} /></td>
                    <td className="px-1 py-1"><NumCell value={row.infant} onChange={v => updateHotelRow(row.id, 'infant', v)} /></td>
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

          {/* Mobile cards */}
          <div className="lg:hidden space-y-3">
            {quote.hotel_rows.map((row, i) => (
              <div key={row.id} className="bg-card rounded-lg border border-border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <Select value={row.category} onValueChange={v => updateHotelRow(row.id, 'category', v)}>
                    <SelectTrigger className="h-8 text-xs w-36"><SelectValue /></SelectTrigger>
                    <SelectContent>{HOTEL_CATEGORIES.map(c => <SelectItem key={c.value} value={c.value} className="text-xs">{c.label}</SelectItem>)}</SelectContent>
                  </Select>
                  {quote.hotel_rows.length > 1 && (
                    <button onClick={() => removeHotelRow(row.id)} className="text-rose-400 hover:text-rose-600 p-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[10px]">Hotel Name</Label>
                    <Input className="h-8 text-xs" value={row.hotel_name} onChange={e => updateHotelRow(row.id, 'hotel_name', e.target.value)} placeholder="Hotel name" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px]">Location</Label>
                    <Input className="h-8 text-xs" value={row.location} onChange={e => updateHotelRow(row.id, 'location', e.target.value)} placeholder="City" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: 'twin', label: 'Twin (₱)' },
                    { key: 'triple', label: 'Triple (₱)' },
                    { key: 'quad', label: 'Quad (₱)' },
                    { key: 'solo', label: 'Solo (₱)' },
                    { key: 'child_no_bed', label: 'Child NB (₱)' },
                    { key: 'child_bed', label: 'Child Bed (₱)' },
                    { key: 'infant', label: 'Infant (₱)' },
                  ].map(f => (
                    <div key={f.key} className="space-y-1">
                      <Label className="text-[10px]">{f.label}</Label>
                      <Input
                        type="number"
                        className="h-8 text-xs"
                        value={row[f.key] || ''}
                        onChange={e => updateHotelRow(row.id, f.key, Number(e.target.value))}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <Button size="sm" variant="outline" className="w-full text-xs gap-1" onClick={addHotelRow}>
              <Plus className="w-3 h-3" /> Add Hotel Category Row
            </Button>
          </div>
        </div>
      </Section>

      {/* ── 4. Inclusions & Terms ── */}
      <Section title="Inclusions, Exclusions & Terms" icon={FileText} iconColor="text-teal-500" defaultOpen={false}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-emerald-700">✔ Inclusions</Label>
            <Textarea
              rows={5}
              placeholder={"• Round-trip airfare\n• Hotel accommodation\n• Daily breakfast\n• City tours\n• Airport transfers"}
              value={quote.inclusions}
              onChange={e => setQ('inclusions', e.target.value)}
              className="text-xs font-mono resize-none"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-rose-700">✘ Exclusions</Label>
            <Textarea
              rows={5}
              placeholder={"• Visa fees\n• Personal expenses\n• Optional tours\n• Excess baggage\n• Travel insurance"}
              value={quote.exclusions}
              onChange={e => setQ('exclusions', e.target.value)}
              className="text-xs font-mono resize-none"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Optional Tours</Label>
            <Textarea rows={3} placeholder="List optional add-on tours..." value={quote.optional_tours} onChange={e => setQ('optional_tours', e.target.value)} className="text-xs resize-none" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Cancellation Policy</Label>
            <Textarea rows={3} placeholder="Cancellation terms..." value={quote.cancellation_policy} onChange={e => setQ('cancellation_policy', e.target.value)} className="text-xs resize-none" />
          </div>
          <div className="md:col-span-2 space-y-1.5">
            <Label className="text-xs font-medium">Remarks / Additional Notes</Label>
            <Textarea rows={2} value={quote.remarks} onChange={e => setQ('remarks', e.target.value)} className="text-xs resize-none" />
          </div>
        </div>
      </Section>

      {/* ── 5. Quote Summary Sheet ── */}
      {sellingPrice > 0 && (
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-5 shadow-xl text-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-black font-jakarta text-lg text-white">
                {quote.package_name || 'Quote Summary'}
              </h3>
              <p className="text-slate-400 text-xs flex items-center gap-2">
                <Plane className="w-3.5 h-3.5" /> {quote.destination || 'Destination TBD'}
                {quote.departure_date && ` · Departs ${new Date(quote.departure_date).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}`}
                {quote.nights && ` · ${quote.nights}N`}
              </p>
            </div>
            <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px]">DRAFT QUOTE</Badge>
          </div>

          {/* Main pricing grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
            {[
              { label: 'Selling Price', val: `₱${sellingPrice.toLocaleString(undefined,{maximumFractionDigits:0})}`, highlight: true },
              { label: 'Downpayment', val: `₱${Number(quote.downpayment_required).toLocaleString()}`, sub: 'to reserve' },
              { label: 'Balance', val: `₱${balance.toLocaleString(undefined,{maximumFractionDigits:0})}`, sub: 'after DP' },
              { label: 'Commission/pax', val: `₱${Number(quote.commission_per_pax).toLocaleString()}`, sub: 'agent comm.' },
              { label: 'Est. Revenue', val: `₱${(estRevenue/1000).toFixed(0)}K`, sub: `${quote.pax_estimate} pax` },
              { label: 'Net Revenue', val: `₱${(netRevenue/1000).toFixed(0)}K`, sub: 'after comm.' },
            ].map((item, i) => (
              <div key={i} className={cn("rounded-lg p-3 text-center", item.highlight ? "bg-amber-500 ring-2 ring-amber-400" : "bg-white/10")}>
                <p className="text-[9px] text-white/60 uppercase tracking-wider mb-1">{item.label}</p>
                <p className={cn("font-black font-jakarta text-sm", item.highlight ? "text-white" : "text-white")}>{item.val}</p>
                {item.sub && <p className="text-[9px] text-white/40 mt-0.5">{item.sub}</p>}
              </div>
            ))}
          </div>

          {/* Hotel summary */}
          {quote.hotel_rows.some(r => r.hotel_name || r.twin) && (
            <div className="mt-4 pt-4 border-t border-white/10">
              <p className="text-xs font-semibold text-slate-300 mb-3 flex items-center gap-2">
                <Hotel className="w-3.5 h-3.5 text-purple-400" /> Hotel Rate Summary
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {quote.hotel_rows.filter(r => r.hotel_name || r.twin).map(row => {
                  const cat = HOTEL_CATEGORIES.find(c => c.value === row.category);
                  return (
                    <div key={row.id} className="bg-white/5 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-semibold text-amber-300">{cat?.label || row.category}</span>
                        {row.hotel_name && <span className="text-[10px] text-slate-400 truncate ml-2">{row.hotel_name}</span>}
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                        {[
                          { l: 'Twin', v: row.twin },
                          { l: 'Triple', v: row.triple },
                          { l: 'Quad', v: row.quad },
                          { l: 'Solo', v: row.solo },
                        ].filter(x => x.v).map(x => (
                          <div key={x.l} className="flex justify-between text-[10px]">
                            <span className="text-slate-400">{x.l}</span>
                            <span className="font-bold text-white">₱{Number(x.v).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap gap-3 justify-between items-center">
            <p className="text-[10px] text-slate-500">Base: {currSymbol}{baseForeign.toLocaleString()} × {quote.currency !== 'PHP' ? exRate : 1} = ₱{basePHP.toLocaleString(undefined,{maximumFractionDigits:0})} base | +₱{markupPHP.toLocaleString(undefined,{maximumFractionDigits:0})} markup | {grossMargin}% margin</p>
            <Button
              size="sm"
              className={cn("h-8 text-xs gap-1.5 text-white", saved ? "bg-emerald-600 hover:bg-emerald-700" : "gradient-gold border-0")}
              onClick={handleSave}
              disabled={saving || !quote.package_name}
            >
              {saving ? <RefreshCw className="w-3 h-3 animate-spin" /> : saved ? <CheckCircle className="w-3 h-3" /> : <Save className="w-3 h-3" />}
              {saving ? 'Saving...' : saved ? 'Saved to Collectives!' : 'Save to Collectives DB'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}