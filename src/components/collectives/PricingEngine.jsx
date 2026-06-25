// @ts-nocheck
import { useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, ArrowRight, Zap, Info, Minus } from 'lucide-react';

const CURRENCIES = [
  { value: 'PHP', label: 'PHP ₱', symbol: '₱', defaultRate: 1 },
  { value: 'USD', label: 'USD $', symbol: '$', defaultRate: 58 },
  { value: 'EUR', label: 'EUR €', symbol: '€', defaultRate: 63 },
  { value: 'JPY', label: 'JPY ¥', symbol: '¥', defaultRate: 0.39 },
  { value: 'KRW', label: 'KRW ₩', symbol: '₩', defaultRate: 0.044 },
  { value: 'SGD', label: 'SGD S$', symbol: 'S$', defaultRate: 43 },
  { value: 'THB', label: 'THB ฿', symbol: '฿', defaultRate: 1.6 },
  { value: 'AUD', label: 'AUD A$', symbol: 'A$', defaultRate: 38 },
  { value: 'CNY', label: 'CNY ¥', symbol: 'CN¥', defaultRate: 8 },
  { value: 'HKD', label: 'HKD HK$', symbol: 'HK$', defaultRate: 7.5 },
];

export default function PricingEngine({ formData, setFormData }) {
  const currency = formData.base_price_currency || 'PHP';
  const foreignPrice = Number(formData.base_price_foreign) || 0;
  const exchangeRate = Number(formData.exchange_rate) || 1;
  const markupAmount = Number(formData.markup_amount) || 0;

  const basePHP = currency === 'PHP' ? foreignPrice : foreignPrice * exchangeRate;
  const sellingPrice = basePHP + markupAmount;
  const downpayment = Number(formData.downpayment_required) || 0;
  const balance = sellingPrice - downpayment;
  const commission = Number(formData.commission_amount) || 0;

  const currencyInfo = CURRENCIES.find(c => c.value === currency);
  const currencySymbol = currencyInfo?.symbol || '₱';

  // When currency changes, auto-fill the suggested exchange rate
  const handleCurrencyChange = (val) => {
    const selected = CURRENCIES.find(c => c.value === val);
    setFormData(prev => ({
      ...prev,
      base_price_currency: val,
      exchange_rate: val === 'PHP' ? 1 : (selected?.defaultRate || prev.exchange_rate || 1),
    }));
  };

  // Auto-update selling_price and base_price_php in parent form
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      base_price_php: basePHP,
      selling_price: sellingPrice,
      base_price: sellingPrice,
      currency: 'PHP',
    }));
  }, [foreignPrice, exchangeRate, markupAmount]);

  const set = (key, val) => setFormData(prev => ({ ...prev, [key]: val }));

  return (
    <div className="space-y-4">
      <h4 className="font-semibold text-sm font-jakarta text-foreground flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-primary" /> Pricing Engine
      </h4>

      {/* Currency & Base Price */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Base Currency</Label>
          <Select value={currency} onValueChange={handleCurrencyChange}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {CURRENCIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Base Cost Price ({currencySymbol})</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">{currencySymbol}</span>
            <Input
              type="number"
              className="pl-7"
              placeholder="0"
              value={formData.base_price_foreign || ''}
              onChange={e => set('base_price_foreign', Number(e.target.value))}
            />
          </div>
        </div>
        {currency !== 'PHP' && (
          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1">
              Exchange Rate (→ ₱)
              <span className="text-[9px] text-emerald-600 bg-emerald-50 border border-emerald-200 px-1 py-0.5 rounded font-medium">
                <Zap className="w-2 h-2 inline" /> Auto-filled
              </span>
            </Label>
            <Input
              type="number"
              step="0.01"
              placeholder={currencyInfo?.defaultRate?.toString() || '1'}
              value={formData.exchange_rate || ''}
              onChange={e => set('exchange_rate', Number(e.target.value))}
            />
          </div>
        )}
      </div>

      {/* Live PHP conversion — always visible when foreign currency selected */}
      {currency !== 'PHP' && foreignPrice > 0 && (
        <div className="flex items-center gap-2 bg-sky-50 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-800 rounded-lg px-4 py-2.5 text-sm">
          <span className="text-muted-foreground">{currencySymbol}{foreignPrice.toLocaleString()} × {exchangeRate} =</span>
          <ArrowRight className="w-3.5 h-3.5 text-sky-500" />
          <span className="font-bold text-sky-700 dark:text-sky-400 text-base">₱{basePHP.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
          <span className="text-[10px] text-muted-foreground ml-auto">Auto-converted to PHP</span>
        </div>
      )}

      {/* Markup & Commission */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Markup Amount (₱)</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₱</span>
            <Input type="number" className="pl-7" placeholder="0" value={formData.markup_amount || ''} onChange={e => set('markup_amount', Number(e.target.value))} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Fixed Commission (₱ per booking)</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₱</span>
            <Input type="number" className="pl-7" placeholder="0" value={formData.commission_amount || ''} onChange={e => set('commission_amount', Number(e.target.value))} />
          </div>
        </div>
      </div>

      {/* Pricing Flow Summary */}
      {foreignPrice > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800">
          <div className="flex flex-wrap items-center justify-center gap-2 text-center">
            <div className="px-3 py-2 bg-white dark:bg-card rounded-lg shadow-sm">
              <p className="text-[10px] text-muted-foreground">Base ({currency})</p>
              <p className="font-bold text-sm font-jakarta">{currencySymbol}{foreignPrice.toLocaleString()}</p>
            </div>
            {currency !== 'PHP' && (
              <>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
                <div className="px-3 py-2 bg-white dark:bg-card rounded-lg shadow-sm">
                  <p className="text-[10px] text-muted-foreground">PHP Equivalent</p>
                  <p className="font-bold text-sm font-jakarta text-sky-600">₱{basePHP.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                </div>
              </>
            )}
            {markupAmount > 0 && (
              <>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
                <div className="px-3 py-2 bg-white dark:bg-card rounded-lg shadow-sm">
                  <p className="text-[10px] text-muted-foreground">+ Markup</p>
                  <p className="font-bold text-sm font-jakarta text-emerald-600">+₱{markupAmount.toLocaleString()}</p>
                </div>
              </>
            )}
            <ArrowRight className="w-4 h-4 text-primary" />
            <div className="px-4 py-2 bg-primary rounded-lg shadow-sm">
              <p className="text-[10px] text-primary-foreground/80">Selling Price</p>
              <p className="font-bold text-base font-jakarta text-primary-foreground">₱{sellingPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
            </div>
          </div>
          {commission > 0 && (
            <p className="text-center text-xs text-muted-foreground mt-2">
              Net after commission: <span className="font-semibold text-emerald-600">₱{(sellingPrice - commission).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
            </p>
          )}
        </div>
      )}

      {/* Downpayment */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Required Downpayment (₱)</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₱</span>
            <Input type="number" className="pl-7" placeholder="0" value={formData.downpayment_required || ''} onChange={e => set('downpayment_required', Number(e.target.value))} />
          </div>
        </div>
        {sellingPrice > 0 && downpayment > 0 && (
          <div className="space-y-1.5">
            <Label className="text-xs">Remaining Balance</Label>
            <div className="h-9 px-3 flex items-center rounded-md border border-border bg-muted/50 text-sm font-semibold text-foreground">
              ₱{balance.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
          </div>
        )}
      </div>

      {/* ── NET REVENUE BREAKDOWN ─────────────────────────────────────────── */}
      {sellingPrice > 0 && (
        <NetRevenueBreakdown
          sellingPrice={sellingPrice}
          commission={commission}
          downpayment={downpayment}
        />
      )}
    </div>
  );
}

// ── Net Revenue Breakdown Component ────────────────────────────────────────────
function NetRevenueBreakdown({ sellingPrice, commission, downpayment }) {
  const netRemaining = sellingPrice - commission - downpayment;
  const isProfitable = netRemaining >= 0;

  const fmt = (n) => '₱' + Math.abs(n).toLocaleString(undefined, { maximumFractionDigits: 0 });
  const pct = (n) => sellingPrice > 0 ? ((n / sellingPrice) * 100).toFixed(1) + '%' : '0%';

  return (
    <div className="rounded-xl border-2 border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
      {/* Header */}
      <div className="bg-slate-800 dark:bg-slate-900 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-bold text-white tracking-wide uppercase">Net Revenue Breakdown</span>
        </div>
        <div className="group relative">
          <Info className="w-3.5 h-3.5 text-slate-400 cursor-help" />
          <div className="absolute right-0 bottom-full mb-2 w-64 bg-slate-900 text-slate-200 text-[10px] leading-relaxed rounded-lg px-3 py-2.5 shadow-xl border border-slate-700 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
            Net Remaining Revenue shows the estimated remaining amount after deducting commission and required downpayment from the selling price.
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="bg-white dark:bg-card divide-y divide-slate-100 dark:divide-slate-800">
        {/* Selling Price row */}
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <p className="text-xs font-semibold text-foreground">Selling Price</p>
            <p className="text-[10px] text-muted-foreground">Base revenue per pax</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold font-jakarta text-foreground">{fmt(sellingPrice)}</p>
            <p className="text-[10px] text-muted-foreground">100%</p>
          </div>
        </div>

        {/* LESS label */}
        <div className="px-4 py-1.5 bg-slate-50 dark:bg-muted/30">
          <p className="text-[9px] font-bold tracking-widest text-muted-foreground uppercase">Less Deductions</p>
        </div>

        {/* Commission row */}
        <div className="flex items-center justify-between px-4 py-3 pl-6">
          <div className="flex items-center gap-2">
            <Minus className="w-3 h-3 text-rose-400 flex-shrink-0" />
            <div>
              <p className="text-xs font-medium text-foreground">Commission</p>
              <p className="text-[10px] text-muted-foreground">Fixed per booking</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold font-jakarta text-rose-600">
              {commission > 0 ? `- ${fmt(commission)}` : '₱0'}
            </p>
            <p className="text-[10px] text-muted-foreground">{commission > 0 ? pct(commission) : '—'}</p>
          </div>
        </div>

        {/* Downpayment row */}
        <div className="flex items-center justify-between px-4 py-3 pl-6">
          <div className="flex items-center gap-2">
            <Minus className="w-3 h-3 text-amber-400 flex-shrink-0" />
            <div>
              <p className="text-xs font-medium text-foreground">Required Downpayment</p>
              <p className="text-[10px] text-muted-foreground">Initial collection from client</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold font-jakarta text-amber-600">
              {downpayment > 0 ? `- ${fmt(downpayment)}` : '₱0'}
            </p>
            <p className="text-[10px] text-muted-foreground">{downpayment > 0 ? pct(downpayment) : '—'}</p>
          </div>
        </div>

        {/* Divider line */}
        <div className="mx-4 border-t-2 border-dashed border-slate-200 dark:border-slate-700" />

        {/* NET REMAINING REVENUE */}
        <div className={`flex items-center justify-between px-4 py-4 ${isProfitable ? 'bg-emerald-50 dark:bg-emerald-950/20' : 'bg-rose-50 dark:bg-rose-950/20'}`}>
          <div>
            <p className="text-xs font-bold text-foreground uppercase tracking-wide">Net Remaining Revenue</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">After all deductions</p>
          </div>
          <div className="text-right">
            <p className={`text-xl font-bold font-jakarta ${isProfitable ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {isProfitable ? '' : '- '}{fmt(netRemaining)}
            </p>
            <p className={`text-[10px] font-semibold mt-0.5 ${isProfitable ? 'text-emerald-500' : 'text-rose-500'}`}>
              {pct(Math.abs(netRemaining))} of selling price · {isProfitable ? '✓ Profitable' : '⚠ Negative'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}