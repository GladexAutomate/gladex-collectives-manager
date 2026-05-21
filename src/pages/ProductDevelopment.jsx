import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, TrendingUp, Search, Edit, FileText, Users, Plane, Calendar, DollarSign, Package, ArrowRight, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import PackageCard from '@/components/product/PackageCard';
import EZQuoteBuilder from '@/components/product/EZQuoteBuilder';

const STATUS_CONFIG = {
  draft:               { label: 'Draft',              class: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300' },
  for_approval:        { label: 'For Approval',       class: 'bg-purple-100 text-purple-700' },
  product_development: { label: 'Product Dev',        class: 'bg-amber-100 text-amber-700' },
  marketing_prep:      { label: 'Marketing Prep',     class: 'bg-pink-100 text-pink-700' },
  active:              { label: 'Active',              class: 'bg-emerald-100 text-emerald-700' },
  launched:            { label: 'Launched',            class: 'bg-sky-100 text-sky-700' },
  open_booking:        { label: 'Open Booking',       class: 'bg-teal-100 text-teal-700' },
  reservation_ongoing: { label: 'Reservations Open',  class: 'bg-blue-100 text-blue-700' },
  payment_verification:{ label: 'Payment Verification',class:'bg-indigo-100 text-indigo-700' },
  documentation:       { label: 'Documentation',      class: 'bg-violet-100 text-violet-700' },
  pre_departure:       { label: 'Pre-Departure',      class: 'bg-cyan-100 text-cyan-700' },
  ongoing:             { label: 'Ongoing Travel',     class: 'bg-amber-100 text-amber-700' },
  completed:           { label: 'Completed',          class: 'bg-purple-100 text-purple-700' },
  post_evaluation:     { label: 'Post Evaluation',    class: 'bg-rose-100 text-rose-700' },
  cancelled:           { label: 'Cancelled',          class: 'bg-rose-100 text-rose-700' },
};

export default function ProductDevelopment() {
  const [collectives, setCollectives] = useState([]);
  const [marketingAssets, setMarketingAssets] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('packages');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    Promise.all([
      base44.entities.Collective.list('-created_date'),
      base44.entities.MarketingAsset.list(),
      base44.entities.Booking.list(),
    ]).then(([cols, assets, bkgs]) => {
      setCollectives(cols);
      setMarketingAssets(assets);
      setBookings(bkgs);
      setLoading(false);
    }).catch(() => setLoading(false));

    const unsubC = base44.entities.Collective.subscribe((e) => {
      if (e.type === 'create') setCollectives(p => [e.data, ...p]);
      else if (e.type === 'update') setCollectives(p => p.map(c => c.id === e.id ? e.data : c));
      else if (e.type === 'delete') setCollectives(p => p.filter(c => c.id !== e.id));
    });
    const unsubA = base44.entities.MarketingAsset.subscribe((e) => {
      if (e.type === 'create') setMarketingAssets(p => [...p, e.data]);
      else if (e.type === 'update') setMarketingAssets(p => p.map(a => a.id === e.id ? e.data : a));
      else if (e.type === 'delete') setMarketingAssets(p => p.filter(a => a.id !== e.id));
    });
    const unsubB = base44.entities.Booking.subscribe((e) => {
      if (e.type === 'create') setBookings(p => [...p, e.data]);
      else if (e.type === 'update') setBookings(p => p.map(b => b.id === e.id ? e.data : b));
      else if (e.type === 'delete') setBookings(p => p.filter(b => b.id !== e.id));
    });
    return () => { unsubC(); unsubA(); unsubB(); };
  }, []);

  const filtered = collectives.filter(c => {
    const matchSearch = !search || c.name?.toLowerCase().includes(search.toLowerCase()) || c.destination?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalRevenue = collectives.reduce((acc, c) => acc + (c.total_revenue || 0), 0);
  const totalPax = collectives.reduce((acc, c) => acc + (c.booked_pax || 0), 0);

  const stats = [
    { label: 'Total Packages', value: collectives.length, color: 'text-foreground', icon: Package },
    { label: 'Active / Open', value: collectives.filter(c => ['active','launched','open_booking'].includes(c.status)).length, color: 'text-emerald-600', icon: TrendingUp },
    { label: 'Total Booked Pax', value: totalPax, color: 'text-sky-600', icon: Users },
    { label: 'Est. Total Revenue', value: `₱${(totalRevenue/1000000).toFixed(1)}M`, color: 'text-amber-600', icon: DollarSign },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-jakarta text-foreground">Product Development</h2>
          <p className="text-sm text-muted-foreground">All travel packages · Pricing · Slot management · EZQuote</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted/50 rounded-xl p-1 w-fit">
        {[
          { key: 'packages', label: '📦 Packages' },
          { key: 'ezquote', label: '📋 EZQuote Builder' },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={cn("px-4 py-2 rounded-lg text-xs font-medium transition-all",
              activeTab === tab.key ? "bg-card shadow text-foreground" : "text-muted-foreground hover:text-foreground")}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="bg-card rounded-xl border border-border p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                <Icon className={cn("w-5 h-5", s.color)} />
              </div>
              <div>
                <p className={cn("text-xl font-bold font-jakarta leading-tight", s.color)}>{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Packages Tab */}
      {activeTab === 'packages' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search packages or destination..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-44"><SelectValue placeholder="All Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1,2,3,4,5,6].map(i => <div key={i} className="h-56 bg-card rounded-xl border animate-pulse" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold text-foreground mb-1">No packages found</h3>
              <p className="text-sm text-muted-foreground mb-4">Create packages from the Collectives module</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map(c => (
                <PackageCard
                  key={c.id}
                  collective={c}
                  assetCount={marketingAssets.filter(a => a.collective_id === c.id).length}
                  bookingCount={bookings.filter(b => b.collective_id === c.id).length}
                  statusConfig={STATUS_CONFIG}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* EZQuote Tab */}
      {activeTab === 'ezquote' && <EZQuoteBuilder collectives={collectives} />}
    </div>
  );
}