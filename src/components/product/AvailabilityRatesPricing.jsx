import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronDown, ChevronUp, Info, Zap, ArrowRight, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Constants ────────────────────────────────────────────────────────────────

const CURRENCIES = [
  { value: 'PHP', symbol: '₱',   label: 'PHP – Philippine Peso',    defaultRate: 1 },
  { value: 'USD', symbol: '$',   label: 'USD – US Dollar',           defaultRate: 58 },
  { value: 'EUR', symbol: '€',   label: 'EUR – Euro',                defaultRate: 63 },
  { value: 'JPY', symbol: '¥',   label: 'JPY – Japanese Yen',        defaultRate: 0.39 },
  { value: 'KRW', symbol: '₩',   label: 'KRW – Korean Won',          defaultRate: 0.044 },
  { value: 'SGD', symbol: 'S$',  label: 'SGD – Singapore Dollar',    defaultRate: 43 },
  { value: 'THB', symbol: '฿',   label: 'THB – Thai Baht',           defaultRate: 1.6 },
  { value: 'AUD', symbol: 'A$',  label: 'AUD – Australian Dollar',   defaultRate: 38 },
  { value: 'HKD', symbol: 'HK$', label: 'HKD – Hong Kong Dollar',    defaultRate: 7.5 },
  { value: 'CNY', symbol: 'CN¥', label: 'CNY – Chinese Yuan',        defaultRate: 8 },
];

const RATE_TYPES = [
  { key: 'twin',         label: 'Twin Sharing',      desc: '2 pax · shared room',      color: 'text-amber-700',   bg: 'bg-amber-50 dark:bg-amber-950/20',   border: 'border-amber-200 dark:border-amber-800' },
  { key: 'triple',       label: 'Triple Sharing',    desc: '3 pax · shared room',      color: 'text-sky-700',     bg: 'bg-sky-50 dark:bg-sky-950/20',       border: 'border-sky-200 dark:border-sky-800' },
  { key: 'quad',         label: 'Quad Sharing',      desc: '4 pax · shared room',      color: 'text-emerald-700', bg: 'bg-emerald-50 dark:bg-emerald-950/20', border: 'border-emerald-200 dark:border-emerald-800' },
  { key: 'single',       label: 'Single Occupancy',  desc: '1 pax · private room',     color: 'text-purple-700',  bg: 'bg-purple-50 dark:bg-purple-950/20', border: 'border-purple-200 dark:border-purple-800' },
  { key: 'child_bed',    label: 'Child With Bed',    desc: 'Child + extra bed',         color: 'text-teal-700',    bg: 'bg-teal-50 dark:bg-teal-950/20',     border: 'border-teal-200 dark:border-teal-800' },
  { key: 'child_no_bed', label: 'Child No Bed',      desc: 'Child · sharing bed',       color: 'text-orange-700',  bg: 'bg-orange-50 dark:bg-orange-950/20', border: 'border-orange-200 dark:border-orange-800' },
  { key: 'infant',       label: 'Infant Rate',       desc: 'Under 2 y/o',              color: 'text-rose-700',    bg: 'bg-rose-50 dark:bg-rose-950/20',     border: 'border-rose-200 dark:border-rose-800' },
];

