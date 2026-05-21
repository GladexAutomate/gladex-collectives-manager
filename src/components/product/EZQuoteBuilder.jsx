import { useState } from 'react';
import { ArrowRight, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

const CURRENCIES = [
  { value: 'PHP', symbol: '₱', label: 'PHP ₱' },
  { value: 'USD', symbol: '$', label: 'USD $' },
  { value: 'EUR', symbol: '€', label: 'EUR €' },
  { value: 'JPY', symbol: '¥', label: 'JPY ¥' },
  { value: 'KRW', symbol: '₩', label: 'KRW ₩' },
  { value: 'SGD', symbol: 'S$', label: 'SGD S$' },
];

const INITIAL = {
  destination: '', collective_name: '', currency: 'PHP', base_price_foreign: '',
  exchange_rate: 58, markup_amount: 0, commission_amount: 0, downpayment: 0,
  twin_price: 0, triple_price: 0, quad_price: 0, solo_supplement: 0,
  child_no_bed: 0, child_bed: 0, child_rate: 0, infant_rate: 0,
  inclusions: '', exclusions: '', cancellation_policy: '', notes: '',
  pax_count: 20, departure_date: '', return_date: '',
};

export default function EZQuoteBuilder({ collectives }) {
  const [quote, setQuote] = useState(INITIAL);
  const setQ = (key, val) => setQuote(prev => ({ ...prev, [key]: val }));

  const qBasePHP = quote.currency === 'PHP' ? Number(quote.base_price_foreign) : Number(quote.base_price_foreign) * Number(quote.exchange_rate);
  const qSelling = qBasePHP + Number(quote.markup_amount);
  const qBalance = qSelling - Number(quote.downpayment);
  const qTotalRevenue = qSelling * Number(quote.pax_count || 0);
  const qTotalCommission = Number(quote.commission_amount) * Number(quote.pax_count || 0);
  const qNetRevenue = qTotalRevenue - qTotalCommission;
  const qCurrSymbol = CURRENCIES.find(c => c.value === quote.currency)?.symbol || '₱';

  return (
    <div className="space-y-4">
      <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
        <h3 className="font-semibold font-jakarta text-foreground mb-4 flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" /> EZQuote Builder
          <span className="text-xs font-normal text-muted-foreground ml-1">— Build a draft price quote for a new package</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Package Name</Label>
            <Input placeholder="e.g. Japan Cherry Blossom 2026" value={quote.collective_name} onChange={e => setQ('collective_name', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Destination</Label>
            <Input placeholder="e.g. Tokyo, Japan" value={quote.destination} onChange={e => setQ('destination', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Departure Date</Label>
            <Input type="date" value={quote.departure_date} onChange={e => setQ('departure_date', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Return Date</Label>
            <Input type="date" value={quote.return_date} onChange={e => setQ('return_date', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Estimated Pax</Label>
            <Input type="number" value={quote.pax_count} onChange={e => setQ('pax_count', Number(e.target.value))} />
          </div>
        </div>

        {/* Pricing */}
        <div className="mt-4 pt-4 border-t border-border">
          <h4 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Pricing Computation</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Base Currency</Label>
              <Select value={quote.currency} onValueChange={v => setQ('currency', v)}>
                <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{CURRENCIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Base Cost ({qCurrSymbol})</Label>
              <Input type="number" className="h-9 text-xs" value={quote.base_price_foreign} onChange={e => setQ('base_price_foreign', e.target.value)} />
            </div>
            {quote.currency !== 'PHP' && (
              <div className="space-y-1.5">
                <Label className="text-xs">Exchange Rate → PHP</Label>
                <Input type="number" className="h-9 text-xs" value={quote.exchange_rate} onChange={e => setQ('exchange_rate', Number(e.target.value))} />
              </div>
            )}
            <div className="space-y-1.5">
              <Label className="text-xs">Markup Amount (₱)</Label>
              <Input type="number" className="h-9 text-xs" value={quote.markup_amount} onChange={e => setQ('markup_amount', Number(e.target.value))} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Commission/pax (₱)</Label>
              <Input type="number" className="h-9 text-xs" value={quote.commission_amount} onChange={e => setQ('commission_amount', Number(e.target.value))} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Required Downpayment (₱)</Label>
              <Input type="number" className="h-9 text-xs" value={quote.downpayment} onChange={e => setQ('downpayment', Number(e.target.value))} />
            </div>
          </div>
        </div>

        {/* Room Rates */}
        <div className="mt-4 pt-4 border-t border-border">
          <h4 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Room Type Rates (₱)</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { key: 'twin_price', label: 'Twin Sharing' },
              { key: 'triple_price', label: 'Triple Sharing' },
              { key: 'quad_price', label: 'Quad Sharing' },
              { key: 'solo_supplement', label: 'Single Supplement' },
              { key: 'child_no_bed', label: 'Child w/o Bed' },
              { key: 'child_bed', label: 'Child w/ Bed' },
              { key: 'child_rate', label: 'Child Rate' },
              { key: 'infant_rate', label: 'Infant Fee' },
            ].map(f => (
              <div key={f.key} className="space-y-1">
                <Label className="text-[10px]">{f.label}</Label>
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">₱</span>
                  <Input type="number" className="h-8 text-xs pl-6" value={quote[f.key] || ''} onChange={e => setQ(f.key, Number(e.target.value))} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Inclusions / Exclusions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-border">
          <div className="space-y-1.5">
            <Label className="text-xs">Inclusions</Label>
            <Textarea rows={3} placeholder="Airfare, hotel, tours..." value={quote.inclusions} onChange={e => setQ('inclusions', e.target.value)} className="text-xs" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Exclusions</Label>
            <Textarea rows={3} placeholder="Visa fees, personal expenses..." value={quote.exclusions} onChange={e => setQ('exclusions', e.target.value)} className="text-xs" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Cancellation Policy</Label>
            <Textarea rows={2} value={quote.cancellation_policy} onChange={e => setQ('cancellation_policy', e.target.value)} className="text-xs" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Additional Notes</Label>
            <Textarea rows={2} value={quote.notes} onChange={e => setQ('notes', e.target.value)} className="text-xs" />
          </div>
        </div>
      </div>

      {/* EZQuote Preview */}
      {quote.base_price_foreign > 0 && (
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 rounded-xl border border-amber-200 dark:border-amber-800 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold font-jakarta text-lg text-foreground">
              📋 {quote.collective_name || 'EZQuote Preview'}
            </h3>
            <Badge className="bg-amber-100 text-amber-700">Draft Quote</Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            ✈️ {quote.destination || 'Destination TBD'}
            {quote.departure_date ? ` · ${new Date(quote.departure_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : ''}
            {quote.return_date ? `–${new Date(quote.return_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : ''}
          </p>

          {/* Price flow */}
          <div className="flex flex-wrap items-center gap-2 mb-4 p-3 bg-white/60 dark:bg-card/60 rounded-lg">
            <div className="text-center">
              <p className="text-[10px] text-muted-foreground">Base ({quote.currency})</p>
              <p className="font-bold text-sm">{qCurrSymbol}{Number(quote.base_price_foreign).toLocaleString()}</p>
            </div>
            {quote.currency !== 'PHP' && (
              <>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
                <div className="text-center">
                  <p className="text-[10px] text-muted-foreground">PHP Equiv.</p>
                  <p className="font-bold text-sm text-sky-600">₱{qBasePHP.toLocaleString()}</p>
                </div>
              </>
            )}
            {quote.markup_amount > 0 && (
              <>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
                <div className="text-center">
                  <p className="text-[10px] text-muted-foreground">+ Markup</p>
                  <p className="font-bold text-sm text-emerald-600">+₱{Number(quote.markup_amount).toLocaleString()}</p>
                </div>
              </>
            )}
            <ArrowRight className="w-4 h-4 text-primary" />
            <div className="text-center px-3 py-1 bg-primary rounded-lg">
              <p className="text-[10px] text-primary-foreground/80">Selling Price</p>
              <p className="font-bold text-base text-primary-foreground">₱{qSelling.toLocaleString()}</p>
            </div>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Selling Price', val: `₱${qSelling.toLocaleString()}`, color: 'text-primary' },
              { label: 'Downpayment', val: `₱${Number(quote.downpayment).toLocaleString()}`, color: 'text-amber-600' },
              { label: 'Balance', val: `₱${qBalance.toLocaleString()}`, color: 'text-foreground' },
              { label: 'Commission/pax', val: `₱${Number(quote.commission_amount).toLocaleString()}`, color: 'text-purple-600' },
              { label: 'Est. Total Revenue', val: `₱${qTotalRevenue.toLocaleString()}`, color: 'text-emerald-600' },
              { label: 'Est. Total Commission', val: `₱${qTotalCommission.toLocaleString()}`, color: 'text-purple-600' },
              { label: 'Est. Net Revenue', val: `₱${qNetRevenue.toLocaleString()}`, color: 'text-emerald-700' },
              { label: 'Est. Pax', val: quote.pax_count, color: 'text-sky-600' },
            ].map(item => (
              <div key={item.label} className="bg-white/60 dark:bg-card/60 rounded-lg p-3 text-center">
                <p className="text-[10px] text-muted-foreground">{item.label}</p>
                <p className={cn("font-bold text-sm font-jakarta", item.color)}>{item.val}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}