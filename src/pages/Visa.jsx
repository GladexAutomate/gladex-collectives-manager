// @ts-nocheck
import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import {
  Search, Loader2, CheckCircle, Clock, XCircle, AlertTriangle,
  FileText, RefreshCw, Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const VISA_STATUS = {
  not_required: { label: 'Not Required', class: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300', icon: FileText },
  pending:      { label: 'Pending',      class: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400', icon: Clock },
  submitted:    { label: 'Submitted',    class: 'bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400', icon: FileText },
  approved:     { label: 'Approved',     class: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400', icon: CheckCircle },
  rejected:     { label: 'Rejected',     class: 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400', icon: XCircle },
};

export default function Visa() {
  const [bookings, setBookings] = useState([]);
  const [collectives, setCollectives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [visaFilter, setVisaFilter] = useState('all');
  const [editingBooking, setEditingBooking] = useState(null);
  const [editStatus, setEditStatus] = useState('pending');
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([
      base44.entities.Booking.list('-created_date'),
      base44.entities.Collective.list(),
    ]).then(([b, c]) => {
      setBookings(Array.isArray(b) ? b : []);
      setCollectives(Array.isArray(c) ? c : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const getCollectiveName = (id) => collectives.find(c => c.id === id)?.name || '—';

  const filtered = bookings.filter(b => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      b.client_name?.toLowerCase().includes(q) ||
      b.booking_reference?.toLowerCase().includes(q) ||
      getCollectiveName(b.collective_id).toLowerCase().includes(q);
    const matchVisa = visaFilter === 'all' || (b.visa_status || 'not_required') === visaFilter;
    return matchSearch && matchVisa;
  });

  const counts = Object.fromEntries(
    Object.keys(VISA_STATUS).map(k => [k, bookings.filter(b => (b.visa_status || 'not_required') === k).length])
  );

  const openEdit = (b) => { setEditingBooking(b); setEditStatus(b.visa_status || 'not_required'); };

  const saveStatus = async () => {
    setSaving(true);
    await base44.entities.Booking.update(editingBooking.id, { visa_status: editStatus });
    setBookings(prev => prev.map(b => b.id === editingBooking.id ? { ...b, visa_status: editStatus } : b));
    toast.success('Visa status updated');
    setSaving(false);
    setEditingBooking(null);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-jakarta text-foreground">Visa & Documentation</h2>
          <p className="text-sm text-muted-foreground">Track visa application status per passenger booking</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={cn('w-3.5 h-3.5 mr-1.5', loading && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      {/* Status summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {Object.entries(VISA_STATUS).map(([key, cfg]) => {
          const Icon = cfg.icon;
          return (
            <div
              key={key}
              onClick={() => setVisaFilter(visaFilter === key ? 'all' : key)}
              className={cn(
                'border rounded-xl p-3 cursor-pointer transition-all text-center',
                visaFilter === key ? 'ring-2 ring-amber-400 bg-amber-50 dark:bg-amber-950/20' : 'bg-card hover:bg-muted/40'
              )}
            >
              <p className="text-xl font-bold text-foreground">{counts[key] || 0}</p>
              <span className={cn('inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold', cfg.class)}>
                <Icon className="w-2.5 h-2.5" />{cfg.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input className="pl-9 h-9 text-sm" placeholder="Search client, booking ref, package…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={visaFilter} onValueChange={setVisaFilter}>
          <SelectTrigger className="w-40 h-9 text-sm"><SelectValue placeholder="Visa Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.entries(VISA_STATUS).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <p className="text-xs text-muted-foreground">Showing {filtered.length} of {bookings.length} bookings</p>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
        </div>
      ) : (
        <div className="border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Client</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide hidden sm:table-cell">Package</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">Departure</th>
                  <th className="text-center px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Visa Status</th>
                  <th className="text-center px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map(b => {
                  const vs = b.visa_status || 'not_required';
                  const cfg = VISA_STATUS[vs] || VISA_STATUS.not_required;
                  const Icon = cfg.icon;
                  return (
                    <tr key={b.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-foreground text-sm">{b.client_name || '—'}</p>
                        <p className="text-[11px] text-muted-foreground">{b.booking_reference || '—'} · {b.pax_count || 1} pax</p>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className="text-sm text-muted-foreground">{getCollectiveName(b.collective_id)}</span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-sm text-muted-foreground">{b.departure_date_option || '—'}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={cn('inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold', cfg.class)}>
                          <Icon className="w-3 h-3" />{cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Button size="sm" variant="outline" className="h-7 text-xs px-3" onClick={() => openEdit(b)}>
                          Update
                        </Button>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={5} className="text-center py-14 text-muted-foreground text-sm">No bookings found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit dialog */}
      <Dialog open={!!editingBooking} onOpenChange={() => setEditingBooking(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Update Visa Status</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <p className="text-sm font-semibold">{editingBooking?.client_name}</p>
              <p className="text-xs text-muted-foreground">{editingBooking?.booking_reference}</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Visa Status</Label>
              <Select value={editStatus} onValueChange={setEditStatus}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(VISA_STATUS).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setEditingBooking(null)}>Cancel</Button>
              <Button size="sm" onClick={saveStatus} disabled={saving}>
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Save'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
