// @ts-nocheck
import { useState, useEffect } from 'react';
import { db } from '@/lib/db';
import { Globe, BarChart3, Users, TrendingUp, CheckCircle2, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import CollectiveWorkspace from '@/components/collectives/CollectiveWorkspace';

const statusConfig = {
  draft:               { label: 'Draft',               color: 'text-slate-600 dark:text-slate-400' },
  active:              { label: 'Active',               color: 'text-emerald-600 dark:text-emerald-400' },
  open_booking:        { label: 'Open Booking',         color: 'text-teal-600 dark:text-teal-400' },
  confirmed_departure: { label: 'Confirmed Departure',  color: 'text-sky-600 dark:text-sky-300' },
  ongoing:             { label: 'Ongoing Travel',       color: 'text-amber-600 dark:text-amber-400' },
  completed:           { label: 'Completed',            color: 'text-emerald-600 dark:text-emerald-400' },
  cancelled:           { label: 'Cancelled',            color: 'text-rose-600 dark:text-rose-400' },
};

export default function Collectives() {
  const [collectives, setCollectives] = useState([]);
  const [marketingAssets, setMarketingAssets] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadCollectives = () => {
    Promise.all([
      db.Collective.list('-created_date'),
      db.MarketingAsset.list(),
    ]).then(([colls, assets]) => {
      setCollectives(Array.isArray(colls) ? colls : []);
      setMarketingAssets(Array.isArray(assets) ? assets : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => {
    loadCollectives();
    const onRefresh = () => loadCollectives();
    window.addEventListener('gladex:refresh', onRefresh);
    return () => window.removeEventListener('gladex:refresh', onRefresh);
  }, []);

  // Stats
  const totalPax = collectives.reduce((s, c) => s + (c.booked_pax || 0), 0);
  const totalRevenue = collectives.reduce((s, c) => s + ((c.selling_price || 0) * (c.booked_pax || 0)), 0);
  const activeCount = collectives.filter(c => ['active', 'confirmed_departure', 'ongoing'].includes(c.status)).length;

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-20 bg-card rounded-xl border border-border animate-pulse" />
        <div className="h-[600px] bg-card rounded-xl border border-border animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-6">
      {/* Header Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-card rounded-xl border border-border p-4 text-center md:col-span-1">
          <p className="text-2xl font-bold font-jakarta text-foreground">{collectives.length}</p>
          <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1"><Globe className="w-3 h-3" /> Total</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold font-jakarta text-teal-600 dark:text-teal-400">{activeCount}</p>
          <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1"><CheckCircle2 className="w-3 h-3" /> Active</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold font-jakarta text-muted-foreground">{collectives.filter(c => c.status === 'draft').length}</p>
          <p className="text-xs text-muted-foreground mt-1">Draft</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold font-jakarta text-amber-600 dark:text-amber-400">{totalPax.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1"><Users className="w-3 h-3" /> Booked Pax</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 text-center">
          <p className="text-lg font-bold font-jakarta text-emerald-600 dark:text-emerald-400">₱{(totalRevenue / 1000000).toFixed(1)}M</p>
          <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1"><TrendingUp className="w-3 h-3" /> Est. Revenue</p>
        </div>
      </div>

      {/* Main Workspace */}
      <div style={{ height: 'calc(100vh - 220px)', minHeight: '650px' }}>
        <CollectiveWorkspace
          collectives={collectives}
          marketingAssets={marketingAssets}
          onCollectivesChange={loadCollectives}
        />
      </div>
    </div>
  );
}