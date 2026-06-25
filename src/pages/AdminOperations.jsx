// @ts-nocheck
import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import {
  Plus, Search, Edit, CheckCircle, Clock, AlertTriangle,
  CreditCard, Users, DollarSign, CalendarClock, ShieldCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

const bookingStatusConfig = {
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

const paymentStatusConfig = {
  pending: { label: 'Pending Verification', class: 'bg-amber-100 text-amber-700', icon: Clock },
  verified: { label: 'Verified', class: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
  rejected: { label: 'Rejected', class: 'bg-rose-100 text-rose-700', icon: AlertTriangle },
};

const paymentMethodLabels = {
  cash: 'Cash', bank_transfer: 'Bank Transfer', gcash: 'GCash',
  credit_card: 'Credit Card', check: 'Check', online: 'Online',
};

const formatCurrency = (val) => val ? `\u20b1${Number(val).toLocaleString()}` : '\u20b10';

export default function AdminOperations() {
  const [bookings, setBookings] = useState([]);
  const [payments, setPayments] = useState([]);
  const [collectives, setCollectives] = useState([]);
  const [loading, setLoading] = useState(true);

  // Booking state
  const [bookingSearch, setBookingSearch] = useState('');
  const [bookingStatusFilter, setBookingStatusFilter] = useState('all');
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);
  const [bookingForm, setBookingForm] = useState({});
  const [savingBooking, setSavingBooking] = useState(false);

  // Payment state
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({});
  const [savingPayment, setSavingPayment] = useState(false);

  const loadData = () => {
    Promise.all([
      base44.entities.Booking.list('-created_date'),
      base44.entities.Payment.list('-created_date'),
      base44.entities.Collective.list(),
    ]).then(([b, p, c]) => {
      setBookings(b); setPayments(p); setCollectives(c); setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const getCollectiveName = (id) => collectives.find(c => c.id === id)?.name || '\u2014';

  const openAddBooking = () => {
    setEditingBooking(null);
    setBookingForm({ status: 'inquiry', source: 'direct', visa_status: 'not_required', pax_count: 1 });
    setShowBookingModal(true);
  };
  const openEditBooking = (b) => { setEditingBooking(b); setBookingForm({ ...b }); setShowBookingModal(true); };
  const saveBooking = async () => {
    setSavingBooking(true);
    if (editingBooking) await base44.entities.Booking.update(editingBooking.id, bookingForm);
    else await base44.entities.Booking.create(bookingForm);
    setSavingBooking(false); setShowBookingModal(false); loadData();
  };

  const filteredBookings = bookings.filter(b => {
    const matchSearch = !bookingSearch || b.client_name?.toLowerCase().includes(bookingSearch.toLowerCase()) || b.booking_reference?.toLowerCase().includes(bookingSearch.toLowerCase());
    const matchStatus = bookingStatusFilter === 'all' || b.status === bookingStatusFilter;
    return matchSearch && matchStatus;
  });

  const openAddPayment = () => {
    setPaymentForm({ status: 'pending', payment_method: 'bank_transfer', payment_type: 'downpayment' });
    setShowPaymentModal(true);
  };
  const savePayment = async () => {
    setSavingPayment(true);
    await base44.entities.Payment.create(paymentForm);
    setSavingPayment(false); setShowPaymentModal(false); loadData();
  };
  const verifyPayment = async (p) => {
    await base44.entities.Payment.update(p.id, { status: 'verified', verified_at: new Date().toISOString() });
    loadData();
  };

  const filteredPayments = payments.filter(p => paymentStatusFilter === 'all' || p.status === paymentStatusFilter);
  const totalVerified = payments.filter(p => p.status === 'verified').reduce((s, p) => s + (p.amount || 0), 0);
  const totalPending = payments.filter(p => p.status === 'pending').reduce((s, p) => s + (p.amount || 0), 0);

  const summaryStats = [
    { label: 'Total Bookings', value: bookings.length, color: 'text-foreground', icon: Users },
    { label: 'Confirmed', value: bookings.filter(b => b.status === 'confirmed').length, color: 'text-sky-600', icon: ShieldCheck },
    { label: 'Pending Payment', value: bookings.filter(b => !b.full_payment_paid && b.status !== 'cancelled').length, color: 'text-amber-600', icon: CalendarClock },
    { label: 'Verified Revenue', value: formatCurrency(totalVerified), color: 'text-emerald-600', icon: DollarSign },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold font-jakarta text-foreground">Admin Operations</h2>
        <p className="text-sm text-muted-foreground">Centralized workspace for reservations, bookings, payments and client management</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {summaryStats.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="bg-card rounded-xl border border-border p-4 flex items-center gap-3">
              <div className="p-2 bg-muted rounded-lg">
                <Icon className={cn("w-4 h-4", s.color)} />
              </div>
              <div>
                <p className={cn("text-lg font-bold font-jakarta", s.color)}>{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      <Tabs defaultValue="bookings">
        <TabsList className="mb-2">
          <TabsTrigger value="bookings" className="gap-2">
            <Users className="w-4 h-4" /> Sales &amp; Bookings
          </TabsTrigger>
          <TabsTrigger value="payments" className="gap-2">
            <CreditCard className="w-4 h-4" /> Payments
          </TabsTrigger>
        </TabsList>

        {/* BOOKINGS TAB */}
        <TabsContent value="bookings" className="space-y-4">
          <div className="flex flex-wrap gap-3 items-center justify-between">
            <div className="flex flex-wrap gap-3 flex-1">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search client or reference..." className="pl-9" value={bookingSearch} onChange={e => setBookingSearch(e.target.value)} />
              </div>
              <Select value={bookingStatusFilter} onValueChange={setBookingStatusFilter}>
                <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {Object.entries(bookingStatusConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={openAddBooking} className="gradient-gold text-white border-0 gap-2">
              <Plus className="w-4 h-4" /> New Booking
            </Button>
          </div>

          {loading ? (
            <div className="space-y-3">{[1,2,3,4].map(i => <div key={i} className="h-16 bg-card rounded-lg border animate-pulse" />)}</div>
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
                      <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Payments</th>
                      <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredBookings.length === 0 ? (
                      <tr><td colSpan={8} className="text-center py-10 text-muted-foreground text-sm">No bookings found</td></tr>
                    ) : filteredBookings.map(b => (
                      <tr key={b.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-foreground">{b.client_name}</p>
                          <p className="text-xs text-muted-foreground">{b.client_email || b.booking_reference}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-foreground truncate max-w-[140px]">{getCollectiveName(b.collective_id)}</p>
                        </td>
                        <td className="px-4 py-3"><span className="text-sm">{b.pax_count || 1}</span></td>
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-foreground">{formatCurrency(b.total_amount)}</p>
                          {b.balance > 0 && <p className="text-xs text-rose-500">Bal: {formatCurrency(b.balance)}</p>}
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={cn("text-[10px]", bookingStatusConfig[b.status]?.class)}>{bookingStatusConfig[b.status]?.label}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={cn("text-[10px] capitalize", visaStatusConfig[b.visa_status])}>{b.visa_status?.replace('_', ' ')}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2 text-xs">
                            <span title={b.downpayment_paid ? 'DP Paid' : 'DP Pending'} className={cn("w-2 h-2 rounded-full", b.downpayment_paid ? 'bg-emerald-500' : 'bg-slate-300')} />
                            <span className="text-[10px] text-muted-foreground">DP</span>
                            <span title={b.full_payment_paid ? 'Full Paid' : 'Balance Pending'} className={cn("w-2 h-2 rounded-full", b.full_payment_paid ? 'bg-emerald-500' : 'bg-slate-300')} />
                            <span className="text-[10px] text-muted-foreground">FP</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => openEditBooking(b)}>
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
        </TabsContent>

        {/* PAYMENTS TAB */}
        <TabsContent value="payments" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
          </div>

          <div className="flex flex-wrap gap-3 items-center justify-between">
            <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
              <SelectTrigger className="w-48"><SelectValue placeholder="Filter by status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {Object.entries(paymentStatusConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button onClick={openAddPayment} className="gradient-gold text-white border-0 gap-2">
              <Plus className="w-4 h-4" /> Record Payment
            </Button>
          </div>

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
                  {loading ? (
                    <tr><td colSpan={8} className="py-6 text-center text-muted-foreground text-sm">Loading...</td></tr>
                  ) : filteredPayments.length === 0 ? (
                    <tr><td colSpan={8} className="py-10 text-center text-muted-foreground text-sm">No payments recorded yet</td></tr>
                  ) : filteredPayments.map(p => {
                    const StatusIcon = paymentStatusConfig[p.status]?.icon || Clock;
                    return (
                      <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3"><p className="text-sm font-medium text-foreground">{p.client_name}</p></td>
                        <td className="px-4 py-3">
                          <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded capitalize">{p.payment_type?.replace('_', ' ')}</span>
                        </td>
                        <td className="px-4 py-3"><span className="text-sm font-semibold text-foreground">{formatCurrency(p.amount)}</span></td>
                        <td className="px-4 py-3"><span className="text-xs text-muted-foreground">{paymentMethodLabels[p.payment_method] || p.payment_method}</span></td>
                        <td className="px-4 py-3"><span className="text-xs text-muted-foreground">{p.payment_date ? new Date(p.payment_date).toLocaleDateString() : '\u2014'}</span></td>
                        <td className="px-4 py-3"><span className="text-xs text-muted-foreground font-mono">{p.reference_number || '\u2014'}</span></td>
                        <td className="px-4 py-3">
                          <Badge className={cn("text-[10px] gap-1", paymentStatusConfig[p.status]?.class)}>
                            <StatusIcon className="w-3 h-3" />
                            {paymentStatusConfig[p.status]?.label}
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
        </TabsContent>
      </Tabs>

      {/* Booking Modal */}
      <Dialog open={showBookingModal} onOpenChange={setShowBookingModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-jakarta">{editingBooking ? 'Edit Booking' : 'New Booking'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="md:col-span-2 space-y-1.5">
              <Label>Collective *</Label>
              <Select value={bookingForm.collective_id} onValueChange={v => setBookingForm({...bookingForm, collective_id: v})}>
                <SelectTrigger><SelectValue placeholder="Select collective" /></SelectTrigger>
                <SelectContent>{collectives.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Client Name *</Label>
              <Input value={bookingForm.client_name || ''} onChange={e => setBookingForm({...bookingForm, client_name: e.target.value})} />
            </div>
            <div className="space-y-1.5">
              <Label>Client Email</Label>
              <Input type="email" value={bookingForm.client_email || ''} onChange={e => setBookingForm({...bookingForm, client_email: e.target.value})} />
            </div>
            <div className="space-y-1.5">
              <Label>Client Phone</Label>
              <Input value={bookingForm.client_phone || ''} onChange={e => setBookingForm({...bookingForm, client_phone: e.target.value})} />
            </div>
            <div className="space-y-1.5">
              <Label>Pax Count</Label>
              <Input type="number" min="1" value={bookingForm.pax_count || 1} onChange={e => setBookingForm({...bookingForm, pax_count: Number(e.target.value)})} />
            </div>
            <div className="space-y-1.5">
              <Label>Booking Status</Label>
              <Select value={bookingForm.status} onValueChange={v => setBookingForm({...bookingForm, status: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(bookingStatusConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Source</Label>
              <Select value={bookingForm.source} onValueChange={v => setBookingForm({...bookingForm, source: v})}>
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
              <Label>Total Amount</Label>
              <Input type="number" value={bookingForm.total_amount || ''} onChange={e => setBookingForm({...bookingForm, total_amount: Number(e.target.value)})} />
            </div>
            <div className="space-y-1.5">
              <Label>Downpayment</Label>
              <Input type="number" value={bookingForm.downpayment_amount || ''} onChange={e => setBookingForm({...bookingForm, downpayment_amount: Number(e.target.value)})} />
            </div>
            <div className="space-y-1.5">
              <Label>DP Paid?</Label>
              <Select value={bookingForm.downpayment_paid ? 'yes' : 'no'} onValueChange={v => setBookingForm({...bookingForm, downpayment_paid: v === 'yes'})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="no">No</SelectItem><SelectItem value="yes">Yes</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Full Payment Due</Label>
              <Input type="date" value={bookingForm.full_payment_due || ''} onChange={e => setBookingForm({...bookingForm, full_payment_due: e.target.value})} />
            </div>
            <div className="space-y-1.5">
              <Label>Full Payment Paid?</Label>
              <Select value={bookingForm.full_payment_paid ? 'yes' : 'no'} onValueChange={v => setBookingForm({...bookingForm, full_payment_paid: v === 'yes'})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="no">No</SelectItem><SelectItem value="yes">Yes</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Visa Status</Label>
              <Select value={bookingForm.visa_status} onValueChange={v => setBookingForm({...bookingForm, visa_status: v})}>
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
              <Input value={bookingForm.assigned_agent || ''} onChange={e => setBookingForm({...bookingForm, assigned_agent: e.target.value})} />
            </div>
            <div className="md:col-span-2 space-y-1.5">
              <Label>Remarks</Label>
              <Textarea rows={2} value={bookingForm.remarks || ''} onChange={e => setBookingForm({...bookingForm, remarks: e.target.value})} />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setShowBookingModal(false)}>Cancel</Button>
            <Button onClick={saveBooking} disabled={savingBooking} className="gradient-gold text-white border-0">
              {savingBooking ? 'Saving...' : editingBooking ? 'Save Changes' : 'Create Booking'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Modal */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-jakarta">Record Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-1.5">
              <Label>Client Name *</Label>
              <Input value={paymentForm.client_name || ''} onChange={e => setPaymentForm({...paymentForm, client_name: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Payment Type</Label>
                <Select value={paymentForm.payment_type} onValueChange={v => setPaymentForm({...paymentForm, payment_type: v})}>
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
                <Label>Amount *</Label>
                <Input type="number" value={paymentForm.amount || ''} onChange={e => setPaymentForm({...paymentForm, amount: Number(e.target.value)})} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Payment Method</Label>
                <Select value={paymentForm.payment_method} onValueChange={v => setPaymentForm({...paymentForm, payment_method: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(paymentMethodLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Payment Date</Label>
                <Input type="date" value={paymentForm.payment_date || ''} onChange={e => setPaymentForm({...paymentForm, payment_date: e.target.value})} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Reference Number</Label>
              <Input placeholder="Bank ref, GCash ref, etc." value={paymentForm.reference_number || ''} onChange={e => setPaymentForm({...paymentForm, reference_number: e.target.value})} />
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea rows={2} value={paymentForm.notes || ''} onChange={e => setPaymentForm({...paymentForm, notes: e.target.value})} />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setShowPaymentModal(false)}>Cancel</Button>
            <Button onClick={savePayment} disabled={savingPayment} className="gradient-gold text-white border-0">
              {savingPayment ? 'Saving...' : 'Record Payment'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}