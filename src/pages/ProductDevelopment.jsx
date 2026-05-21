import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Package, Plus, Calculator, TrendingUp, Star, Search, Edit, ArrowRight, FileText, Download, Users, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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

const ROOM_TYPES = [
  { value: 'twin_sharing', label: 'Twin Sharing' },
  { value: 'triple_sharing', label: 'Triple Sharing' },
  { value: 'quad_sharing', label: 'Quad Sharing' },
  { value: 'solo_room', label: 'Solo Room' },
  { value: 'family_room', label: 'Family Room' },
];

export default function ProductDevelopment() {
  const [operators, setOperators] = useState([]);
  const [collectives, setCollectives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingOperator, setEditingOperator] = useState(null);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [activeSection, setActiveSection] = useState('calculator'); // 'calculator' | 'operators' | 'ezquote'

  // EZQuote state
  const [quote, setQuote] = useState({
    destination: '', collective_name: '', currency: 'PHP', base_price_foreign: '', exchange_rate: 58,
    markup_amount: 0, commission_amount: 0, downpayment: 0,
    twin_price: 0, triple_price: 0, quad_price: 0, solo_supplement: 0,
    child_no_bed: 0, child_bed: 0, child_rate: 0, infant_rate: 0,
    inclusions: '', exclusions: '', cancellation_policy: '', notes: '',
    pax_count: 20, departure_date: '', return_date: '',
  });

  // Simple calculator state
  const [costPrice, setCostPrice] = useState('');
  const [markupPct, setMarkupPct] = useState(20);
  const [currency, setCurrency] = useState('PHP');
  const [exchangeRate, setExchangeRate] = useState(58);

  useEffect(() => {
    Promise.all([
      base44.entities.Operator.list(),
      base44.entities.Collective.list('-created_date', 20),
    ]).then(([ops, cols]) => {
      setOperators(ops);
      setCollectives(cols);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    if (editingOperator) {
      await base44.entities.Operator.update(editingOperator.id, formData);
    } else {
      await base44.entities.Operator.create(formData);
    }
    setSaving(false);
    setShowModal(false);
    base44.entities.Operator.list().then(setOperators);
  };

  const openAdd = () => { setEditingOperator(null); setFormData({ status: 'active' }); setShowModal(true); };
  const openEdit = (op) => { setEditingOperator(op); setFormData({ ...op }); setShowModal(true); };
  const filteredOperators = operators.filter(op => !search || op.name?.toLowerCase().includes(search.toLowerCase()) || op.country?.toLowerCase().includes(search.toLowerCase()));

  // Simple calc
  const currencySymbol = CURRENCIES.find(c => c.value === currency)?.symbol || '₱';
  const basePHP = currency === 'PHP' ? Number(costPrice) : Number(costPrice) * exchangeRate;
  const sellingPrice = costPrice ? basePHP * (1 + markupPct / 100) : 0;
  const profit = sellingPrice - basePHP;

  // EZQuote calc
  const qBasePHP = quote.currency === 'PHP' ? Number(quote.base_price_foreign) : Number(quote.base_price_foreign) * Number(quote.exchange_rate);
  const qSelling = qBasePHP + Number(quote.markup_amount);
  const qBalance = qSelling - Number(quote.downpayment);
  const qTotalRevenue = qSelling * Number(quote.pax_count || 0);
  const qTotalCommission = Number(quote.commission_amount) * Number(quote.pax_count || 0);
  const qNetRevenue = qTotalRevenue - qTotalCommission;
  const qCurrSymbol = CURRENCIES.find(c => c.value === quote.currency)?.symbol || '₱';

  const setQ = (key, val) => setQuote(prev => ({ ...prev, [key]: val }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-jakarta text-foreground">Product Development</h2>
          <p className="text-sm text-muted-foreground">Operators · EZQuote Builder · Pricing Intelligence</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={openAdd} className="gradient-gold text-white border-0 gap-2">
            <Plus className="w-4 h-4" /> Add Operator
          </Button>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="flex gap-1 bg-muted/50 rounded-xl p-1 w-fit">
        {[
          { key: 'calculator', label: '🧮 Quick Calc' },
          { key: 'ezquote', label: '📋 EZQuote Builder' },
          { key: 'operators', label: '🏢 Operators' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveSection(tab.key)}
            className={cn("px-4 py-2 rounded-lg text-xs font-medium transition-all", activeSection === tab.key ? "bg-card shadow text-foreground" : "text-muted-foreground hover:text-foreground")}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Quick Calculator */}
      {activeSection === 'calculator' && (
        <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
          <h3 className="font-semibold font-jakarta text-foreground mb-4 flex items-center gap-2">
            <Calculator className="w-4 h-4 text-primary" /> Quick Pricing Calculator
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Cost Price (Supplier)</Label>
              <div className="flex gap-2">
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger className="w-24 h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{CURRENCIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                </Select>
                <Input type="number" placeholder="0" value={costPrice} onChange={e => setCostPrice(e.target.value)} className="h-9" />
              </div>
            </div>
            {currency !== 'PHP' && (
              <div className="space-y-1.5">
                <Label className="text-xs">Exchange Rate (→ PHP)</Label>
                <Input type="number" step="0.01" value={exchangeRate} onChange={e => setExchangeRate(Number(e.target.value))} className="h-9" />
              </div>
            )}
            <div className="space-y-1.5">
              <Label className="text-xs">Markup %</Label>
              <Input type="number" value={markupPct} onChange={e => setMarkupPct(Number(e.target.value))} className="h-9" />
            </div>
          </div>
          {costPrice && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-border">
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground">Cost PHP</p>
                <p className="text-lg font-bold text-foreground font-jakarta">₱{basePHP.toLocaleString(undefined, {maximumFractionDigits:0})}</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20">
                <p className="text-xs text-muted-foreground">Selling Price</p>
                <p className="text-lg font-bold text-amber-600 font-jakarta">₱{sellingPrice.toLocaleString(undefined, {maximumFractionDigits:0})}</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20">
                <p className="text-xs text-muted-foreground">Gross Profit</p>
                <p className="text-lg font-bold text-emerald-600 font-jakarta">₱{profit.toLocaleString(undefined, {maximumFractionDigits:0})}</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-sky-50 dark:bg-sky-950/20">
                <p className="text-xs text-muted-foreground">Margin</p>
                <p className="text-lg font-bold text-sky-600 font-jakarta">{markupPct}%</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* EZQuote Builder */}
      {activeSection === 'ezquote' && (
        <div className="space-y-4">
          <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
            <h3 className="font-semibold font-jakarta text-foreground mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" /> EZQuote Builder
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Package / Collective Name</Label>
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
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
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

            {/* Inclusions/Exclusions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-border">
              <div className="space-y-1.5">
                <Label className="text-xs">Inclusions</Label>
                <Textarea rows={4} placeholder="Airfare, hotel, tours..." value={quote.inclusions} onChange={e => setQ('inclusions', e.target.value)} className="text-xs" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Exclusions</Label>
                <Textarea rows={4} placeholder="Visa fees, personal expenses..." value={quote.exclusions} onChange={e => setQ('exclusions', e.target.value)} className="text-xs" />
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
              <p className="text-sm text-muted-foreground mb-4">✈️ {quote.destination || 'Destination TBD'}{quote.departure_date ? ` · ${new Date(quote.departure_date).toLocaleDateString('en-US', {month:'short',day:'numeric'})}` : ''}{quote.return_date ? `–${new Date(quote.return_date).toLocaleDateString('en-US', {month:'short',day:'numeric'})}` : ''}</p>

              {/* Price Computation Flow */}
              <div className="flex flex-wrap items-center gap-2 mb-4 p-3 bg-white/60 dark:bg-card/60 rounded-lg">
                <div className="text-center">
                  <p className="text-[10px] text-muted-foreground">Base ({quote.currency})</p>
                  <p className="font-bold text-sm">{qCurrSymbol}{Number(quote.base_price_foreign).toLocaleString()}</p>
                </div>
                {quote.currency !== 'PHP' && <><ArrowRight className="w-4 h-4 text-muted-foreground" /><div className="text-center"><p className="text-[10px] text-muted-foreground">PHP Equiv.</p><p className="font-bold text-sm text-sky-600">₱{qBasePHP.toLocaleString()}</p></div></>}
                {quote.markup_amount > 0 && <><ArrowRight className="w-4 h-4 text-muted-foreground" /><div className="text-center"><p className="text-[10px] text-muted-foreground">+ Markup</p><p className="font-bold text-sm text-emerald-600">+₱{Number(quote.markup_amount).toLocaleString()}</p></div></>}
                <ArrowRight className="w-4 h-4 text-primary" />
                <div className="text-center px-3 py-1 bg-primary rounded-lg">
                  <p className="text-[10px] text-primary-foreground/80">Selling Price</p>
                  <p className="font-bold text-base text-primary-foreground">₱{qSelling.toLocaleString()}</p>
                </div>
              </div>

              {/* Summary Grid */}
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

              {/* Room Rates */}
              {(quote.twin_price > 0 || quote.triple_price > 0) && (
                <div className="mt-4 pt-4 border-t border-amber-200">
                  <h4 className="text-xs font-semibold text-foreground mb-2">Room Rate Summary</h4>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: 'Twin', val: quote.twin_price },
                      { label: 'Triple', val: quote.triple_price },
                      { label: 'Quad', val: quote.quad_price },
                      { label: 'Solo Supp.', val: quote.solo_supplement },
                    ].filter(r => r.val > 0).map(r => (
                      <div key={r.label} className="bg-white/70 dark:bg-card/70 px-3 py-1.5 rounded-lg text-center">
                        <p className="text-[10px] text-muted-foreground">{r.label}</p>
                        <p className="text-xs font-bold text-foreground">₱{Number(r.val).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Operators */}
      {activeSection === 'operators' && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search operators..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1,2,3].map(i => <div key={i} className="h-36 bg-card rounded-xl border animate-pulse" />)}
            </div>
          ) : filteredOperators.length === 0 ? (
            <div className="text-center py-16">
              <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold text-foreground mb-2">No operators yet</h3>
              <Button onClick={openAdd} className="gradient-gold text-white border-0"><Plus className="w-4 h-4 mr-2" /> Add Operator</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredOperators.map(op => (
                <div key={op.id} className="bg-card rounded-xl border border-border p-4 shadow-sm card-hover">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-foreground">{op.name}</h3>
                      <p className="text-xs text-muted-foreground">{op.country} · {op.contact_person}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={cn("text-[10px]", op.status === 'active' ? "bg-emerald-100 text-emerald-700" : op.status === 'blacklisted' ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-600")}>{op.status}</Badge>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => openEdit(op)}><Edit className="w-3.5 h-3.5" /></Button>
                    </div>
                  </div>
                  {op.reliability_score !== undefined && (
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex">{[1,2,3,4,5].map(s => <Star key={s} className={cn("w-3.5 h-3.5", s <= Math.round((op.reliability_score || 0) / 2) ? "text-amber-400 fill-amber-400" : "text-muted-foreground")} />)}</div>
                      <span className="text-xs text-muted-foreground">{op.reliability_score}/10</span>
                    </div>
                  )}
                  <div className="flex gap-3 text-xs text-muted-foreground">
                    <span>{op.total_collectives || 0} collectives</span>
                    {op.total_revenue > 0 && <span>₱{Number(op.total_revenue).toLocaleString()} revenue</span>}
                  </div>
                  {op.notes && <p className="text-xs text-muted-foreground italic mt-2 line-clamp-2">{op.notes}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Operator Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="font-jakarta">{editingOperator ? 'Edit Operator' : 'Add Operator'}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-1.5"><Label>Operator Name *</Label><Input value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Country</Label><Input value={formData.country || ''} onChange={e => setFormData({...formData, country: e.target.value})} /></div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={v => setFormData({...formData, status: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem><SelectItem value="blacklisted">Blacklisted</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Contact Person</Label><Input value={formData.contact_person || ''} onChange={e => setFormData({...formData, contact_person: e.target.value})} /></div>
              <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} /></div>
            </div>
            <div className="space-y-1.5"><Label>Reliability Score (1-10)</Label><Input type="number" min="1" max="10" value={formData.reliability_score || ''} onChange={e => setFormData({...formData, reliability_score: Number(e.target.value)})} /></div>
            <div className="space-y-1.5"><Label>Notes</Label><Textarea rows={2} value={formData.notes || ''} onChange={e => setFormData({...formData, notes: e.target.value})} /></div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="gradient-gold text-white border-0">{saving ? 'Saving...' : editingOperator ? 'Save Changes' : 'Add Operator'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}