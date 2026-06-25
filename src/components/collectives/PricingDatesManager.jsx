// @ts-nocheck
import { useState } from 'react';
import { Plus, Trash2, Calendar, Users, AlertTriangle, ChevronDown, ChevronUp, DollarSign, Percent, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

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

const DATE_STATUS = {
  open:        { label: 'Open',        class: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  almost_full: { label: 'Almost Full', class: 'bg-amber-100  text-amber-700  border-amber-200'  },
  sold_out:    { label: 'Sold Out',    class: 'bg-rose-100   text-rose-700   border-rose-200'    },
  closed:      { label: 'Closed',      class: 'bg-slate-100  text-slate-600  border-slate-200'   },
};

const BLANK_DATE = () => ({
  label: '',
  departure_date: '',
  return_date: '',
  cutoff_date: '',
  total_slots: 30,
  booked_slots: 0,
  status: 'open',
  price_override: '',
  notes: '',
  use_custom_pricing: false,
});

// ── Rate rows config ──────────────────────────────────────────────────────────
const ROOM_RATES = [
  { key: 'rate_twin',   label: 'Twin Sharing',       color: 'text-amber-700',   bg: 'bg-amber-50 dark:bg-amber-950/20',   border: 'border-amber-200' },
  { key: 'rate_triple', label: 'Triple Sharing',     color: 'text-sky-700',     bg: 'bg-sky-50 dark:bg-sky-950/20',       border: 'border-sky-200' },
  { key: 'rate_quad',   label: 'Quad Sharing',       color: 'text-emerald-700', bg: 'bg-emerald-50 dark:bg-emerald-950/20', border: 'border-emerald-200' },
  { key: 'rate_single', label: 'Single Occupancy',   color: 'text-purple-700',  bg: 'bg-purple-50 dark:bg-purple-950/20', border: 'border-purple-200' },
  { key: 'rate_solo',   label: 'Solo Rate',          color: 'text-indigo-700',  bg: 'bg-indigo-50 dark:bg-indigo-950/20', border: 'border-indigo-200' },
  { key: 'rate_single_supplement', label: 'Single Supplement', color: 'text-orange-700', bg: 'bg-orange-50 dark:bg-orange-950/20', border: 'border-orange-200', noAge: true },
];
const CHILD_RATES = [
  { key: 'rate_child_no_bed', label: 'Child No Bed',  color: 'text-rose-700',  bg: 'bg-rose-50 dark:bg-rose-950/20',   border: 'border-rose-200' },
  { key: 'rate_child',        label: 'Child w/ Bed',  color: 'text-pink-700',  bg: 'bg-pink-50 dark:bg-pink-950/20',   border: 'border-pink-200' },
  { key: 'rate_infant',       label: 'Infant Fee',    color: 'text-fuchsia-700', bg: 'bg-fuchsia-50 dark:bg-fuchsia-950/20', border: 'border-fuchsia-200' },
];

// ── F helper ──────────────────────────────────────────────────────────────────
function F({ label, children, className }) {
  return <div className={cn("space-y-1.5", className)}>{label && <Label className="text-xs font-medium text-muted-foreground">{label}</Label>}{children}</div>;
}

// ── RateRow (compact) ─────────────────────────────────────────────────────────
function RateRow({ config, value, minAge, maxAge, onChange, onChangeAge }) {
  return (
    <div className={cn("rounded-lg border p-3 space-y-2", config.bg, config.border)}>
      <Label className={cn("text-[10px] font-semibold uppercase tracking-wide", config.color)}>{config.label}</Label>
      <div className="relative">
        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">₱</span>
        <Input type="number" step="0.01" placeholder="0.00" className="pl-6 h-8 text-sm font-semibold bg-white/80 dark:bg-card/80" value={value || ''} onChange={e => onChange(config.key, e.target.value)} />
      </div>
      {!config.noAge && (
        <div className="flex gap-1 items-center">
          <span className="text-[9px] text-muted-foreground w-14">Age Range:</span>
          <Input type="number" placeholder="Min" className="h-6 text-[10px] px-1.5 bg-white/60 dark:bg-card/60" value={minAge || ''} onChange={e => onChangeAge(`${config.key}_age_min`, e.target.value)} />
          <span className="text-[9px] text-muted-foreground">–</span>
          <Input type="number" placeholder="Max" className="h-6 text-[10px] px-1.5 bg-white/60 dark:bg-card/60" value={maxAge || ''} onChange={e => onChangeAge(`${config.key}_age_max`, e.target.value)} />
        </div>
      )}
      {value && Number(value) > 0 && (
        <p className={cn("text-[10px] font-bold tabular-nums", config.color)}>₱{Number(value).toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
      )}
    </div>
  );
}

// ── Date Card ─────────────────────────────────────────────────────────────────
function DateCard({ d, idx, packageRates, onUpdate, onRemove, onToggleCustom, onRateChange, dateCurrency }) {
  const [expanded, setExpanded] = useState(false);
  const fillPct = d.total_slots > 0 ? Math.round(((d.booked_slots || 0) / d.total_slots) * 100) : 0;
  const sc = DATE_STATUS[d.status] || DATE_STATUS.open;
  const usingCustom = !!d.use_custom_pricing;
  const rates = usingCustom ? d : packageRates;
  const sellingPrice = usingCustom && d.selling_price ? d.selling_price : (packageRates.selling_price || 0);

  return (
    <div className={cn("border rounded-lg overflow-hidden bg-card transition-all", usingCustom ? "border-amber-300 dark:border-amber-700" : "border-border")}>
      {/* Card Header */}
      <div className="flex items-center gap-3 p-3">
        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", usingCustom ? "bg-amber-100 dark:bg-amber-950/30" : "bg-muted")}>
          <Calendar className={cn("w-4 h-4", usingCustom ? "text-amber-600" : "text-muted-foreground")} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-foreground truncate">
              {d.label || (d.departure_date ? `Departure ${idx + 1}` : `Date ${idx + 1}`)}
            </span>
            <span className={cn("text-[10px] px-1.5 py-0.5 rounded border font-medium flex-shrink-0", sc.class)}>{sc.label}</span>
            {usingCustom && <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-semibold flex-shrink-0">Custom Pricing</span>}
            {fillPct >= 80 && <AlertTriangle className="w-3 h-3 text-amber-500 flex-shrink-0" />}
          </div>
          <div className="flex items-center gap-3 mt-0.5 text-[11px] text-muted-foreground flex-wrap">
            {d.departure_date && <span>🛫 {d.departure_date}</span>}
            {d.return_date && <span>🛬 {d.return_date}</span>}
            {d.total_slots > 0 && <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {d.booked_slots || 0}/{d.total_slots}</span>}
            {sellingPrice > 0 && <span className="text-amber-600 font-bold">₱{Number(sellingPrice).toLocaleString()}/pax</span>}
          </div>
          {d.total_slots > 0 && (
            <div className="mt-1.5 h-1 bg-muted rounded-full overflow-hidden">
              <div className={cn("h-full rounded-full transition-all", fillPct >= 90 ? "bg-rose-500" : fillPct >= 70 ? "bg-amber-500" : "bg-emerald-500")} style={{ width: `${Math.min(100, fillPct)}%` }} />
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button onClick={() => setExpanded(e => !e)} className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground" title="Edit">
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          <button onClick={() => onRemove(idx)} className="p-1.5 rounded hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors text-muted-foreground hover:text-rose-600" title="Remove">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Expanded Edit */}
      {expanded && (
        <div className="border-t border-border p-4 bg-muted/20 space-y-4">
          {/* Date Info Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1"><Label className="text-[10px] text-muted-foreground">Label</Label><Input className="h-8 text-xs" value={d.label || ''} onChange={e => onUpdate(idx, 'label', e.target.value)} /></div>
            <div className="space-y-1"><Label className="text-[10px] text-muted-foreground">Status</Label>
              <Select value={d.status || 'open'} onValueChange={v => onUpdate(idx, 'status', v)}><SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(DATE_STATUS).map(([k,v]) => <SelectItem key={k} value={k} className="text-xs">{v.label}</SelectItem>)}</SelectContent></Select>
            </div>
            <div className="space-y-1"><Label className="text-[10px] text-muted-foreground">Departure Date *</Label><Input type="date" className="h-8 text-xs" value={d.departure_date || ''} onChange={e => onUpdate(idx, 'departure_date', e.target.value)} /></div>
            <div className="space-y-1"><Label className="text-[10px] text-muted-foreground">Return Date</Label><Input type="date" className="h-8 text-xs" value={d.return_date || ''} onChange={e => onUpdate(idx, 'return_date', e.target.value)} /></div>
            <div className="space-y-1"><Label className="text-[10px] text-muted-foreground">Cut-Off Date</Label><Input type="date" className="h-8 text-xs" value={d.cutoff_date || ''} onChange={e => onUpdate(idx, 'cutoff_date', e.target.value)} /></div>
            <div className="space-y-1"><Label className="text-[10px] text-muted-foreground">Total Slots</Label><Input type="number" className="h-8 text-xs" value={d.total_slots || 0} onChange={e => onUpdate(idx, 'total_slots', Number(e.target.value))} /></div>
            <div className="space-y-1"><Label className="text-[10px] text-muted-foreground">Booked Slots</Label><Input type="number" className="h-8 text-xs" value={d.booked_slots || 0} onChange={e => onUpdate(idx, 'booked_slots', Number(e.target.value))} /></div>
            <div className="space-y-1"><Label className="text-[10px] text-muted-foreground">Notes</Label><Textarea rows={2} className="text-xs resize-none" value={d.notes || ''} onChange={e => onUpdate(idx, 'notes', e.target.value)} /></div>
          </div>

          {/* Custom Pricing Toggle */}
          <div className="border-t border-border pt-3">
            <button
              type="button"
              onClick={() => onToggleCustom(idx, !usingCustom)}
              className={cn("flex items-center gap-2 px-3 py-2 rounded-md border text-xs font-semibold transition-all w-full sm:w-auto",
                usingCustom ? "bg-amber-500 text-white border-amber-500" : "bg-muted/50 text-muted-foreground border-border hover:border-amber-400")}
            >
              <span className={cn("w-3 h-3 rounded-full border-2 flex-shrink-0", usingCustom ? "bg-white border-white" : "border-muted-foreground")} />
              {usingCustom ? 'Using Custom Pricing' : 'Use Package Default Rates'}
            </button>
          </div>

          {/* Per-Date Pricing (only when custom is enabled) */}
          {usingCustom && (
            <div className="space-y-4">
              <div className="bg-slate-800 px-4 py-2 rounded-lg">
                <span className="text-xs font-bold text-white">Custom Pricing for {d.label || `Departure ${idx + 1}`}</span>
              </div>
              {/* Per-date base pricing */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <F label={`Base Cost (${dateCurrency})`}>
                  <div className="relative"><span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{dateCurrency}</span><Input type="number" className="pl-7 h-8 text-sm" value={d.base_price_foreign || ''} onChange={e => onRateChange(idx, 'base_price_foreign', Number(e.target.value))} /></div>
                </F>
                {dateCurrency !== 'PHP' && (
                  <F label="Exchange Rate"><Input type="number" className="h-8 text-sm" value={d.exchange_rate || ''} onChange={e => onRateChange(idx, 'exchange_rate', Number(e.target.value))} /></F>
                )}
                <F label="Markup (₱)"><div className="relative"><span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">₱</span><Input type="number" className="pl-7 h-8 text-sm" value={d.markup_amount || ''} onChange={e => onRateChange(idx, 'markup_amount', Number(e.target.value))} /></div></F>
                <F label="Selling Price"><div className="h-8 flex items-center px-3 bg-amber-50 rounded-md"><span className="text-sm font-black text-amber-700">₱{Number(d.selling_price || 0).toLocaleString()}</span></div></F>
              </div>
              {/* Room Rates */}
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Room Rates</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {ROOM_RATES.map(r => (
                  <RateRow key={r.key} config={r} value={d[r.key] || ''} minAge={d[`${r.key}_age_min`] || ''} maxAge={d[`${r.key}_age_max`] || ''}
                    onChange={(k, v) => onRateChange(idx, k, v)}
                    onChangeAge={(k, v) => onRateChange(idx, k, v)}
                  />
                ))}
              </div>
              {/* Child Rates */}
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider pt-1">Child & Infant Rates</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {CHILD_RATES.map(r => (
                  <RateRow key={r.key} config={r} value={d[r.key] || ''} minAge={d[`${r.key}_age_min`] || ''} maxAge={d[`${r.key}_age_max`] || ''}
                    onChange={(k, v) => onRateChange(idx, k, v)}
                    onChangeAge={(k, v) => onRateChange(idx, k, v)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
// Accepts props from both CollectiveWorkspace (form + setF style) and EZQuoteWorkspace (quote + setQ style)
export default function PricingDatesManager({
  // CollectiveWorkspace props
  form, setF, basePHP, markupPHP, sellingPrice, grossMargin,
  // EZQuoteWorkspace props
  quote, setQ, basePHP2, markupPHP2, sellingPrice2, grossMargin2,
  // Shared
  currency: currencyProp, baseForeign: baseForeignProp, exRate: exRateProp,
  travelDates: travelDatesProp, onChangeDates,
}) {
  // Normalise: figure out which convention we're using
  const isCollective = !!form && !!setF;
  const currency = currencyProp || (isCollective ? form.currency : quote?.currency) || 'USD';
  const currSymbol = CURRENCIES.find(c => c.value === currency)?.symbol || '$';
  const baseForeign = baseForeignProp !== undefined ? baseForeignProp : (isCollective ? (Number(form?.base_price_foreign) || 0) : (Number(quote?.base_cost_foreign) || 0));
  const exRate = exRateProp !== undefined ? exRateProp : (isCollective ? (Number(form?.exchange_rate) || 1) : (Number(quote?.exchange_rate) || 1));
  const bpPHP = basePHP !== undefined ? basePHP : (basePHP2 !== undefined ? basePHP2 : (currency === 'PHP' ? baseForeign : baseForeign * exRate));
  const mPHP = markupPHP !== undefined ? markupPHP : (markupPHP2 !== undefined ? markupPHP2 : 0);
  const sp = sellingPrice !== undefined ? sellingPrice : (sellingPrice2 !== undefined ? sellingPrice2 : (bpPHP + mPHP));
  const gMargin = grossMargin !== undefined ? grossMargin : (grossMargin2 !== undefined ? grossMargin2 : (sp > 0 ? ((mPHP / sp) * 100).toFixed(1) : 0));
  const dp = isCollective ? (Number(form?.downpayment_required) || 0) : (Number(quote?.downpayment_required) || 0);
  const commission = isCollective ? (Number(form?.commission_amount) || 0) : (Number(quote?.commission_per_pax) || 0);
  const useMarkupPct = isCollective ? form?._use_markup_pct : quote?.use_markup_pct;
  const markupPct = isCollective ? form?.markup_pct : quote?.markup_pct;
  const markupFixed = isCollective ? form?.markup_amount : quote?.markup_php;
  const totalSlots = isCollective ? (Number(form?.total_slots) || 0) : (Number(quote?.pax_estimate) || 0);

  const travelDates = travelDatesProp || (isCollective ? (form?.travel_dates || []) : []);
  const setDates = (updater) => {
    const newDates = typeof updater === 'function' ? updater(travelDates) : updater;
    if (onChangeDates) onChangeDates(newDates);
    else if (isCollective) setF('travel_dates', newDates);
  };

  // Build package-level rates map for fallback display
  const packageRates = isCollective ? {
    rate_twin: form?.rate_twin, rate_twin_age_min: form?.rate_twin_age_min, rate_twin_age_max: form?.rate_twin_age_max,
    rate_triple: form?.rate_triple, rate_triple_age_min: form?.rate_triple_age_min, rate_triple_age_max: form?.rate_triple_age_max,
    rate_quad: form?.rate_quad, rate_quad_age_min: form?.rate_quad_age_min, rate_quad_age_max: form?.rate_quad_age_max,
    rate_single: form?.rate_single, rate_single_age_min: form?.rate_single_age_min, rate_single_age_max: form?.rate_single_age_max,
    rate_solo: form?.rate_solo, rate_solo_age_min: form?.rate_solo_age_min, rate_solo_age_max: form?.rate_solo_age_max,
    rate_single_supplement: form?.rate_single_supplement,
    rate_child_no_bed: form?.rate_child_no_bed, rate_child_no_bed_age_min: form?.rate_child_no_bed_age_min, rate_child_no_bed_age_max: form?.rate_child_no_bed_age_max,
    rate_child: form?.rate_child, rate_child_age_min: form?.rate_child_age_min, rate_child_age_max: form?.rate_child_age_max,
    rate_infant: form?.rate_infant, rate_infant_age_min: form?.rate_infant_age_min, rate_infant_age_max: form?.rate_infant_age_max,
    selling_price: sp,
  } : {};

  const [showAddForm, setShowAddForm] = useState(false);
  const [newDate, setNewDate] = useState(BLANK_DATE());
  const [addError, setAddError] = useState('');

  // ── Setters ──
  const pkgSet = (key, val) => {
    if (isCollective) setF(key, val);
    else {
      // Map to EZQuote field names
      const map = {
        currency: 'currency', base_price_foreign: 'base_cost_foreign', exchange_rate: 'exchange_rate',
        markup_amount: 'markup_php', markup_pct: 'markup_pct', _use_markup_pct: 'use_markup_pct',
        commission_amount: 'commission_per_pax', downpayment_required: 'downpayment_required',
        rate_twin: 'rate_twin', rate_twin_age_min: 'rate_twin_age_min', rate_twin_age_max: 'rate_twin_age_max',
        rate_triple: 'rate_triple', rate_triple_age_min: 'rate_triple_age_min', rate_triple_age_max: 'rate_triple_age_max',
        rate_quad: 'rate_quad', rate_quad_age_min: 'rate_quad_age_min', rate_quad_age_max: 'rate_quad_age_max',
        rate_single: 'rate_single', rate_single_age_min: 'rate_single_age_min', rate_single_age_max: 'rate_single_age_max',
        rate_solo: 'rate_solo', rate_solo_age_min: 'rate_solo_age_min', rate_solo_age_max: 'rate_solo_age_max',
        rate_single_supplement: 'rate_single_supplement',
        rate_child_no_bed: 'rate_child_no_bed', rate_child_no_bed_age_min: 'rate_child_no_bed_age_min', rate_child_no_bed_age_max: 'rate_child_no_bed_age_max',
        rate_child: 'rate_child', rate_child_age_min: 'rate_child_age_min', rate_child_age_max: 'rate_child_age_max',
        rate_infant: 'rate_infant', rate_infant_age_min: 'rate_infant_age_min', rate_infant_age_max: 'rate_infant_age_max',
      };
      if (map[key]) setQ(map[key], val);
    }
  };

  const handleAddDate = () => {
    if (!newDate.departure_date) { setAddError('Departure date is required.'); return; }
    setAddError('');
    const label = newDate.label || [
      newDate.departure_date && new Date(newDate.departure_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      newDate.return_date && new Date(newDate.return_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    ].filter(Boolean).join(' – ');
    setDates(prev => [...prev, { ...newDate, label, total_slots: Number(newDate.total_slots) || 0, booked_slots: Number(newDate.booked_slots) || 0 }]);
    setNewDate(BLANK_DATE());
    setShowAddForm(false);
  };

  const handleUpdate = (idx, key, val) => setDates(prev => prev.map((d, i) => i === idx ? { ...d, [key]: val } : d));
  const handleRemove = (idx) => setDates(prev => prev.filter((_, i) => i !== idx));
  const handleToggleCustom = (idx, enable) => {
    setDates(prev => prev.map((d, i) => {
      if (i !== idx) return d;
      if (!enable) return { ...d, use_custom_pricing: false };
      // When enabling custom pricing, copy package-level rates as initial values
      return {
        ...d,
        use_custom_pricing: true,
        base_price_foreign: baseForeign,
        exchange_rate: exRate,
        markup_amount: mPHP,
        selling_price: sp,
        rate_twin: isCollective ? (form?.rate_twin || '') : (quote?.rate_twin || ''),
        rate_triple: isCollective ? (form?.rate_triple || '') : (quote?.rate_triple || ''),
        rate_quad: isCollective ? (form?.rate_quad || '') : (quote?.rate_quad || ''),
        rate_single: isCollective ? (form?.rate_single || '') : (quote?.rate_single || ''),
        rate_solo: isCollective ? (form?.rate_solo || '') : (quote?.rate_solo || ''),
        rate_single_supplement: isCollective ? (form?.rate_single_supplement || '') : (quote?.rate_single_supplement || ''),
        rate_child_no_bed: isCollective ? (form?.rate_child_no_bed || '') : (quote?.rate_child_no_bed || ''),
        rate_child: isCollective ? (form?.rate_child || '') : (quote?.rate_child || ''),
        rate_infant: isCollective ? (form?.rate_infant || '') : (quote?.rate_infant || ''),
        rate_twin_age_min: isCollective ? (form?.rate_twin_age_min || '') : (quote?.rate_twin_age_min || ''),
        rate_twin_age_max: isCollective ? (form?.rate_twin_age_max || '') : (quote?.rate_twin_age_max || ''),
        rate_triple_age_min: isCollective ? (form?.rate_triple_age_min || '') : (quote?.rate_triple_age_min || ''),
        rate_triple_age_max: isCollective ? (form?.rate_triple_age_max || '') : (quote?.rate_triple_age_max || ''),
        rate_quad_age_min: isCollective ? (form?.rate_quad_age_min || '') : (quote?.rate_quad_age_min || ''),
        rate_quad_age_max: isCollective ? (form?.rate_quad_age_max || '') : (quote?.rate_quad_age_max || ''),
        rate_single_age_min: isCollective ? (form?.rate_single_age_min || '') : (quote?.rate_single_age_min || ''),
        rate_single_age_max: isCollective ? (form?.rate_single_age_max || '') : (quote?.rate_single_age_max || ''),
        rate_solo_age_min: isCollective ? (form?.rate_solo_age_min || '') : (quote?.rate_solo_age_min || ''),
        rate_solo_age_max: isCollective ? (form?.rate_solo_age_max || '') : (quote?.rate_solo_age_max || ''),
        rate_child_no_bed_age_min: isCollective ? (form?.rate_child_no_bed_age_min || '') : (quote?.rate_child_no_bed_age_min || ''),
        rate_child_no_bed_age_max: isCollective ? (form?.rate_child_no_bed_age_max || '') : (quote?.rate_child_no_bed_age_max || ''),
        rate_child_age_min: isCollective ? (form?.rate_child_age_min || '') : (quote?.rate_child_age_min || ''),
        rate_child_age_max: isCollective ? (form?.rate_child_age_max || '') : (quote?.rate_child_age_max || ''),
        rate_infant_age_min: isCollective ? (form?.rate_infant_age_min || '') : (quote?.rate_infant_age_min || ''),
        rate_infant_age_max: isCollective ? (form?.rate_infant_age_max || '') : (quote?.rate_infant_age_max || ''),
      };
    }));
  };
  const handleDateRateChange = (idx, key, val) => setDates(prev => prev.map((d, i) => i === idx ? { ...d, [key]: val } : d));

  return (
    <div className="space-y-5">
      {/* ── SECTION: Package Base Pricing ── */}
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="bg-slate-900 px-4 py-3 flex items-center gap-2 flex-wrap">
          <DollarSign className="w-4 h-4 text-amber-400" />
          <span className="text-sm font-bold text-white">Package Base Pricing</span>
          <span className="text-[10px] text-slate-400 ml-auto">Currency, markup & commission</span>
        </div>
        <div className="p-5 space-y-4">
          {/* Row 1: Currency / Base Cost / Exchange / Base PHP */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <F label="Base Currency">
              <Select value={currency} onValueChange={v => pkgSet('currency', v)}>
                <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{CURRENCIES.map(c => <SelectItem key={c.value} value={c.value} className="text-xs">{c.value} – {c.label}</SelectItem>)}</SelectContent>
              </Select>
            </F>
            <F label={`Base Cost (${currSymbol})`}>
              <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{currSymbol}</span>
                <Input type="number" className="pl-7 h-9 text-sm" value={baseForeign} onChange={e => pkgSet('base_price_foreign', Number(e.target.value))} />
              </div>
            </F>
            {currency !== 'PHP' && (
              <F label="Exchange Rate (→ PHP)"><Input type="number" className="h-9 text-sm" value={exRate} onChange={e => pkgSet('exchange_rate', Number(e.target.value))} /></F>
            )}
            <F label="Base Cost PHP">
              <div className="h-9 flex items-center px-3 bg-sky-50 dark:bg-sky-950/20 border border-sky-200 rounded-md">
                <span className="text-sm font-bold text-sky-700">₱{bpPHP.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
              </div>
            </F>
          </div>
          {/* Row 2: Markup / Margin / Selling Price */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <F label="Markup Type">
              <Select value={useMarkupPct ? 'pct' : 'fixed'} onValueChange={v => pkgSet('_use_markup_pct', v === 'pct')}>
                <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="fixed" className="text-xs">Fixed Amount (₱)</SelectItem><SelectItem value="pct" className="text-xs">Percentage (%)</SelectItem></SelectContent>
              </Select>
            </F>
            <F label={useMarkupPct ? 'Markup %' : 'Markup Amount (₱)'}>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{useMarkupPct ? '%' : '₱'}</span>
                <Input type="number" className="pl-7 h-9 text-sm" value={useMarkupPct ? markupPct : markupFixed} onChange={e => useMarkupPct ? pkgSet('markup_pct', Number(e.target.value)) : pkgSet('markup_amount', Number(e.target.value))} />
              </div>
            </F>
            <F label="Gross Margin">
              <div className="h-9 flex items-center px-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 rounded-md">
                <span className="text-sm font-bold text-emerald-700">{gMargin}%</span>
              </div>
            </F>
            <F label="Selling Price / Pax">
              <div className="h-9 flex items-center px-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-300 rounded-md">
                <span className="text-sm font-black text-amber-700">₱{sp.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
              </div>
            </F>
          </div>
          {/* Row 3: Commission / Downpayment / Balance */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <F label="Commission / Pax (₱)">
              <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">₱</span><Input type="number" className="pl-7 h-9 text-sm" value={commission} onChange={e => pkgSet('commission_amount', Number(e.target.value))} /></div>
            </F>
            <F label="Downpayment (₱)">
              <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">₱</span><Input type="number" className="pl-7 h-9 text-sm" value={dp} onChange={e => pkgSet('downpayment_required', Number(e.target.value))} /></div>
            </F>
            <F label="Balance after DP">
              <div className="h-9 flex items-center px-3 bg-muted rounded-md"><span className="text-sm font-semibold">₱{(sp - dp).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span></div>
            </F>
          </div>
        </div>
      </div>

      {/* ── SECTION: Package Default Availability Rates ── */}
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="bg-slate-800 px-4 py-2.5 flex items-center gap-2">
          <span className="text-xs font-bold text-white">Default Availability Rates</span>
          <span className="text-[10px] text-slate-400">Package-level rates (inherited by dates without custom pricing)</span>
        </div>
        <div className="p-4 space-y-3">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Room Rates</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {ROOM_RATES.map(r => (
              <RateRow key={r.key} config={r}
                value={isCollective ? (form[r.key] || '') : (quote?.[r.key] || '')}
                minAge={isCollective ? (form[`${r.key}_age_min`] || '') : (quote?.[`${r.key}_age_min`] || '')}
                maxAge={isCollective ? (form[`${r.key}_age_max`] || '') : (quote?.[`${r.key}_age_max`] || '')}
                onChange={(k, v) => pkgSet(k, v)}
                onChangeAge={(k, v) => pkgSet(k, v)}
              />
            ))}
          </div>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider pt-1">Child & Infant Rates</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {CHILD_RATES.map(r => (
              <RateRow key={r.key} config={r}
                value={isCollective ? (form[r.key] || '') : (quote?.[r.key] || '')}
                minAge={isCollective ? (form[`${r.key}_age_min`] || '') : (quote?.[`${r.key}_age_min`] || '')}
                maxAge={isCollective ? (form[`${r.key}_age_max`] || '') : (quote?.[`${r.key}_age_max`] || '')}
                onChange={(k, v) => pkgSet(k, v)}
                onChangeAge={(k, v) => pkgSet(k, v)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── SECTION: Travel Dates ── */}
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="bg-slate-900 px-4 py-3 flex items-center gap-2 flex-wrap">
          <Calendar className="w-4 h-4 text-amber-400" />
          <span className="text-sm font-bold text-white">Travel Dates & Per-Date Pricing</span>
          <span className="text-[10px] text-slate-400 ml-auto">Each date can override package default rates</span>
          <Button size="sm" className="ml-2 h-7 text-xs gradient-gold text-white border-0 gap-1" onClick={() => { setShowAddForm(true); setAddError(''); }}>
            <Plus className="w-3 h-3" /> Add Date
          </Button>
        </div>
        <div className="p-4 space-y-3">
          {/* Add Form */}
          {showAddForm && (
            <div className="border-2 border-amber-300 dark:border-amber-700 rounded-xl p-4 bg-amber-50/60 dark:bg-amber-950/10 space-y-3">
              <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">New Departure Schedule</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1"><Label className="text-[10px] text-muted-foreground">Departure Date *</Label><Input type="date" className="h-9 text-sm" value={newDate.departure_date} onChange={e => setNewDate(p => ({ ...p, departure_date: e.target.value }))} /></div>
                <div className="space-y-1"><Label className="text-[10px] text-muted-foreground">Return Date</Label><Input type="date" className="h-9 text-sm" value={newDate.return_date} onChange={e => setNewDate(p => ({ ...p, return_date: e.target.value }))} /></div>
                <div className="space-y-1"><Label className="text-[10px] text-muted-foreground">Label (optional)</Label><Input className="h-9 text-sm" placeholder="e.g. Oct 05–10" value={newDate.label} onChange={e => setNewDate(p => ({ ...p, label: e.target.value }))} /></div>
                <div className="space-y-1"><Label className="text-[10px] text-muted-foreground">Total Slots</Label><Input type="number" className="h-9 text-sm" value={newDate.total_slots} onChange={e => setNewDate(p => ({ ...p, total_slots: Number(e.target.value) }))} /></div>
                <div className="space-y-1"><Label className="text-[10px] text-muted-foreground">Status</Label>
                  <Select value={newDate.status} onValueChange={v => setNewDate(p => ({ ...p, status: v }))}><SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(DATE_STATUS).map(([k,v]) => <SelectItem key={k} value={k} className="text-xs">{v.label}</SelectItem>)}</SelectContent></Select>
                </div>
              </div>
              {addError && <p className="text-xs text-rose-600 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> {addError}</p>}
              <div className="flex gap-2">
                <Button type="button" size="sm" className="h-8 text-xs gradient-gold text-white border-0 gap-1.5" onClick={handleAddDate}><Plus className="w-3.5 h-3.5" /> Add Departure</Button>
                <Button type="button" size="sm" variant="outline" className="h-8 text-xs" onClick={() => { setShowAddForm(false); setAddError(''); }}>Cancel</Button>
              </div>
            </div>
          )}

          {/* Empty State */}
          {travelDates.length === 0 && !showAddForm && (
            <div className="text-center py-10 border-2 border-dashed border-border rounded-xl bg-muted/20">
              <Calendar className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm font-medium text-muted-foreground">No travel dates yet</p>
              <p className="text-xs text-muted-foreground/60 mt-1 max-w-xs mx-auto">Add departure schedules — each can have its own custom pricing.</p>
              <Button type="button" size="sm" className="mt-3 h-8 text-xs gradient-gold text-white border-0 gap-1.5" onClick={() => setShowAddForm(true)}><Plus className="w-3.5 h-3.5" /> Add First Travel Date</Button>
            </div>
          )}

          {/* Date Cards */}
          {travelDates.length > 0 && (
            <>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{travelDates.length} Departure{travelDates.length !== 1 ? 's' : ''} Scheduled</p>
              <div className="space-y-2">
                {travelDates.map((d, idx) => (
                  <DateCard key={idx} d={d} idx={idx} packageRates={packageRates} dateCurrency={currSymbol}
                    onUpdate={handleUpdate} onRemove={handleRemove} onToggleCustom={handleToggleCustom} onRateChange={handleDateRateChange}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}