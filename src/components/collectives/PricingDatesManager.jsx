// @ts-nocheck
import { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, Calendar, Users, AlertTriangle, ChevronDown, ChevronUp, DollarSign, Sparkles, Upload, Loader2, CheckCircle, X, Image } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

// ── Constants ─────────────────────────────────────────────────────────────────
const BOOK_AND_BUY_WINDOW_DAYS = 30;
const daysUntilDeparture = (dateStr) => {
  if (!dateStr) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const dep = new Date(dateStr + 'T00:00:00');
  return Math.round((dep - today) / (1000 * 60 * 60 * 24));
};

const CURRENCIES = [
  { value: 'PHP', symbol: '₱', label: 'PHP', defaultRate: 1 },
  { value: 'USD', symbol: '$', label: 'USD', defaultRate: 58 },
  { value: 'EUR', symbol: '€', label: 'EUR', defaultRate: 63 },
  { value: 'JPY', symbol: '¥', label: 'JPY', defaultRate: 0.39 },
  { value: 'KRW', symbol: '₩', label: 'KRW', defaultRate: 0.044 },
  { value: 'SGD', symbol: 'S$', label: 'SGD', defaultRate: 43 },
  { value: 'HKD', symbol: 'HK$', label: 'HKD', defaultRate: 7.5 },
  { value: 'AUD', symbol: 'A$', label: 'AUD', defaultRate: 38 },
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
function DateCard({ d, idx, packageRates, onUpdate, onRemove, onToggleCustom, onRateChange, packageCurrency }) {
  const [expanded, setExpanded] = useState(false);
  const fillPct = d.total_slots > 0 ? Math.round(((d.booked_slots || 0) / d.total_slots) * 100) : 0;
  const sc = DATE_STATUS[d.status] || DATE_STATUS.open;
  const usingCustom = !!d.use_custom_pricing;
  const rates = usingCustom ? d : packageRates;
  // Prefer the date's own stored price (snapshotted at creation); fall back to live package rates for legacy dates
  const sellingPrice = d.selling_price || packageRates.selling_price || 0;
  // Per-date currency (each date can have its own base currency)
  const dateCurr = d.date_currency || packageCurrency || 'PHP';
  const dateCurrSymbol = CURRENCIES.find(c => c.value === dateCurr)?.symbol || '₱';
  const dateBasePHP = dateCurr === 'PHP' ? (Number(d.base_price_foreign) || 0) : (Number(d.base_price_foreign) || 0) * (Number(d.exchange_rate) || 1);

  // Book & Buy: departure within 30-day window triggers full-payment policy in Sales
  const daysLeft = daysUntilDeparture(d.departure_date);
  const isBookAndBuy = daysLeft !== null && daysLeft >= 0 && daysLeft <= BOOK_AND_BUY_WINDOW_DAYS;
  const isPast = daysLeft !== null && daysLeft < 0;

  return (
    <div className={cn(
      "border rounded-lg overflow-hidden bg-card transition-all",
      isBookAndBuy ? "border-rose-400 dark:border-rose-600" :
      usingCustom ? "border-amber-300 dark:border-amber-700" : "border-border"
    )}>
      {/* Book & Buy top banner */}
      {isBookAndBuy && (
        <div className="bg-rose-500 px-3 py-1 flex items-center gap-2">
          <span className="text-[10px] font-bold text-white tracking-wide">⚡ BOOK & BUY</span>
          <span className="text-[10px] text-rose-100">
            {daysLeft === 0 ? 'Departure today — full payment required' : `${daysLeft} day${daysLeft === 1 ? '' : 's'} away — full payment required in Sales`}
          </span>
        </div>
      )}
      {/* Card Header */}
      <div className="flex items-center gap-3 p-3">
        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", isBookAndBuy ? "bg-rose-100 dark:bg-rose-950/30" : usingCustom ? "bg-amber-100 dark:bg-amber-950/30" : "bg-muted")}>
          <Calendar className={cn("w-4 h-4", isBookAndBuy ? "text-rose-600" : usingCustom ? "text-amber-600" : "text-muted-foreground")} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-foreground truncate">
              {d.label || (d.departure_date ? `Departure ${idx + 1}` : `Date ${idx + 1}`)}
            </span>
            <span className={cn("text-[10px] px-1.5 py-0.5 rounded border font-medium flex-shrink-0", sc.class)}>{sc.label}</span>
            {usingCustom && <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-semibold flex-shrink-0">Custom Pricing</span>}
            {fillPct >= 80 && <AlertTriangle className="w-3 h-3 text-amber-500 flex-shrink-0" />}
            {isPast && <span className="text-[10px] text-muted-foreground italic flex-shrink-0">Past</span>}
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

          {/* Quick Per-Date Pricing */}
          <div className="border-t border-border pt-3 space-y-2">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Price for this Departure</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground">Selling Price / Pax</Label>
                <div className="relative"><span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">₱</span>
                  <Input type="number" className="pl-7 h-8 text-sm font-semibold" value={d.selling_price || ''} onChange={e => onRateChange(idx, 'selling_price', Number(e.target.value))} placeholder="e.g. 32,999" />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground">Twin Rate</Label>
                <div className="relative"><span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">₱</span>
                  <Input type="number" className="pl-7 h-8 text-sm" value={d.rate_twin || ''} onChange={e => onRateChange(idx, 'rate_twin', Number(e.target.value))} placeholder="Twin" />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground">Triple Rate</Label>
                <div className="relative"><span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">₱</span>
                  <Input type="number" className="pl-7 h-8 text-sm" value={d.rate_triple || ''} onChange={e => onRateChange(idx, 'rate_triple', Number(e.target.value))} placeholder="Triple" />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground">Single Rate</Label>
                <div className="relative"><span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">₱</span>
                  <Input type="number" className="pl-7 h-8 text-sm" value={d.rate_single || ''} onChange={e => onRateChange(idx, 'rate_single', Number(e.target.value))} placeholder="Single" />
                </div>
              </div>
            </div>
          </div>

          {/* Full Custom Pricing Toggle (advanced) */}
          <div className="border-t border-border pt-3 flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => onToggleCustom(idx, !usingCustom)}
              className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-semibold transition-all",
                usingCustom ? "bg-amber-500 text-white border-amber-500" : "bg-muted/50 text-muted-foreground border-border hover:border-amber-400 hover:text-amber-700")}
            >
              {usingCustom ? '✓ Full Custom Pricing' : '+ More Room Types & Child Rates'}
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
                <F label="Base Currency">
                  <Select value={dateCurr} onValueChange={v => onRateChange(idx, 'date_currency', v)}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>{CURRENCIES.map(c => <SelectItem key={c.value} value={c.value} className="text-xs">{c.value} – {c.label}</SelectItem>)}</SelectContent>
                  </Select>
                </F>
                <F label={`Base Cost (${dateCurrSymbol})`}>
                  <div className="relative"><span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{dateCurrSymbol}</span>
                    <Input type="number" className="pl-7 h-8 text-sm" value={d.base_price_foreign || ''} onChange={e => onRateChange(idx, 'base_price_foreign', Number(e.target.value))} />
                  </div>
                </F>
                {dateCurr !== 'PHP' && (
                  <F label="Exchange Rate (→ PHP)">
                    <Input type="number" className="h-8 text-sm" value={d.exchange_rate || ''} onChange={e => onRateChange(idx, 'exchange_rate', Number(e.target.value))} />
                  </F>
                )}
                {dateCurr !== 'PHP' && (
                  <F label="Base Cost PHP">
                    <div className="h-8 flex items-center px-3 bg-sky-50 dark:bg-sky-950/20 border border-sky-200 rounded-md">
                      <span className="text-sm font-bold text-sky-700">₱{dateBasePHP.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                    </div>
                  </F>
                )}
                <F label="Markup (₱)">
                  <div className="relative"><span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">₱</span>
                    <Input type="number" className="pl-7 h-8 text-sm" value={d.markup_amount || ''} onChange={e => onRateChange(idx, 'markup_amount', Number(e.target.value))} />
                  </div>
                </F>
                <F label="Selling Price">
                  <div className="h-8 flex items-center px-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-300 rounded-md">
                    <span className="text-sm font-black text-amber-700">₱{Number(d.selling_price || 0).toLocaleString()}</span>
                  </div>
                </F>
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

  // Commission base fields
  const commCurr = isCollective ? (form?.commission_currency || 'PHP') : 'PHP';
  const commCurrSym = CURRENCIES.find(c => c.value === commCurr)?.symbol || '₱';
  const commBase = isCollective ? (Number(form?.commission_base_foreign) || 0) : 0;
  const commRate = isCollective ? (Number(form?.commission_exchange_rate) || 1) : 1;
  const commPHP = commCurr === 'PHP' ? commBase : commBase * commRate;

  // Downpayment base fields — each Ops/PD has its own currency + rate
  const dpOpsCurr    = isCollective ? (form?.downpayment_ops_currency || 'PHP') : 'PHP';
  const dpOpsSym     = CURRENCIES.find(c => c.value === dpOpsCurr)?.symbol || '₱';
  const dpOpsRate    = isCollective ? (Number(form?.downpayment_ops_rate) || 1) : 1;
  const dpBaseOps    = isCollective ? (Number(form?.downpayment_base_ops) || 0) : 0;
  const dpOpsPhp     = dpOpsCurr === 'PHP' ? dpBaseOps : dpBaseOps * dpOpsRate;

  const dpPdCurr     = isCollective ? (form?.downpayment_pd_currency || 'PHP') : 'PHP';
  const dpPdSym      = CURRENCIES.find(c => c.value === dpPdCurr)?.symbol || '₱';
  const dpPdRate     = isCollective ? (Number(form?.downpayment_pd_rate) || 1) : 1;
  const dpBasePD     = isCollective ? (Number(form?.downpayment_base_pd) || 0) : 0;
  const dpPdPhp      = dpPdCurr === 'PHP' ? dpBasePD : dpBasePD * dpPdRate;

  const dpBase       = dpBaseOps + dpBasePD;
  const dpPHP        = dpOpsPhp + dpPdPhp;

  // Book & Buy base fields
  const bnbOpsCurr = isCollective ? (form?.book_buy_ops_currency || 'PHP') : 'PHP';
  const bnbOpsSym  = CURRENCIES.find(c => c.value === bnbOpsCurr)?.symbol || '₱';
  const bnbOpsRate = isCollective ? (Number(form?.book_buy_ops_rate) || 1) : 1;
  const bnbBaseOps = isCollective ? (Number(form?.book_buy_base_ops) || 0) : 0;
  const bnbOpsPhp  = bnbOpsCurr === 'PHP' ? bnbBaseOps : bnbBaseOps * bnbOpsRate;

  const bnbPdCurr  = isCollective ? (form?.book_buy_pd_currency || 'PHP') : 'PHP';
  const bnbPdSym   = CURRENCIES.find(c => c.value === bnbPdCurr)?.symbol || '₱';
  const bnbPdRate  = isCollective ? (Number(form?.book_buy_pd_rate) || 1) : 1;
  const bnbBasePD  = isCollective ? (Number(form?.book_buy_base_pd) || 0) : 0;
  const bnbPdPhp   = bnbPdCurr === 'PHP' ? bnbBasePD : bnbBasePD * bnbPdRate;

  const bnbBase    = bnbBaseOps + bnbBasePD;
  const bnbPHP     = bnbOpsPhp + bnbPdPhp;
  const bnbAmount  = isCollective ? (Number(form?.book_buy_required) || 0) : 0;

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

  // ── Downpayment fare-type selector ──
  const collectiveId = form?.id || '';
  const [dpType, setDpType] = useState(() =>
    collectiveId ? (localStorage.getItem(`dp_type_${collectiveId}`) || 'fixed') : 'fixed'
  );
  useEffect(() => {
    if (collectiveId) setDpType(localStorage.getItem(`dp_type_${collectiveId}`) || 'fixed');
  }, [collectiveId]);
  const handleDpTypeChange = (val) => {
    setDpType(val);
    if (collectiveId) localStorage.setItem(`dp_type_${collectiveId}`, val);
    pkgSet('dp_type', val);
    if (val === '50pct' && sp > 0) pkgSet('downpayment_required', Math.round(sp * 0.5));
    if (val === '30pct' && sp > 0) pkgSet('downpayment_required', Math.round(sp * 0.3));
    if (val === 'book_buy' && sp > 0) pkgSet('book_buy_required', Math.round(sp));
    if (val !== 'book_buy') pkgSet('book_buy_required', 0);
  };

  const [newDate, setNewDate] = useState(BLANK_DATE());
  const [addError, setAddError] = useState('');
  const [showTableImport, setShowTableImport] = useState(false);
  const [tableInput, setTableInput] = useState('');
  const [tableParsing, setTableParsing] = useState(false);
  const [tableParsed, setTableParsed] = useState(null);
  const [tableError, setTableError] = useState('');
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [dragOver, setDragOver] = useState(false);
  const tableFileRef = useRef();

  // ── Setters ──
  const pkgSet = (key, val) => {
    if (isCollective) setF(key, val);
    else {
      // Map to EZQuote field names
      const map = {
        currency: 'currency', base_price_foreign: 'base_cost_foreign', exchange_rate: 'exchange_rate',
        markup_amount: 'markup_php', markup_pct: 'markup_pct', _use_markup_pct: 'use_markup_pct',
        commission_amount: 'commission_per_pax', downpayment_required: 'downpayment_required',
        book_buy_ops_currency: 'book_buy_ops_currency', book_buy_ops_rate: 'book_buy_ops_rate', book_buy_base_ops: 'book_buy_base_ops',
        book_buy_pd_currency: 'book_buy_pd_currency', book_buy_pd_rate: 'book_buy_pd_rate', book_buy_base_pd: 'book_buy_base_pd',
        book_buy_required: 'book_buy_required',
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

  const handleTableParse = async (inputText) => {
    const content = inputText || tableInput;
    if (!content.trim()) return;
    setTableParsing(true);
    setTableError('');
    setTableParsed(null);
    const today = new Date().toISOString().split('T')[0];
    const year = new Date().getFullYear();
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are extracting travel departure schedules from a table or spreadsheet.
Today is ${today}. The current year is ${year} — use this for resolving month-only date ranges.

INPUT TABLE:
${content}

Extract EVERY row as a separate departure date entry. Each row typically has:
- A date range (e.g. "AUG 02-06", "SEP 04-08", "OCT 30-NOV 03")
- Available slots/seats (usually the last column or labeled "SLOTS", "AVAIL", "PAX")
- Selling price per person (e.g. 23,999 or ₱23,999)

For date ranges like "AUG 02-06": departure = ${year}-08-02, return = ${year}-08-06.
For cross-month ranges like "OCT 30-NOV 03": departure = ${year}-10-30, return = ${year}-11-03.
If month is already past for ${year}, use ${year + 1}.

Return JSON with a "dates" array. Each item:
- departure_date: YYYY-MM-DD
- return_date: YYYY-MM-DD
- label: human label like "Aug 02–06" or the text from the date column
- total_slots: integer (the available/remaining slot count from the table)
- booked_slots: 0 (default unless stated)
- selling_price: number (per person price, no commas/symbols)
- status: "open" unless table says "sold out", "closed", etc.

Extract ALL rows. Do not skip any row that has a date.`,
        response_json_schema: {
          type: 'object',
          properties: {
            dates: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  departure_date: { type: 'string' },
                  return_date: { type: 'string' },
                  label: { type: 'string' },
                  total_slots: { type: 'number' },
                  booked_slots: { type: 'number' },
                  selling_price: { type: 'number' },
                  status: { type: 'string' },
                }
              }
            }
          }
        }
      });
      const dates = (result?.dates || []).filter(d => d.departure_date);
      if (dates.length === 0) { setTableError('No departure dates found. Make sure the table has date and slot columns.'); }
      else {
        setTableParsed(dates);
        setSelectedRows(new Set(dates.map((_, i) => i)));
      }
    } catch (e) {
      setTableError('AI extraction failed. Please try again.');
    }
    setTableParsing(false);
  };

  const handleTableFileUpload = async (file) => {
    if (!file) return;
    setTableParsing(true);
    setTableError('');
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const extracted = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url,
        json_schema: { type: 'object', properties: { raw_text: { type: 'string' } } }
      });
      const rawText = extracted?.output?.raw_text || JSON.stringify(extracted?.output || '');
      setTableInput(rawText);
      await handleTableParse(rawText);
    } catch (e) {
      setTableError('File extraction failed. Try pasting the table text instead.');
      setTableParsing(false);
    }
  };

  const handleConfirmImport = () => {
    if (!tableParsed) return;
    const g = (key) => isCollective ? (form?.[key] || '') : (quote?.[key] || '');
    const toAdd = tableParsed
      .filter((_, i) => selectedRows.has(i))
      .map(d => ({
        label: d.label || '',
        departure_date: d.departure_date,
        return_date: d.return_date || '',
        cutoff_date: '',
        total_slots: Number(d.total_slots) || 0,
        booked_slots: Number(d.booked_slots) || 0,
        available_slots: Math.max(0, (Number(d.total_slots) || 0) - (Number(d.booked_slots) || 0)),
        status: d.status || 'open',
        notes: '',
        use_custom_pricing: false,
        selling_price: d.selling_price || sp || 0,
        base_price_foreign: baseForeign,
        exchange_rate: exRate,
        markup_amount: mPHP,
        rate_twin: g('rate_twin'), rate_twin_age_min: g('rate_twin_age_min'), rate_twin_age_max: g('rate_twin_age_max'),
        rate_triple: g('rate_triple'), rate_triple_age_min: g('rate_triple_age_min'), rate_triple_age_max: g('rate_triple_age_max'),
        rate_quad: g('rate_quad'), rate_quad_age_min: g('rate_quad_age_min'), rate_quad_age_max: g('rate_quad_age_max'),
        rate_single: g('rate_single'), rate_single_age_min: g('rate_single_age_min'), rate_single_age_max: g('rate_single_age_max'),
        rate_child_no_bed: g('rate_child_no_bed'), rate_child: g('rate_child'), rate_infant: g('rate_infant'),
      }));
    setDates(prev => [...prev, ...toAdd]);
    setTableParsed(null);
    setTableInput('');
    setShowTableImport(false);
    setSelectedRows(new Set());
  };

  const handleAddDate = () => {
    if (!newDate.departure_date) { setAddError('Departure date is required.'); return; }
    setAddError('');
    const label = newDate.label || [
      newDate.departure_date && new Date(newDate.departure_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      newDate.return_date && new Date(newDate.return_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    ].filter(Boolean).join(' – ');
    // Snapshot current package rates so this date's pricing stays independent of future package-level edits
    const g = (key) => isCollective ? (form?.[key] || '') : (quote?.[key] || '');
    setDates(prev => [...prev, {
      ...newDate, label,
      total_slots: Number(newDate.total_slots) || 0,
      booked_slots: Number(newDate.booked_slots) || 0,
      selling_price: sp || 0,
      base_price_foreign: baseForeign,
      exchange_rate: exRate,
      markup_amount: mPHP,
      rate_twin: g('rate_twin'), rate_twin_age_min: g('rate_twin_age_min'), rate_twin_age_max: g('rate_twin_age_max'),
      rate_triple: g('rate_triple'), rate_triple_age_min: g('rate_triple_age_min'), rate_triple_age_max: g('rate_triple_age_max'),
      rate_quad: g('rate_quad'), rate_quad_age_min: g('rate_quad_age_min'), rate_quad_age_max: g('rate_quad_age_max'),
      rate_single: g('rate_single'), rate_single_age_min: g('rate_single_age_min'), rate_single_age_max: g('rate_single_age_max'),
      rate_solo: g('rate_solo'), rate_solo_age_min: g('rate_solo_age_min'), rate_solo_age_max: g('rate_solo_age_max'),
      rate_single_supplement: g('rate_single_supplement'),
      rate_child_no_bed: g('rate_child_no_bed'), rate_child_no_bed_age_min: g('rate_child_no_bed_age_min'), rate_child_no_bed_age_max: g('rate_child_no_bed_age_max'),
      rate_child: g('rate_child'), rate_child_age_min: g('rate_child_age_min'), rate_child_age_max: g('rate_child_age_max'),
      rate_infant: g('rate_infant'), rate_infant_age_min: g('rate_infant_age_min'), rate_infant_age_max: g('rate_infant_age_max'),
    }]);
    setNewDate(BLANK_DATE());
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
  const handleDateRateChange = (idx, key, val) => setDates(prev => prev.map((d, i) => {
    if (i !== idx) return d;
    const updated = { ...d, [key]: val };
    // Auto-recompute selling price when base pricing fields change
    if (['base_price_foreign', 'exchange_rate', 'markup_amount', 'date_currency'].includes(key)) {
      const bf = Number(key === 'base_price_foreign' ? val : d.base_price_foreign) || 0;
      const er = Number(key === 'exchange_rate' ? val : d.exchange_rate) || 1;
      const mk = Number(key === 'markup_amount' ? val : d.markup_amount) || 0;
      const curr = key === 'date_currency' ? val : (d.date_currency || currency);
      const bphp = curr === 'PHP' ? bf : bf * er;
      if (bphp + mk > 0) updated.selling_price = bphp + mk;
    }
    return updated;
  }));

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
                <Input type="number" className="pl-7 h-9 text-sm" value={baseForeign || ''} onChange={e => pkgSet('base_price_foreign', Number(e.target.value))} />
              </div>
            </F>
            {currency !== 'PHP' && (
              <F label="Exchange Rate (→ PHP)"><Input type="number" className="h-9 text-sm" value={exRate || ''} onChange={e => pkgSet('exchange_rate', Number(e.target.value))} /></F>
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
                <Input type="number" className="pl-7 h-9 text-sm" value={(useMarkupPct ? markupPct : markupFixed) || ''} onChange={e => useMarkupPct ? pkgSet('markup_pct', Number(e.target.value)) : pkgSet('markup_amount', Number(e.target.value))} />
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
          {/* Row 3: Commission — inline currency + amount */}
          <div className="rounded-lg border border-sky-200 bg-sky-50/40 p-3">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs font-bold text-sky-700 w-full">Commission / Pax</span>
              <Select value={commCurr} onValueChange={v => {
                const rate = CURRENCIES.find(c => c.value === v)?.defaultRate || 1;
                pkgSet('commission_currency', v);
                pkgSet('commission_exchange_rate', rate);
                pkgSet('commission_amount', commCurr === 'PHP' ? commBase : commBase * rate);
              }}>
                <SelectTrigger className="h-9 text-xs w-24 flex-shrink-0"><SelectValue /></SelectTrigger>
                <SelectContent>{CURRENCIES.map(c => <SelectItem key={c.value} value={c.value} className="text-xs">{c.value}</SelectItem>)}</SelectContent>
              </Select>
              <div className="relative flex-1 min-w-32">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{commCurrSym}</span>
                <Input type="number" className="pl-7 h-9 text-sm" placeholder="0" value={commBase || ''} onChange={e => {
                  const v = Number(e.target.value);
                  pkgSet('commission_base_foreign', v);
                  pkgSet('commission_amount', commCurr === 'PHP' ? v : v * commRate);
                }} />
              </div>
              {commCurr !== 'PHP' && (
                <>
                  <span className="text-xs text-muted-foreground">× Rate</span>
                  <Input type="number" className="h-9 text-sm w-24" value={commRate || ''} onChange={e => {
                    const v = Number(e.target.value);
                    pkgSet('commission_exchange_rate', v);
                    pkgSet('commission_amount', commBase * v);
                  }} />
                  <span className="text-xs text-sky-600 font-bold">=</span>
                </>
              )}
              <div className="h-9 flex items-center px-3 bg-sky-100 border border-sky-300 rounded-md min-w-24">
                <span className="text-sm font-bold text-sky-700">₱{(commBase > 0 ? commPHP : commission).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
              </div>
            </div>
          </div>

          {/* Row 4: Downpayment */}
          <div className="rounded-lg border border-purple-200 bg-purple-50/40 p-3 space-y-3">
            <span className="text-xs font-bold text-purple-700">Required Downpayment</span>

            {/* Ops + PD side by side, each with inline currency */}
            <div className="grid grid-cols-2 gap-3">
              {/* Ops */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-purple-600">Operations (Ops)</span>
                <div className="flex gap-1.5">
                  <Select value={dpOpsCurr} onValueChange={v => {
                    const rate = CURRENCIES.find(c => c.value === v)?.defaultRate || 1;
                    pkgSet('downpayment_ops_currency', v);
                    pkgSet('downpayment_ops_rate', rate);
                    const opsPhp = v === 'PHP' ? dpBaseOps : dpBaseOps * rate;
                    pkgSet('downpayment_required', opsPhp + dpPdPhp);
                  }}>
                    <SelectTrigger className="h-9 text-xs w-24 flex-shrink-0"><SelectValue /></SelectTrigger>
                    <SelectContent>{CURRENCIES.map(c => <SelectItem key={c.value} value={c.value} className="text-xs">{c.value}</SelectItem>)}</SelectContent>
                  </Select>
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{dpOpsSym}</span>
                    <Input type="number" className="pl-7 h-9 text-sm" value={dpBaseOps || ''} onChange={e => {
                      const v = Number(e.target.value);
                      const opsPhp = dpOpsCurr === 'PHP' ? v : v * dpOpsRate;
                      pkgSet('downpayment_base_ops', v);
                      pkgSet('downpayment_required', opsPhp + dpPdPhp);
                    }} />
                  </div>
                </div>
                {dpOpsCurr !== 'PHP' && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">Rate → ₱</span>
                    <Input type="number" className="h-8 text-xs" value={dpOpsRate || ''} onChange={e => {
                      const v = Number(e.target.value);
                      pkgSet('downpayment_ops_rate', v);
                      pkgSet('downpayment_required', dpBaseOps * v + dpPdPhp);
                    }} />
                    {dpBaseOps > 0 && <span className="text-[10px] text-purple-600 font-semibold whitespace-nowrap">= ₱{(dpBaseOps * dpOpsRate).toLocaleString(undefined,{maximumFractionDigits:0})}</span>}
                  </div>
                )}
              </div>

              {/* PD */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-purple-600">Product Dev (PD)</span>
                <div className="flex gap-1.5">
                  <Select value={dpPdCurr} onValueChange={v => {
                    const rate = CURRENCIES.find(c => c.value === v)?.defaultRate || 1;
                    pkgSet('downpayment_pd_currency', v);
                    pkgSet('downpayment_pd_rate', rate);
                    const pdPhp = v === 'PHP' ? dpBasePD : dpBasePD * rate;
                    pkgSet('downpayment_required', dpOpsPhp + pdPhp);
                  }}>
                    <SelectTrigger className="h-9 text-xs w-24 flex-shrink-0"><SelectValue /></SelectTrigger>
                    <SelectContent>{CURRENCIES.map(c => <SelectItem key={c.value} value={c.value} className="text-xs">{c.value}</SelectItem>)}</SelectContent>
                  </Select>
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{dpPdSym}</span>
                    <Input type="number" className="pl-7 h-9 text-sm" value={dpBasePD || ''} onChange={e => {
                      const v = Number(e.target.value);
                      const pdPhp = dpPdCurr === 'PHP' ? v : v * dpPdRate;
                      pkgSet('downpayment_base_pd', v);
                      pkgSet('downpayment_required', dpOpsPhp + pdPhp);
                    }} />
                  </div>
                </div>
                {dpPdCurr !== 'PHP' && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">Rate → ₱</span>
                    <Input type="number" className="h-8 text-xs" value={dpPdRate || ''} onChange={e => {
                      const v = Number(e.target.value);
                      pkgSet('downpayment_pd_rate', v);
                      pkgSet('downpayment_required', dpOpsPhp + dpBasePD * v);
                    }} />
                    {dpBasePD > 0 && <span className="text-[10px] text-purple-600 font-semibold whitespace-nowrap">= ₱{(dpBasePD * dpPdRate).toLocaleString(undefined,{maximumFractionDigits:0})}</span>}
                  </div>
                )}
              </div>
            </div>

            {/* Payment mode toggle + conditional fields */}
            <div className="space-y-2.5">
              {/* 3-button toggle */}
              <div className="flex">
                <button
                  type="button"
                  onClick={() => handleDpTypeChange('fixed')}
                  className={cn(
                    "flex-1 px-3 py-2 text-xs font-semibold border rounded-l-lg transition-all",
                    dpType === 'fixed'
                      ? "bg-purple-600 text-white border-purple-600"
                      : "bg-white dark:bg-card text-purple-600 border-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/20"
                  )}
                >
                  Per Pax
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (dpType !== '50pct' && dpType !== '30pct') handleDpTypeChange('50pct');
                  }}
                  className={cn(
                    "flex-1 px-3 py-2 text-xs font-semibold border-y transition-all",
                    (dpType === '50pct' || dpType === '30pct')
                      ? "bg-purple-600 text-white border-purple-600"
                      : "bg-white dark:bg-card text-purple-600 border-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/20"
                  )}
                >
                  Fare Type
                </button>
                <button
                  type="button"
                  onClick={() => handleDpTypeChange('book_buy')}
                  className={cn(
                    "flex-1 px-3 py-2 text-xs font-semibold border rounded-r-lg transition-all",
                    dpType === 'book_buy'
                      ? "bg-purple-600 text-white border-purple-600"
                      : "bg-white dark:bg-card text-purple-600 border-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/20"
                  )}
                >
                  Book & Buy
                </button>
              </div>

              {/* Per Pax: editable amount */}
              {dpType === 'fixed' && (
                <div className="relative w-44">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-purple-600">₱</span>
                  <Input
                    type="number"
                    className="pl-7 h-9 text-sm font-bold border-purple-300 bg-purple-50 text-purple-700"
                    value={(dpBase > 0 ? dpPHP : dp) || ''}
                    onChange={e => pkgSet('downpayment_required', Number(e.target.value))}
                  />
                </div>
              )}

              {/* Fare Type: read-only amount + 50%/30% picker */}
              {(dpType === '50pct' || dpType === '30pct') && (
                <div className="flex gap-2 items-center flex-wrap">
                  <div className="relative w-44">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-purple-600">₱</span>
                    <Input
                      type="number"
                      readOnly
                      className="pl-7 h-9 text-sm font-bold border-purple-300 bg-purple-50/60 text-purple-700 cursor-default"
                      value={dp || ''}
                    />
                  </div>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => handleDpTypeChange('50pct')}
                      className={cn(
                        "px-3 py-1.5 rounded-l-md border text-xs font-semibold transition-all",
                        dpType === '50pct'
                          ? "bg-purple-500 text-white border-purple-500"
                          : "bg-white dark:bg-card text-purple-600 border-purple-300 hover:bg-purple-50"
                      )}
                    >
                      50%{sp > 0 ? ` — ₱${Math.round(sp * 0.5).toLocaleString()}` : ''}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDpTypeChange('30pct')}
                      className={cn(
                        "px-3 py-1.5 rounded-r-md border text-xs font-semibold transition-all",
                        dpType === '30pct'
                          ? "bg-purple-500 text-white border-purple-500"
                          : "bg-white dark:bg-card text-purple-600 border-purple-300 hover:bg-purple-50"
                      )}
                    >
                      30%{sp > 0 ? ` — ₱${Math.round(sp * 0.3).toLocaleString()}` : ''}
                    </button>
                  </div>
                </div>
              )}

              {/* Book & Buy: full fare indicator */}
              {dpType === 'book_buy' && (
                <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-purple-100 dark:bg-purple-950/30 border border-purple-300">
                  <span className="text-xs font-semibold text-purple-700">Full Fare Required</span>
                  {sp > 0 && (
                    <span className="text-sm font-black text-purple-700">₱{Math.round(sp).toLocaleString()}</span>
                  )}
                  <span className="text-[10px] text-purple-500 ml-auto">Sales charges full amount for close departures</span>
                </div>
              )}
            </div>
          </div>

          {/* Balance */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <F label="Balance after DP">
              <div className="h-9 flex items-center px-3 bg-muted rounded-md">
                <span className="text-sm font-semibold">₱{(sp - (dpBase > 0 ? dpPHP : dp)).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
              </div>
            </F>
          </div>
        </div>
      </div>

      {/* ── SECTION: Travel Dates ── */}
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="bg-slate-900 px-4 py-3 flex items-center gap-2 flex-wrap">
          <Calendar className="w-4 h-4 text-amber-400" />
          <span className="text-sm font-bold text-white">Travel Dates & Per-Date Pricing</span>
          {travelDates.length > 0 && (
            <span className="text-[10px] text-slate-400">{travelDates.length} departure{travelDates.length !== 1 ? 's' : ''}</span>
          )}
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => { setShowTableImport(v => !v); setTableParsed(null); setTableInput(''); setTableError(''); }}
              className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all border",
                showTableImport ? "bg-sky-500 text-white border-sky-500" : "bg-sky-600/20 text-sky-300 border-sky-600/40 hover:bg-sky-600/40")}
            >
              <Sparkles className="w-3 h-3" /> AI Import Table
            </button>
          </div>
        </div>

        {/* ── AI Table Import Panel ── */}
        {showTableImport && (
          <div className="border-b border-border bg-sky-950/20 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-sky-300">Import Dates from Table / Image</p>
                <p className="text-[11px] text-sky-400/70 mt-0.5">Paste spreadsheet cells or upload a screenshot — AI extracts all rows</p>
              </div>
              <button onClick={() => setShowTableImport(false)} className="text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
            </div>

            {!tableParsed ? (
              <>
                {/* Drop zone / textarea */}
                <div
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleTableFileUpload(f); }}
                  className={cn("relative rounded-lg border-2 border-dashed transition-colors", dragOver ? "border-sky-400 bg-sky-900/30" : "border-slate-600 hover:border-sky-500")}
                >
                  <textarea
                    value={tableInput}
                    onChange={e => setTableInput(e.target.value)}
                    placeholder={"Paste rows from your spreadsheet here — just copy cells and paste.\n\nOr drop an image/file of the table below.\n\nExample:\nAUG 02-06\t6D4N DA NANG\tOUT MANILA\tUOV34B1\t23,999\t18,000\tBAMBOO AIRWAYS\t11\nAUG 09-13\t6D4N DA NANG\tOUT MANILA\tUOV34B1\t23,999\t18,000\tBAMBOO AIRWAYS\t12"}
                    className="w-full h-36 bg-transparent text-xs text-slate-200 placeholder:text-slate-500 p-3 resize-none focus:outline-none"
                  />
                  {dragOver && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-sky-900/60">
                      <p className="text-sm font-semibold text-sky-300">Drop image or file here</p>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <input ref={tableFileRef} type="file" accept="image/*,.pdf,.xlsx,.csv,.txt" className="hidden"
                    onChange={e => handleTableFileUpload(e.target.files[0])} />
                  <Button type="button" size="sm" variant="outline" className="text-xs gap-1.5 border-slate-600 text-slate-300 hover:text-white"
                    onClick={() => tableFileRef.current?.click()} disabled={tableParsing}>
                    <Upload className="w-3 h-3" /> Upload Image / File
                  </Button>
                  <Button type="button" size="sm" className="text-xs gap-1.5 bg-sky-600 hover:bg-sky-500 text-white border-0 flex-1"
                    onClick={() => handleTableParse()} disabled={tableParsing || !tableInput.trim()}>
                    {tableParsing ? <><Loader2 className="w-3 h-3 animate-spin" /> Extracting...</> : <><Sparkles className="w-3 h-3" /> Extract Dates with AI</>}
                  </Button>
                </div>
                {tableError && <p className="text-xs text-rose-400 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> {tableError}</p>}
              </>
            ) : (
              /* ── Parsed Results Preview ── */
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <p className="text-sm font-semibold text-emerald-300">{tableParsed.length} dates extracted</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" className="text-[10px] text-sky-400 hover:text-sky-300 underline"
                      onClick={() => setSelectedRows(new Set(tableParsed.map((_, i) => i)))}>Select All</button>
                    <button type="button" className="text-[10px] text-sky-400 hover:text-sky-300 underline"
                      onClick={() => setSelectedRows(new Set())}>None</button>
                    <button type="button" className="text-[10px] text-slate-400 hover:text-white underline"
                      onClick={() => setTableParsed(null)}>← Re-paste</button>
                  </div>
                </div>
                <div className="max-h-52 overflow-y-auto space-y-1 pr-1">
                  {tableParsed.map((d, i) => (
                    <label key={i} className={cn("flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors",
                      selectedRows.has(i) ? "bg-emerald-900/30 border border-emerald-700/50" : "bg-slate-800/60 border border-slate-700/30")}
                    >
                      <input type="checkbox" checked={selectedRows.has(i)}
                        onChange={e => setSelectedRows(prev => { const s = new Set(prev); e.target.checked ? s.add(i) : s.delete(i); return s; })}
                        className="accent-emerald-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-semibold text-slate-200">{d.label || d.departure_date}</span>
                        {d.return_date && <span className="text-[10px] text-slate-400 ml-1">→ {d.return_date}</span>}
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0 text-[10px]">
                        <span className="text-amber-400 font-bold">{d.selling_price ? `₱${Number(d.selling_price).toLocaleString()}` : '—'}</span>
                        <span className="text-slate-300"><Users className="w-2.5 h-2.5 inline mr-0.5" />{d.total_slots || 0} slots</span>
                        <span className={cn("px-1.5 py-0.5 rounded-full font-medium",
                          d.status === 'sold_out' ? 'bg-rose-900/40 text-rose-400' : 'bg-emerald-900/40 text-emerald-400'
                        )}>{d.status || 'open'}</span>
                      </div>
                    </label>
                  ))}
                </div>
                <Button type="button" size="sm" className="w-full gradient-gold text-white border-0 gap-2 h-9"
                  onClick={handleConfirmImport} disabled={selectedRows.size === 0}>
                  <Plus className="w-3.5 h-3.5" /> Add {selectedRows.size} Selected Date{selectedRows.size !== 1 ? 's' : ''} to Schedule
                </Button>
              </div>
            )}
          </div>
        )}

        <div className="p-4 space-y-3">
          {/* Existing Date Cards */}
          {travelDates.length > 0 && (
            <div className="space-y-2">
              {travelDates.map((d, idx) => (
                <DateCard key={idx} d={d} idx={idx} packageRates={packageRates} packageCurrency={currency}
                  onUpdate={handleUpdate} onRemove={handleRemove} onToggleCustom={handleToggleCustom} onRateChange={handleDateRateChange}
                />
              ))}
            </div>
          )}

          {/* Always-visible Add Form */}
          <div className="border-2 border-dashed border-amber-300 dark:border-amber-700 rounded-xl p-4 bg-amber-50/40 dark:bg-amber-950/10 space-y-3">
            <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">
              {travelDates.length === 0 ? 'Add First Departure Date' : '+ Add Another Departure'}
            </p>
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
            <Button type="button" size="sm" className="h-8 text-xs gradient-gold text-white border-0 gap-1.5" onClick={handleAddDate}>
              <Plus className="w-3.5 h-3.5" /> Add Departure
            </Button>
          </div>
        </div>
      </div>

      {/* ── SECTION: Package Room Rates ── */}
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="bg-slate-800 px-4 py-2.5 flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-amber-400" />
          <span className="text-sm font-bold text-white">Package Room Rates</span>
          <span className="text-[10px] text-slate-400 ml-auto">Set per room type — each date can have its own price above</span>
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
    </div>
  );
}