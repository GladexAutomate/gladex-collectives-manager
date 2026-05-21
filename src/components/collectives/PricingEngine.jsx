import { useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, ArrowRight } from 'lucide-react';

const CURRENCIES = [
  { value: 'PHP', label: 'PHP ₱', symbol: '₱' },
  { value: 'USD', label: 'USD $', symbol: '$' },
  { value: 'EUR', label: 'EUR €', symbol: '€' },
  { value: 'JPY', label: 'JPY ¥', symbol: '¥' },
  { value: 'KRW', label: 'KRW ₩', symbol: '₩' },
  { value: 'SGD', label: 'SGD S$', symbol: 'S$' },
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
  const profitPerPax = sellingPrice - basePHP - commission;

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
  const currencySymbol = CURRENCIES.find(c => c.value === currency)?.symbol || '₱';

  return (
    <div className="space-y-4">
      <h4 className="font-semibold text-sm font-jakarta text-foreground flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-primary" /> Advanced Pricing Engine
      </h4>

      {/* Currency & Base Price */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Base Currency</Label>
          <Select value={currency} onValueChange={v => set('base_price_currency', v)}>
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
            <Input type="number" className="pl-7" placeholder="0" value={formData.base_price_foreign || ''} onChange={e => set('base_price_foreign', Number(e.target.value))} />
          </div>
        </div>
        {currency !== 'PHP' && (
          <div className="space-y-1.5">
            <Label className="text-xs">Exchange Rate (→ PHP)</Label>
            <Input type="number" step="0.01" placeholder="58.00" value={formData.exchange_rate || ''} onChange={e => set('exchange_rate', Number(e.target.value))} />
          </div>
        )}
      </div>

      {/* Markup & Selling Price */}
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

      {/* Pricing Breakdown Visual */}
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
                  <p className="text-[10px] text-muted-foreground">Converted PHP</p>
                  <p className="font-bold text-sm font-jakarta text-sky-600">₱{basePHP.toLocaleString()}</p>
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
              <p className="font-bold text-base font-jakarta text-primary-foreground">₱{sellingPrice.toLocaleString()}</p>
            </div>
          </div>
          {commission > 0 && (
            <p className="text-center text-xs text-muted-foreground mt-2">
              Net after commission: <span className="font-semibold text-emerald-600">₱{(sellingPrice - commission).toLocaleString()}</span>
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
              ₱{balance.toLocaleString()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}