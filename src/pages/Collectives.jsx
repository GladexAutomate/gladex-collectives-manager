import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Globe, BarChart3, Users, TrendingUp, CheckCircle2, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import CollectiveWorkspace from '@/components/collectives/CollectiveWorkspace';

const statusConfig = {
  draft:               { label: 'Draft',               color: 'text-slate-600' },
  active:              { label: 'Active',               color: 'text-emerald-600' },
  open_booking:        { label: 'Open Booking',         color: 'text-teal-600' },
  confirmed_departure: { label: 'Confirmed Departure',  color: 'text-sky-600' },
  ongoing:             { label: 'Ongoing Travel',       color: 'text-amber-600' },
  completed:           { label: 'Completed',            color: 'text-emerald-600' },
  cancelled:           { label: 'Cancelled',            color: 'text-rose-600' },
};

export default function Collectives() {
  const [collectives, setCollectives] = useState([]);
  const [marketingAssets, setMarketingAssets] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadCollectives = () => {
    Promise.all([
      base44.entities.Collective.list('-created_date'),
      base44.entities.MarketingAsset.list(),
    ]).then(([colls, assets]) => {
      setCollectives(colls);
      setMarketingAssets(assets);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => {
    loadCollectives();
    const unsubC = base44.entities.Collective.subscribe(e => {
      if (e.type === 'create') setCollectives(p => [e.data, ...p]);
      else if (e.type === 'update') setCollectives(p => p.map(c => c.id === e.id ? e.data : c));
      else if (e.type === 'delete') setCollectives(p => p.filter(c => c.id !== e.id));
    });
    const unsubA = base44.entities.MarketingAsset.subscribe(e => {
      if (e.type === 'create') setMarketingAssets(p => [...p, e.data]);
      else if (e.type === 'update') setMarketingAssets(p => p.map(a => a.id === e.id ? e.data : a));
      else if (e.type === 'delete') setMarketingAssets(p => p.filter(a => a.id !== e.id));
    });
    return () => { unsubC(); unsubA(); };
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
    <div className="space-y-4">
      {/* Header Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-card rounded-xl border border-border p-4 text-center md:col-span-1">
          <p className="text-2xl font-bold font-jakarta text-foreground">{collectives.length}</p>
          <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1"><Globe className="w-3 h-3" /> Total</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold font-jakarta text-teal-600">{activeCount}</p>
          <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1"><CheckCircle2 className="w-3 h-3" /> Active</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold font-jakarta text-slate-600">{collectives.filter(c => c.status === 'draft').length}</p>
          <p className="text-xs text-muted-foreground mt-1">Draft</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold font-jakarta text-amber-600">{totalPax.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1"><Users className="w-3 h-3" /> Booked Pax</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 text-center">
          <p className="text-lg font-bold font-jakarta text-emerald-600">₱{(totalRevenue / 1000000).toFixed(1)}M</p>
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