import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Package, Plus, Calculator, TrendingUp, Star, Search, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

export default function ProductDevelopment() {
  const [operators, setOperators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingOperator, setEditingOperator] = useState(null);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  // EZQuote calculator state
  const [costPrice, setCostPrice] = useState('');
  const [markupPct, setMarkupPct] = useState(20);
  const [currency, setCurrency] = useState('PHP');
  const [exchangeRate, setExchangeRate] = useState(1);

  const loadOperators = () => {
    base44.entities.Operator.list().then(data => {
      setOperators(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { loadOperators(); }, []);

  const handleSave = async () => {
    setSaving(true);
    if (editingOperator) {
      await base44.entities.Operator.update(editingOperator.id, formData);
    } else {
      await base44.entities.Operator.create(formData);
    }
    setSaving(false);
    setShowModal(false);
    loadOperators();
  };

  const openAdd = () => {
    setEditingOperator(null);
    setFormData({ status: 'active' });
    setShowModal(true);
  };

  const openEdit = (op) => {
    setEditingOperator(op);
    setFormData({ ...op });
    setShowModal(true);
  };

  const filteredOperators = operators.filter(op =>
    !search || op.name?.toLowerCase().includes(search.toLowerCase()) || op.country?.toLowerCase().includes(search.toLowerCase())
  );

  const sellingPrice = costPrice ? Number(costPrice) * (1 + markupPct / 100) : 0;
  const phpPrice = sellingPrice * exchangeRate;
  const profit = phpPrice - (Number(costPrice) * exchangeRate);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-jakarta text-foreground">Product Development</h2>
          <p className="text-sm text-muted-foreground">Manage operators, evaluate products, and compute pricing</p>
        </div>
        <Button onClick={openAdd} className="gradient-gold text-white border-0 gap-2">
          <Plus className="w-4 h-4" /> Add Operator
        </Button>
      </div>

      {/* EZQuote Calculator */}
      <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
        <h3 className="font-semibold font-jakarta text-foreground mb-4 flex items-center gap-2">
          <Calculator className="w-4 h-4 text-primary" /> EZQuote — Pricing Calculator
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Cost Price (Supplier)</Label>
            <div className="flex gap-2">
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger className="w-20 flex-shrink-0 h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PHP">PHP</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="JPY">JPY</SelectItem>
                  <SelectItem value="KRW">KRW</SelectItem>
                </SelectContent>
              </Select>
              <Input type="number" placeholder="0" value={costPrice} onChange={e => setCostPrice(e.target.value)} className="h-9" />
            </div>
          </div>
          {currency !== 'PHP' && (
            <div className="space-y-1.5">
              <Label className="text-xs">Exchange Rate (to PHP)</Label>
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
              <p className="text-xs text-muted-foreground">Cost (PHP)</p>
              <p className="text-lg font-bold text-foreground font-jakarta">₱{(Number(costPrice) * exchangeRate).toLocaleString()}</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20">
              <p className="text-xs text-muted-foreground">Selling Price</p>
              <p className="text-lg font-bold text-amber-600 font-jakarta">₱{phpPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20">
              <p className="text-xs text-muted-foreground">Gross Profit</p>
              <p className="text-lg font-bold text-emerald-600 font-jakarta">₱{profit.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-sky-50 dark:bg-sky-950/20">
              <p className="text-xs text-muted-foreground">Margin %</p>
              <p className="text-lg font-bold text-sky-600 font-jakarta">{markupPct}%</p>
            </div>
          </div>
        )}
      </div>

      {/* Operators */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search operators..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-36 bg-card rounded-xl border animate-pulse" />)}
        </div>
      ) : filteredOperators.length === 0 ? (
        <div className="text-center py-16">
          <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold text-foreground mb-2">No operators yet</h3>
          <Button onClick={openAdd} className="gradient-gold text-white border-0">
            <Plus className="w-4 h-4 mr-2" /> Add Operator
          </Button>
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
                  <Badge className={cn("text-[10px]",
                    op.status === 'active' ? "bg-emerald-100 text-emerald-700" :
                    op.status === 'blacklisted' ? "bg-rose-100 text-rose-700" :
                    "bg-slate-100 text-slate-600"
                  )}>
                    {op.status}
                  </Badge>
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => openEdit(op)}>
                    <Edit className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
              {op.reliability_score !== undefined && (
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex">
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} className={cn("w-3.5 h-3.5", s <= Math.round((op.reliability_score || 0) / 2) ? "text-amber-400 fill-amber-400" : "text-muted-foreground")} />
                    ))}
                  </div>
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

      {/* Add/Edit Operator Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-jakarta">{editingOperator ? 'Edit Operator' : 'Add Operator'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-1.5">
              <Label>Operator Name *</Label>
              <Input value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Country</Label>
                <Input value={formData.country || ''} onChange={e => setFormData({...formData, country: e.target.value})} />
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={v => setFormData({...formData, status: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="blacklisted">Blacklisted</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Contact Person</Label>
                <Input value={formData.contact_person || ''} onChange={e => setFormData({...formData, contact_person: e.target.value})} />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input type="email" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Reliability Score (1-10)</Label>
              <Input type="number" min="1" max="10" value={formData.reliability_score || ''} onChange={e => setFormData({...formData, reliability_score: Number(e.target.value)})} />
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea rows={2} value={formData.notes || ''} onChange={e => setFormData({...formData, notes: e.target.value})} />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="gradient-gold text-white border-0">
              {saving ? 'Saving...' : editingOperator ? 'Save Changes' : 'Add Operator'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}