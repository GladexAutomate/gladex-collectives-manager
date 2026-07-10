// @ts-nocheck
import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import {
  Globe, Users, CreditCard, TrendingUp, CalendarCheck,
  AlertTriangle, CheckCircle, Loader2, BarChart3, RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

function StatCard({ label, value, sub, color, icon: Icon }) {
  return (
    <div className="bg-card border rounded-xl p-5 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</span>
        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', color)}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-3xl font-bold text-foreground">{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

const COLLECTIVE_STATUS = {
  draft:                { label: 'Draft',               class: 'bg-slate-100 text-slate-600' },
  open_booking:         { label: 'Open Booking',        class: 'bg-sky-100 text-sky-700' },
  confirmed_departure:  { label: 'Confirmed',           class: 'bg-emerald-100 text-emerald-700' },
  ongoing:              { label: 'Ongoing',             class: 'bg-amber-100 text-amber-700' },
  completed:            { label: 'Completed',           class: 'bg-purple-100 text-purple-700' },
  cancelled:            { label: 'Cancelled',           class: 'bg-rose-100 text-rose-700' },
};

export default function Management() {
  const [collectives, setCollectives] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    Promise.all([
      base44.entities.Collective.list(),
      base44.entities.Booking.list(),
      base44.entities.Payment.list(),
    ]).then(([c, b, p]) => {
      setCollectives(Array.isArray(c) ? c : []);
      setBookings(Array.isArray(b) ? b : []);
      setPayments(Array.isArray(p) ? p : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const active = collectives.filter(c => ['open_booking', 'confirmed_departure', 'ongoing'].includes(c.status));
  const confirmed = bookings.filter(b => ['confirmed', 'paid'].includes(b.status));
  const totalRevenue = payments.filter(p => p.status === 'verified').reduce((s, p) => s + (Number(p.amount) || 0), 0);
  const pendingPayments = payments.filter(p => p.status === 'pending').length;

  // Group collectives by status
  const byStatus = Object.keys(COLLECTIVE_STATUS).reduce((acc, k) => {
    acc[k] = collectives.filter(c => c.status === k);
    return acc;
  }, {});

  // Recent collectives (top 8)
  const recent = [...collectives]
    .sort((a, b) => new Date(b.created_date || 0) - new Date(a.created_date || 0))
    .slice(0, 8);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-jakarta text-foreground">Management</h2>
          <p className="text-sm text-muted-foreground">Executive overview of all operations and performance</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={cn('w-3.5 h-3.5 mr-1.5', loading && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
        </div>
      ) : (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Total Packages"
              value={collectives.length}
              sub={`${active.length} currently active`}
              color="bg-amber-100 text-amber-700"
              icon={Globe}
            />
            <StatCard
              label="Total Bookings"
              value={bookings.length}
              sub={`${confirmed.length} confirmed / paid`}
              color="bg-sky-100 text-sky-700"
              icon={Users}
            />
            <StatCard
              label="Verified Revenue"
              value={`₱${totalRevenue.toLocaleString()}`}
              sub={`${pendingPayments} payments pending`}
              color="bg-emerald-100 text-emerald-700"
              icon={CreditCard}
            />
            <StatCard
              label="Completion Rate"
              value={collectives.length ? `${Math.round((byStatus.completed?.length || 0) / collectives.length * 100)}%` : '0%'}
              sub={`${byStatus.completed?.length || 0} completed packages`}
              color="bg-purple-100 text-purple-700"
              icon={CheckCircle}
            />
          </div>

          {/* Status breakdown + Recent packages */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Package status breakdown */}
            <div className="bg-card border rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold text-foreground">Package Status Breakdown</h3>
              </div>
              <div className="space-y-3">
                {Object.entries(COLLECTIVE_STATUS).map(([key, cfg]) => {
                  const count = byStatus[key]?.length || 0;
                  const pct = collectives.length ? Math.round(count / collectives.length * 100) : 0;
                  return (
                    <div key={key} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-foreground">{cfg.label}</span>
                        <span className="text-muted-foreground">{count} ({pct}%)</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent packages */}
            <div className="bg-card border rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-2">
                <CalendarCheck className="w-4 h-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold text-foreground">Recent Packages</h3>
              </div>
              <div className="space-y-2">
                {recent.map(c => {
                  const cfg = COLLECTIVE_STATUS[c.status] || COLLECTIVE_STATUS.draft;
                  return (
                    <div key={c.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">{c.name || c.destination || 'Unnamed'}</p>
                        <p className="text-[11px] text-muted-foreground">{c.destination || '—'} · ₱{Number(c.selling_price || 0).toLocaleString()}/pax</p>
                      </div>
                      <span className={cn('ml-3 flex-shrink-0 text-[10px] px-2 py-0.5 rounded-full font-semibold', cfg.class)}>
                        {cfg.label}
                      </span>
                    </div>
                  );
                })}
                {recent.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">No packages yet</p>}
              </div>
            </div>
          </div>

          {/* Booking status summary */}
          <div className="bg-card border rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground">Booking Overview</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                ['inquiry', 'Inquiry', 'bg-slate-100 text-slate-600'],
                ['slot_held', 'Slot Held', 'bg-amber-100 text-amber-700'],
                ['confirmed', 'Confirmed', 'bg-sky-100 text-sky-700'],
                ['paid', 'Paid', 'bg-emerald-100 text-emerald-700'],
                ['cancelled', 'Cancelled', 'bg-rose-100 text-rose-700'],
                ['completed', 'Completed', 'bg-purple-100 text-purple-700'],
              ].map(([key, label, cls]) => (
                <div key={key} className="text-center p-3 border rounded-lg">
                  <p className="text-2xl font-bold text-foreground">{bookings.filter(b => b.status === key).length}</p>
                  <span className={cn('mt-1 inline-block text-[10px] px-2 py-0.5 rounded-full font-semibold', cls)}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
