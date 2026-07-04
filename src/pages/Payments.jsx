// @ts-nocheck
import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, CreditCard, CheckCircle, Clock, DollarSign, Filter, Upload, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

const statusConfig = {
  pending: { label: 'Pending Verification', class: 'bg-amber-100 text-amber-700', icon: Clock },
  verified: { label: 'Verified', class: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
  rejected: { label: 'Rejected', class: 'bg-rose-100 text-rose-700', icon: AlertTriangle },
};

const paymentMethodLabels = {
  cash: 'Cash',
  bank_transfer: 'Bank Transfer',
  gcash: 'GCash',
  credit_card: 'Credit Card',
  check: 'Check',
  online: 'Online',
};

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [collectives, setCollectives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);

  const loadData = () => {
    Promise.all([
      base44.entities.Payment.list('-created_date'),
      base44.entities.Booking.list(),
      base44.entities.Collective.list(),
    ]).then(([p, b, c]) => {
      setPayments(Array.isArray(p) ? p : []);
      setBookings(Array.isArray(b) ? b : []);
      setCollectives(Array.isArray(c) ? c : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const handleSave = async () => {
    setSaving(true);
    await base44.entities.Payment.create(formData);
    setSaving(false);
    setShowModal(false);
    loadData();
  };

  const verifyPayment = async (payment) => {
    await base44.entities.Payment.update(payment.id, {
      status: 'verified',
      verified_at: new Date().toISOString(),
    });
    loadData();
  };

  const filtered = payments.filter(p => statusFilter === 'all' || p.status === statusFilter);

  const totalVerified = payments.filter(p => p.status === 'verified').reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalPending = payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + (p.amount || 0), 0);
  const formatCurrency = (val) => val ? `₱${Number(val).toLocaleString()}` : '₱0';

  const getCollectiveName = (id) => collectives.find(c => c.id === id)?.name || '—';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-jakarta text-foreground">Payments & Accounting</h2>
          <p className="text-sm text-muted-foreground">Track all payments and accounting approvals</p>
        </div>
        <Button onClick={() => { setFormData({ status: 'pending', payment_method: 'bank_transfer', payment_type: 'downpayment' }); setShowModal(true); }} className="gradient-gold text-white border-0 gap-2">
          <Plus className="w-4 h-4" /> Record Payment
        </Button>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground mb-1">Total Verified Revenue</p>
          <p className="text-xl font-bold font-jakarta text-emerald-600">{formatCurrency(totalVerified)}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground mb-1">Pending Verification</p>
          <p className="text-xl font-bold font-jakarta text-amber-600">{formatCurrency(totalPending)}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground mb-1">Total Transactions</p>
          <p className="text-xl font-bold font-jakarta text-foreground">{payments.length}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground mb-1">Est. Commission</p>
          <p className="text-xl font-bold font-jakarta text-primary">{formatCurrency(totalVerified * 0.12)}</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {Object.entries(statusConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Payments Table */}
      {loading ? (
        <div className="space-y-2">
          {[1,2,3,4].map(i => <div key={i} className="h-16 bg-card rounded-lg border animate-pulse" />)}
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Client</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Type</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Amount</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Method</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Date</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Reference</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Status</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-10 text-muted-foreground text-sm">No payments recorded yet</td>
                  </tr>
                ) : filtered.map(p => {
                  const StatusIcon = statusConfig[p.status]?.icon || Clock;
                  return (
                    <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-foreground">{p.client_name}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded capitalize">
                          {p.payment_type?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-semibold text-foreground">{formatCurrency(p.amount)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-muted-foreground">{paymentMethodLabels[p.payment_method] || p.payment_method}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-muted-foreground">
                          {p.payment_date ? new Date(p.payment_date).toLocaleDateString() : '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-muted-foreground font-mono">{p.reference_number || '—'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={cn("text-[10px] gap-1", statusConfig[p.status]?.class)}>
                          <StatusIcon className="w-3 h-3" />
                          {statusConfig[p.status]?.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {p.status === 'pending' && (
                          <Button size="sm" variant="outline" className="h-7 text-xs gap-1 text-emerald-600 border-emerald-200 hover:bg-emerald-50" onClick={() => verifyPayment(p)}>
                            <CheckCircle className="w-3 h-3" /> Verify
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Payment Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-jakarta">Record Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-1.5">
              <Label>Client Name *</Label>
              <Input value={formData.client_name || ''} onChange={e => setFormData({...formData, client_name: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Payment Type</Label>
                <Select value={formData.payment_type} onValueChange={v => setFormData({...formData, payment_type: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="downpayment">Downpayment</SelectItem>
                    <SelectItem value="partial">Partial</SelectItem>
                    <SelectItem value="full_payment">Full Payment</SelectItem>
                    <SelectItem value="balance">Balance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Amount (₱) *</Label>
                <Input type="number" value={formData.amount || ''} onChange={e => setFormData({...formData, amount: Number(e.target.value)})} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Payment Method</Label>
                <Select value={formData.payment_method} onValueChange={v => setFormData({...formData, payment_method: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(paymentMethodLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Payment Date</Label>
                <Input type="date" value={formData.payment_date || ''} onChange={e => setFormData({...formData, payment_date: e.target.value})} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Reference Number</Label>
              <Input placeholder="Bank ref, GCash ref, etc." value={formData.reference_number || ''} onChange={e => setFormData({...formData, reference_number: e.target.value})} />
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea rows={2} value={formData.notes || ''} onChange={e => setFormData({...formData, notes: e.target.value})} />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="gradient-gold text-white border-0">
              {saving ? 'Saving...' : 'Record Payment'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}