const BLANK_RATES = () => Object.fromEntries(RATE_TYPES.map(r => [r.key, { foreign: '', markup: 0, commission: 0, downpayment: 0 }]));

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n) { return '₱' + Math.abs(Number(n) || 0).toLocaleString(undefined, { maximumFractionDigits: 0 }); }
function pctOf(val, base) { return base > 0 ? ((val / base) * 100).toFixed(1) + '%' : '—'; }

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Panel({ title, subtitle, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border-2 border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
      <button
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-800 dark:bg-slate-900 text-left"
        onClick={() => setOpen(o => !o)}
      >
        <div>
          <p className="text-xs font-bold text-white tracking-wide">{title}</p>
          {subtitle && <p className="text-[10px] text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>
      {open && <div className="bg-white dark:bg-card">{children}</div>}
    </div>
  );
}

// ─── Rate Row in table ────────────────────────────────────────────────────────

function RateRow({ rateType, rateData, effectiveRate, currency, onUpdate, commission, downpayment }) {
  const foreign = Number(rateData.foreign) || 0;
  const markup = Number(rateData.markup) || 0;
  const basePHP = currency === 'PHP' ? foreign : foreign * effectiveRate;
  const sellingPrice = basePHP + markup;
  const comm = Number(rateData.commission) > 0 ? Number(rateData.commission) : commission;
  const dp = Number(rateData.downpayment) > 0 ? Number(rateData.downpayment) : downpayment;
  const netRev = sellingPrice - comm - dp;
  const isProfitable = netRev >= 0;

  const sym = CURRENCIES.find(c => c.value === currency)?.symbol || '₱';

  return (
    <tr className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
      {/* Rate Type */}
      <td className="px-3 py-2.5 min-w-[140px]">
        <p className={cn("text-xs font-semibold", rateType.color)}>{rateType.label}</p>
        <p className="text-[10px] text-muted-foreground">{rateType.desc}</p>
      </td>

      {/* Foreign Cost */}
      <td className="px-2 py-2 min-w-[110px]">
        <div className="relative">
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-medium">{sym}</span>
          <input
            type="number"
            className="w-full pl-6 pr-2 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-transparent text-right tabular-nums focus:outline-none focus:border-amber-400 focus:bg-amber-50 dark:focus:bg-amber-950/20 transition-colors"
            placeholder="0"
            value={rateData.foreign}
            onChange={e => onUpdate('foreign', e.target.value)}
          />
        </div>
      </td>

      {/* PHP Base */}
      <td className="px-2 py-2 min-w-[100px]">
        <div className="text-right px-2 py-1.5 bg-sky-50 dark:bg-sky-950/20 rounded-lg">
          <p className="text-xs font-semibold text-sky-700 tabular-nums">₱{basePHP.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
        </div>
      </td>

      {/* Markup */}
      <td className="px-2 py-2 min-w-[100px]">
        <div className="relative">
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">₱</span>
          <input
            type="number"
            className="w-full pl-5 pr-2 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-transparent text-right tabular-nums focus:outline-none focus:border-emerald-400 focus:bg-emerald-50 dark:focus:bg-emerald-950/20 transition-colors"
            placeholder="0"
            value={rateData.markup || ''}
            onChange={e => onUpdate('markup', Number(e.target.value))}
          />
        </div>
      </td>

      {/* Selling Price */}
      <td className="px-2 py-2 min-w-[100px]">
        <div className="text-right px-2 py-1.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-700 rounded-lg">
          <p className="text-xs font-black text-amber-700 tabular-nums">₱{sellingPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
        </div>
      </td>

      {/* Commission */}
      <td className="px-2 py-2 min-w-[100px]">
        <div className="relative">
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">₱</span>
          <input
            type="number"
            className="w-full pl-5 pr-2 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-transparent text-right tabular-nums focus:outline-none focus:border-rose-400 focus:bg-rose-50 dark:focus:bg-rose-950/20 transition-colors"
            placeholder={commission > 0 ? String(commission) : '0'}
            value={rateData.commission || ''}
            onChange={e => onUpdate('commission', Number(e.target.value))}
          />
        </div>
      </td>

      {/* Net Revenue */}
      <td className="px-2 py-2 min-w-[110px]">
        <div className={cn("text-right px-2 py-1.5 rounded-lg border", isProfitable ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800' : 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800')}>
          <p className={cn("text-xs font-bold tabular-nums", isProfitable ? 'text-emerald-700' : 'text-rose-700')}>
            {isProfitable ? '' : '-'}{fmt(netRev)}
          </p>
          <p className="text-[9px] text-muted-foreground">{pctOf(Math.abs(netRev), sellingPrice)}</p>
        </div>
      </td>
    </tr>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function AvailabilityRatesPricing({ quote, setQ }) {
  const [rates, setRates] = useState(BLANK_RATES());
  const [exCurrency, setExCurrency] = useState(quote?.currency || 'USD');
  const [exRate, setExRate] = useState(quote?.exchange_rate || 58);
  const [exBuffer, setExBuffer] = useState(0);

  const effectiveRate = Number(exRate) + Number(exBuffer);
  const currSymbol = CURRENCIES.find(c => c.value === exCurrency)?.symbol || '$';
  const globalCommission = Number(quote?.commission_per_pax) || 0;
  const globalDownpayment = Number(quote?.downpayment_required) || 0;

  const updateRate = (key, field, val) => {
    setRates(prev => ({ ...prev, [key]: { ...prev[key], [field]: val } }));
  };

  const handleCurrencyChange = (val) => {
    const found = CURRENCIES.find(c => c.value === val);
    setExCurrency(val);
    if (val === 'PHP') setExRate(1);
    else if (found?.defaultRate) setExRate(found.defaultRate);
    // Propagate to parent quote if setter exists
    if (setQ) {
      setQ('currency', val);
      if (val === 'PHP') setQ('exchange_rate', 1);
      else if (found?.defaultRate) setQ('exchange_rate', found.defaultRate);
    }
  };

  const handleRateChange = (val) => {
    setExRate(val);
    if (setQ) setQ('exchange_rate', Number(val));
  };

  // Summary row computations
  const summary = useMemo(() => RATE_TYPES.map(rt => {
    const rd = rates[rt.key];
    const foreign = Number(rd.foreign) || 0;
    const markup = Number(rd.markup) || 0;
    const basePHP = exCurrency === 'PHP' ? foreign : foreign * effectiveRate;
    const sellingPrice = basePHP + markup;
    const comm = Number(rd.commission) > 0 ? Number(rd.commission) : globalCommission;
    const dp = Number(rd.downpayment) > 0 ? Number(rd.downpayment) : globalDownpayment;
    const netRev = sellingPrice - comm - dp;
    return { ...rt, foreign, basePHP, markup, sellingPrice, comm, dp, netRev, hasData: foreign > 0 || sellingPrice > 0 };
  }), [rates, exCurrency, effectiveRate, globalCommission, globalDownpayment]);

  const activeSummary = summary.filter(s => s.hasData);

  return (
    <div className="space-y-4">

      {/* ── Exchange Rate Module ─────────────────────────────────────────────── */}
      <Panel title="Exchange Rate Management" subtitle="Configure base currency and conversion buffer — all rates auto-update">
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Currency */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Base Currency</Label>
              <Select value={exCurrency} onValueChange={handleCurrencyChange}>
                <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map(c => <SelectItem key={c.value} value={c.value} className="text-xs">{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Exchange Rate */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Exchange Rate
                <span className="ml-1 text-[9px] text-emerald-600 bg-emerald-50 border border-emerald-200 px-1 py-0.5 rounded font-medium normal-case">
                  <Zap className="w-2 h-2 inline" /> Live
                </span>
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-medium">{currSymbol}1 =</span>
                <Input
                  type="number"
                  step="0.01"
                  className="pl-11 h-9 text-sm font-semibold"
                  value={exRate}
                  onChange={e => handleRateChange(e.target.value)}
                  disabled={exCurrency === 'PHP'}
                />
              </div>
            </div>

            {/* Buffer */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Rate Buffer (+₱)
                <span className="ml-1 text-[9px] text-sky-600 bg-sky-50 border border-sky-200 px-1 py-0.5 rounded font-medium normal-case">Hedge</span>
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">+</span>
                <Input
                  type="number"
                  step="0.01"
                  className="pl-6 h-9 text-sm"
                  placeholder="0.00"
                  value={exBuffer || ''}
                  onChange={e => setExBuffer(Number(e.target.value))}
                  disabled={exCurrency === 'PHP'}
                />
              </div>
            </div>

            {/* Effective Rate */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Effective Rate Used</Label>
              <div className="h-9 flex items-center justify-between px-3 bg-amber-50 dark:bg-amber-950/20 border-2 border-amber-300 dark:border-amber-700 rounded-lg">
                <span className="text-[10px] text-muted-foreground">{currSymbol}1 =</span>
                <span className="text-sm font-black text-amber-700">₱{effectiveRate.toLocaleString(undefined, { maximumFractionDigits: 4 })}</span>
              </div>
            </div>
          </div>

          {/* Rate preview strip */}
          {exCurrency !== 'PHP' && (
            <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-xs flex-wrap">
              <span className="text-muted-foreground font-medium">Quick Preview:</span>
              {[100, 500, 1000, 5000, 10000].map(val => (
                <span key={val} className="flex items-center gap-1.5">
                  <span className="text-muted-foreground">{currSymbol}{val.toLocaleString()}</span>
                  <ArrowRight className="w-3 h-3 text-slate-400" />
                  <span className="font-bold text-foreground">₱{(val * effectiveRate).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                </span>
              ))}
              {exBuffer > 0 && (
                <span className="ml-auto text-[10px] text-sky-600 font-medium">Buffer: +₱{exBuffer}/unit applied</span>
              )}
            </div>
          )}
        </div>
      </Panel>

      {/* ── Availability Rates Table ─────────────────────────────────────────── */}
      <Panel title="Availability Rates" subtitle="Occupancy-based pricing — click any field to edit, all columns auto-compute live">
        <div className="p-4 space-y-3">
          {/* Info note */}
          <div className="flex items-start gap-2 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2">
            <Info className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Enter the <strong>foreign cost</strong> per occupancy type. PHP conversion is automatic using the effective exchange rate above.
              Commission/Downpayment fields inherit global values unless overridden per rate type.
              Net Revenue = Selling Price − Commission − Downpayment.
            </p>
          </div>

          {/* Global defaults display */}
          {(globalCommission > 0 || globalDownpayment > 0) && (
            <div className="flex gap-3 text-[10px] text-muted-foreground flex-wrap">
              {globalCommission > 0 && <span className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 px-2 py-1 rounded text-rose-600">Global Commission: ₱{globalCommission.toLocaleString()}/pax</span>}
              {globalDownpayment > 0 && <span className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 px-2 py-1 rounded text-amber-600">Global Downpayment: ₱{globalDownpayment.toLocaleString()}</span>}
              <span className="text-muted-foreground/60 italic">Leave override fields blank to use global values.</span>
            </div>
          )}

          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700">
                  <th className="text-left px-3 py-2.5 text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wide">Rate Type</th>
                  <th className="text-right px-3 py-2.5 text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wide">Cost ({currSymbol})</th>
                  <th className="text-right px-3 py-2.5 text-[10px] font-bold text-sky-600 uppercase tracking-wide">PHP Base</th>
                  <th className="text-right px-3 py-2.5 text-[10px] font-bold text-emerald-600 uppercase tracking-wide">Markup (₱)</th>
                  <th className="text-right px-3 py-2.5 text-[10px] font-bold text-amber-600 uppercase tracking-wide">Selling Price</th>
                  <th className="text-right px-3 py-2.5 text-[10px] font-bold text-rose-600 uppercase tracking-wide">Commission</th>
                  <th className="text-right px-3 py-2.5 text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wide">Net Revenue</th>
                </tr>
              </thead>
              <tbody>
                {RATE_TYPES.map(rt => (
                  <RateRow
                    key={rt.key}
                    rateType={rt}
                    rateData={rates[rt.key]}
                    effectiveRate={effectiveRate}
                    currency={exCurrency}
                    onUpdate={(field, val) => updateRate(rt.key, field, val)}
                    commission={globalCommission}
                    downpayment={globalDownpayment}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Panel>

      {/* ── Net Revenue Summary ──────────────────────────────────────────────── */}
      {activeSummary.length > 0 && (
        <div className="rounded-xl border-2 border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
          <div className="bg-slate-800 dark:bg-slate-900 px-4 py-3">
            <p className="text-xs font-bold text-white tracking-wide">Pricing Summary · All Rate Types</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Live net revenue breakdown per occupancy category</p>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-card">
            {/* Header */}
            <div className="grid grid-cols-6 gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-900/40 text-[9px] font-bold text-muted-foreground uppercase tracking-wide">
              <span>Rate Type</span>
              <span className="text-right text-sky-600">PHP Base</span>
              <span className="text-right text-emerald-600">Selling Price</span>
              <span className="text-right text-rose-600">Commission</span>
              <span className="text-right text-amber-600">Downpayment</span>
              <span className="text-right">Net Revenue</span>
            </div>
            {activeSummary.map(s => {
              const isProfitable = s.netRev >= 0;
              return (
                <div key={s.key} className="grid grid-cols-6 gap-2 px-4 py-2.5 items-center hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <div>
                    <p className={cn("text-xs font-semibold", s.color)}>{s.label}</p>
                    <p className="text-[9px] text-muted-foreground">{s.desc}</p>
                  </div>
                  <p className="text-xs text-right font-medium text-sky-700 tabular-nums">₱{s.basePHP.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                  <p className="text-xs text-right font-bold text-amber-700 tabular-nums">₱{s.sellingPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                  <div className="text-right">
                    <p className="text-xs font-medium text-rose-600 tabular-nums">- ₱{s.comm.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                    <p className="text-[9px] text-muted-foreground">{pctOf(s.comm, s.sellingPrice)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium text-amber-600 tabular-nums">- ₱{s.dp.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                    <p className="text-[9px] text-muted-foreground">{pctOf(s.dp, s.sellingPrice)}</p>
                  </div>
                  <div className={cn("text-right px-2 py-1 rounded-lg", isProfitable ? 'bg-emerald-50 dark:bg-emerald-950/20' : 'bg-rose-50 dark:bg-rose-950/20')}>
                    <p className={cn("text-xs font-bold tabular-nums", isProfitable ? 'text-emerald-700' : 'text-rose-600')}>
                      {isProfitable ? '' : '- '}{fmt(s.netRev)}
                    </p>
                    <p className="text-[9px] text-muted-foreground">{pctOf(Math.abs(s.netRev), s.sellingPrice)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}