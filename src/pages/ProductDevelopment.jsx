// @ts-nocheck
import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { broadcastRefresh } from '@/lib/dataSync';
import { Plus, TrendingUp, Search, Edit, FileText, Plane, Calendar, Package, ArrowRight, BarChart3, CheckCircle2 } from 'lucide-react';
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
  active:               { label: '🟢 Active',             class: 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 font-semibold' },
  open_booking:         { label: '🟢 Open Booking',      class: 'bg-teal-100 dark:bg-teal-950/30 text-teal-700 dark:text-teal-300 font-semibold' },
  confirmed_departure:  { label: '✈ Confirmed Departure', class: 'bg-sky-100 dark:bg-sky-950/25 text-sky-700 dark:text-sky-300 font-semibold' },
  ongoing:              { label: '🌍 Ongoing Travel',     class: 'bg-amber-100 dark:bg-amber-950/25 text-amber-700 dark:text-amber-300 font-semibold' },
  completed:            { label: '✓ Completed',           class: 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 font-semibold' },
  cancelled:            { label: 'Cancelled',             class: 'bg-rose-100 dark:bg-rose-950/25 text-rose-700 dark:text-rose-300' },
};

export default function ProductDevelopment() {
  const [collectives, setCollectives] = useState([]);
  const [marketingAssets, setMarketingAssets] = useState([]);
  const [pdCollectiveIds, setPdCollectiveIds] = useState(new Set());
  const [pdTasks, setPdTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const urlParams = new URLSearchParams(window.location.search);
  const [activeTab, setActiveTab] = useState(urlParams.get('tab') === 'ezquote' ? 'ezquote' : 'packages');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const loadData = () => {
    Promise.all([
      base44.entities.Collective.list('-created_date'),
      base44.entities.MarketingAsset.list(),
    ]).then(([cols, assets]) => {
      setCollectives(Array.isArray(cols) ? cols : []);
      setMarketingAssets(Array.isArray(assets) ? assets : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
    base44.entities.ChecklistTask.list()
      .then(tasks => {
        const arr = Array.isArray(tasks) ? tasks : [];
        const pdFiltered = arr.filter(t => t.department === 'product_development');
        setPdCollectiveIds(new Set(pdFiltered.map(t => t.collective_id).filter(Boolean)));
        setPdTasks(pdFiltered);
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

  const stats = [
    { label: 'Total Packages', value: collectives.length, color: 'text-foreground', icon: Package },
    { label: 'Active', value: collectives.filter(c => c.status === 'active').length, color: 'text-emerald-600', icon: TrendingUp },
  ];

  return (
    <div className="space-y-5 pb-6">
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
            <div key={i} className="bg-card rounded-2xl border border-border p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(139,92,246,0.18)' }}>
                <Icon className="w-5 h-5" style={{ color: '#a78bfa' }} />
              </div>
              <div>
                <p className="text-xl font-bold font-jakarta leading-tight text-foreground">{s.value}</p>
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
                    bookingCount={0}
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
          onCollectivesChange={() => base44.entities.Collective.list('-created_date').then(data => setCollectives(Array.isArray(data) ? data : []))}
        />
      )}

      {/* Product Dev Checklist Progress */}
      {pdTasks.length > 0 && (() => {
        const byCollective = {};
        pdTasks.forEach(t => {
          if (!t.collective_id) return;
          if (!byCollective[t.collective_id]) byCollective[t.collective_id] = [];
          byCollective[t.collective_id].push(t);
        });
        const entries = Object.entries(byCollective).map(([cid, tasks]) => {
          const collective = collectives.find(c => c.id === cid);
          const done  = tasks.filter(t => t.status === 'done' || t.status === 'completed').length;
          const total = tasks.length;
          const pct   = total > 0 ? Math.round((done / total) * 100) : 0;
          return { cid, collective, tasks, done, total, pct };
        }).filter(e => e.collective).sort((a, b) => a.pct - b.pct);
        if (entries.length === 0) return null;
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-4 h-4" style={{ color: '#a78bfa' }} />
              <h3 className="text-base font-bold text-foreground">Product Dev Checklist Progress</h3>
              <span className="text-xs text-muted-foreground px-2 py-0.5 bg-muted rounded-full">{entries.length} collective{entries.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {entries.map(({ cid, collective, tasks, done, total, pct }) => {
                const stageGroups = {};
                tasks.forEach(t => {
                  const key = t.stage_name || (t.stage_number ? `Stage ${t.stage_number}` : 'Task');
                  if (!stageGroups[key]) stageGroups[key] = { done: 0, total: 0 };
                  stageGroups[key].total++;
                  if (t.status === 'done' || t.status === 'completed') stageGroups[key].done++;
                });
                const allDone = pct === 100;
                return (
                  <div key={cid} className="bg-card border border-border rounded-xl p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-foreground truncate">{collective.name}</p>
                        <p className="text-xs text-muted-foreground">{collective.destination || '—'} · {collective.status?.replace(/_/g, ' ') || '—'}</p>
                      </div>
                      <span className="text-sm font-black flex-shrink-0" style={{ color: allDone ? '#10b981' : '#a78bfa' }}>{pct}%</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(stageGroups).map(([stage, sg]) => (
                        <span key={stage} className={cn(
                          "text-[10px] font-semibold px-2 py-0.5 rounded-full border",
                          sg.done === sg.total
                            ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                            : "bg-violet-500/10 border-violet-500/20 text-violet-600 dark:text-violet-400"
                        )}>
                          {stage} · {sg.done}/{sg.total}
                        </span>
                      ))}
                    </div>
                    <div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden mb-1.5">
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: allDone ? 'linear-gradient(90deg,#10b981,#34d399)' : 'linear-gradient(90deg,#6d28d9,#a78bfa)' }} />
                      </div>
                      <div className="flex justify-between text-[10px] text-muted-foreground">
                        <span>{done} done</span>
                        <span>{total - done} remaining</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}
    </div>
  );
}