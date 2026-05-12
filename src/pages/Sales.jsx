import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, Search, Users, Calendar, DollarSign, Filter, Eye, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const statusConfig = {
  inquiry: { label: 'Inquiry', class: 'bg-slate-100 text-slate-600' },
  slot_held: { label: 'Slot Held', class: 'bg-amber-100 text-amber-700' },
  confirmed: { label: 'Confirmed', class: 'bg-sky-100 text-sky-700' },
  paid: { label: 'Paid', class: 'bg-emerald-100 text-emerald-700' },
  cancelled: { label: 'Cancelled', class: 'bg-rose-100 text-rose-700' },
  completed: { label: 'Completed', class: 'bg-purple-100 text-purple-700' },
};

const visaStatusConfig = {
  not_required: 'bg-slate-100 text-slate-600',
  pending: 'bg-amber-100 text-amber-700',
  submitted: 'bg-sky-100 text-sky-700',
  approved: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-rose-100 text-rose-700',
};

export default function Sales() {
  const [bookings, setBookings] = useState([]);
  const [collectives, setCollectives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);

  const loadData = () => {
    Promise.all([
      base44.entities.Booking.list('-created_date'),
      base44.entities.Collective.list(),
    ]).then(([b, c]) => {
      setBookings(b);
      setCollectives(c);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const openAdd = () => {
    setEditingBooking(null);
    setFormData({ status: 'inquiry', source: 'direct', visa_status: 'not_required', pax_count: 1 });
    setShowModal(true);
  };

  const openEdit = (b) => {
    setEditingBooking(b);
    setFormData({ ...b });
    setShowModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    if (editingBooking) {
      await base44.entities.Booking.update(editingBooking.id, formData);
    } else {
      await base44.entities.Booking.create(formData);
    }
    setSaving(false);
    setShowModal(false);
    loadData();
  };

  const filtered = bookings.filter(b => {
    const matchSearch = !search || b.client_name?.toLowerCase().includes(search.toLowerCase()) || b.booking_reference?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || b.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const getCollectiveName = (id) => collectives.find(c => c.id === id)?.name || '—';
  const formatCurrency = (val) => val ? `₱${Number(val).toLocaleString()}` : '—';

  const summaryStats = [
    { label: 'Total Bookings', value: bookings.length, color: 'text-foreground' },
    { label: 'Confirmed', value: bookings.filter(b => b.status === 'confirmed').length, color: 'text-sky-600' },
    { label: 'Paid', value: bookings.filter(b => b.status === 'paid').length, color: 'text-emerald-600' },
    { label: 'Pending Payment', value: bookings.filter(b => !b.full_payment_paid && b.status !== 'cancelled').length, color: 'text-amber-600' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-jakarta text-foreground">Sales & Reservations</h2>
          <p className="text-sm text-muted-foreground">Manage all bookings and client reservations</p>
        </div>
        <Button onClick={openAdd} className="gradient-gold text-white border-0 gap-2">
          <Plus className="w-4 h-4" /> New Booking
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {summaryStats.map((s, i) => (
          <div key={i} className="bg-card rounded-xl border border-border p-4">
            <p className={cn("text-2xl font-bold font-jakarta", s.color)}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by client name or reference..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {Object.entries(statusConfig).map(([val, cfg]) => (
              <SelectItem key={val} value={val}>{cfg.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3,4,5].map(i => <div key={i} className="h-16 bg-card rounded-lg border animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold text-foreground mb-2">No bookings found</h3>
          <Button onClick={openAdd} className="gradient-gold text-white border-0">
            <Plus className="w-4 h-4 mr-2" /> Add First Booking
          </Button>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Client</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Collective</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Pax</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Amount</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Status</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Visa</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Payment</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map(b => (
                  <tr key={b.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-foreground">{b.client_name}</p>
                        <p className="text-xs text-muted-foreground">{b.client_email || b.booking_reference}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-foreground truncate max-w-[150px]">{getCollectiveName(b.collective_id)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-foreground">{b.pax_count || 1}</span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-foreground">{formatCurrency(b.total_amount)}</p>
                      {b.balance > 0 && <p className="text-xs text-rose-500">Bal: {formatCurrency(b.balance)}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={cn("text-[10px]", statusConfig[b.status]?.class)}>
                        {statusConfig[b.status]?.label}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={cn("text-[10px] capitalize", visaStatusConfig[b.visa_status])}>
                        {b.visa_status?.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 text-xs">
                        <span className={cn("w-2 h-2 rounded-full", b.downpayment_paid ? 'bg-emerald-500' : 'bg-slate-300')} title={b.downpayment_paid ? 'DP Paid' : 'DP Pending'} />
                        <span className={cn("w-2 h-2 rounded-full", b.full_payment_paid ? 'bg-emerald-500' : 'bg-slate-300')} title={b.full_payment_paid ? 'Full Paid' : 'Balance Pending'} />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => openEdit(b)}>
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Booking Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-jakarta">{editingBooking ? 'Edit Booking' : 'New Booking'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="md:col-span-2 space-y-1.5">
              <Label>Collective *</Label>
              <Select value={formData.collective_id} onValueChange={v => setFormData({...formData, collective_id: v})}>
                <SelectTrigger><SelectValue placeholder="Select collective" /></SelectTrigger>
                <SelectContent>
                  {collectives.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Client Name *</Label>
              <Input value={formData.client_name || ''} onChange={e => setFormData({...formData, client_name: e.target.value})} />
            </div>
            <div className="space-y-1.5">
              <Label>Client Email</Label>
              <Input type="email" value={formData.client_email || ''} onChange={e => setFormData({...formData, client_email: e.target.value})} />
            </div>
            <div className="space-y-1.5">
              <Label>Client Phone</Label>
              <Input value={formData.client_phone || ''} onChange={e => setFormData({...formData, client_phone: e.target.value})} />
            </div>
            <div className="space-y-1.5">
              <Label>Pax Count</Label>
              <Input type="number" min="1" value={formData.pax_count || 1} onChange={e => setFormData({...formData, pax_count: Number(e.target.value)})} />
            </div>
            <div className="space-y-1.5">
              <Label>Booking Status</Label>
              <Select value={formData.status} onValueChange={v => setFormData({...formData, status: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(statusConfig).map(([val, cfg]) => <SelectItem key={val} value={val}>{cfg.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Source</Label>
              <Select value={formData.source} onValueChange={v => setFormData({...formData, source: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="direct">Direct</SelectItem>
                  <SelectItem value="sub_agent">Sub-Agent</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="referral">Referral</SelectItem>
                  <SelectItem value="walk_in">Walk-In</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Total Amount (₱)</Label>
              <Input type="number" value={formData.total_amount || ''} onChange={e => setFormData({...formData, total_amount: Number(e.target.value)})} />
            </div>
            <div className="space-y-1.5">
              <Label>Downpayment (₱)</Label>
              <Input type="number" value={formData.downpayment_amount || ''} onChange={e => setFormData({...formData, downpayment_amount: Number(e.target.value)})} />
            </div>
            <div className="space-y-1.5">
              <Label>DP Paid?</Label>
              <Select value={formData.downpayment_paid ? 'yes' : 'no'} onValueChange={v => setFormData({...formData, downpayment_paid: v === 'yes'})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="no">No</SelectItem>
                  <SelectItem value="yes">Yes</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Full Payment Due</Label>
              <Input type="date" value={formData.full_payment_due || ''} onChange={e => setFormData({...formData, full_payment_due: e.target.value})} />
            </div>
            <div className="space-y-1.5">
              <Label>Full Payment Paid?</Label>
              <Select value={formData.full_payment_paid ? 'yes' : 'no'} onValueChange={v => setFormData({...formData, full_payment_paid: v === 'yes'})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="no">No</SelectItem>
                  <SelectItem value="yes">Yes</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Visa Status</Label>
              <Select value={formData.visa_status} onValueChange={v => setFormData({...formData, visa_status: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="not_required">Not Required</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Assigned Agent</Label>
              <Input value={formData.assigned_agent || ''} onChange={e => setFormData({...formData, assigned_agent: e.target.value})} />
            </div>
            <div className="md:col-span-2 space-y-1.5">
              <Label>Remarks</Label>
              <Textarea rows={2} value={formData.remarks || ''} onChange={e => setFormData({...formData, remarks: e.target.value})} />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="gradient-gold text-white border-0">
              {saving ? 'Saving...' : editingBooking ? 'Save Changes' : 'Create Booking'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}