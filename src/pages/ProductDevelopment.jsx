// @ts-nocheck
import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { broadcastRefresh } from '@/lib/dataSync';
import { Plus, TrendingUp, Search, Edit, FileText, Users, Plane, Calendar, DollarSign, Package, ArrowRight, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import PackageCard from '@/components/product/PackageCard';
import EZQuoteWorkspace from '@/pages/EZQuoteWorkspace';
import WorkflowProgressBar from '@/components/workflow/WorkflowProgressBar';

const STATUS_CONFIG = {
  draft:                { label: 'Draft',                class: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300' },
  active:               { label: '🟢 Active',             class: 'bg-emerald-100 text-emerald-700 font-semibold' },
  open_booking:         { label: '🟢 Open Booking',      class: 'bg-teal-100 text-teal-700 font-semibold' },
  confirmed_departure:  { label: '✈ Confirmed Departure', class: 'bg-sky-100 text-sky-700 font-semibold' },
  ongoing:              { label: '🌍 Ongoing Travel',     class: 'bg-amber-100 text-amber-700 font-semibold' },
  completed:            { label: '✓ Completed',           class: 'bg-emerald-100 text-emerald-700 font-semibold' },
  cancelled:            { label: 'Cancelled',             class: 'bg-rose-100 text-rose-700' },
};

export default function ProductDevelopment() {
  const [collectives, setCollectives] = useState([]);
  const [marketingAssets, setMarketingAssets] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [pdCollectiveIds, setPdCollectiveIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const urlParams = new URLSearchParams(window.location.search);
  const [activeTab, setActiveTab] = useState(urlParams.get('tab') === 'ezquote' ? 'ezquote' : 'packages');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const loadData = () => {
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
  };

  useEffect(() => {
    loadData();
    base44.entities.ChecklistTask.list()
      .then(tasks => {
        const pdIds = new Set(
          tasks.filter(t => t.department === 'product_development').map(t => t.collective_id).filter(Boolean)
        );
        setPdCollectiveIds(pdIds);
      })
      .catch(() => {});
    const onRefresh = () => loadData();
    window.addEventListener('gladex:refresh', onRefresh);
    return () => window.removeEventListener('gladex:refresh', onRefresh);
  }, []);

  const filtered = collectives.filter(c => {
    if (!pdCollectiveIds.has(c.id)) return false;
    const matchSearch = !search || c.name?.toLowerCase().includes(search.toLowerCase()) || c.destination?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalRevenue = collectives.reduce((acc, c) => acc + (c.total_revenue || 0), 0);
  const totalPax = collectives.reduce((acc, c) => acc + (c.booked_pax || 0), 0);

  const stats = [
    { label: 'Total Packages', value: collectives.length, color: 'text-foreground', icon: Package },
    { label: 'Active', value: collectives.filter(c => c.status === 'active').length, color: 'text-emerald-600', icon: TrendingUp },
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
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search packages or destination..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="All Status" /></SelectTrigger>
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
                <div key={c.id} className="space-y-2">
                  <PackageCard
                    collective={c}
                    assetCount={marketingAssets.filter(a => a.collective_id === c.id).length}
                    bookingCount={bookings.filter(b => b.collective_id === c.id).length}
                    statusConfig={STATUS_CONFIG}
                  />
                  <WorkflowProgressBar collectiveId={c.id} compact={true} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* EZQuote Tab */}
      {activeTab === 'ezquote' && (
        <EZQuoteWorkspace
          collectives={collectives}
          onCollectivesChange={() => base44.entities.Collective.list('-created_date').then(setCollectives)}
        />
      )}
    </div>
  );
}