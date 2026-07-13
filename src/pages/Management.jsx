// @ts-nocheck
import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { RefreshCw, CheckCircle2, Package, TrendingUp, BriefcaseBusiness } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const STAGE_LABELS = {
  2: 'Stage 2 — Product Evaluation & Approval',
};

const COLLECTIVE_STATUS_COLOR = {
  draft:                '#94a3b8',
  active:               '#10b981',
  open_booking:         '#0ea5e9',
  confirmed_departure:  '#6d28d9',
  ongoing:              '#f59e0b',
  completed:            '#10b981',
  cancelled:            '#ef4444',
};

export default function Management() {
  const [collectives, setCollectives] = useState([]);
  const [managementTasks, setManagementTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [cols, tasks] = await Promise.all([
        base44.entities.Collective.list(),
        base44.entities.ChecklistTask.list(),
      ]);
      setCollectives(Array.isArray(cols) ? cols : []);
      const tasksArr = Array.isArray(tasks) ? tasks : [];
      setManagementTasks(tasksArr.filter(t => t.department === 'management'));
    } catch (e) {
      console.error('Management loadData error:', e);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    const onRefresh = () => loadData();
    window.addEventListener('gladex:refresh', onRefresh);
    return () => window.removeEventListener('gladex:refresh', onRefresh);
  }, []);

  const byCollective = {};
  managementTasks.forEach(t => {
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

  const totalTasks = managementTasks.length;
  const doneTasks  = managementTasks.filter(t => t.status === 'done' || t.status === 'completed').length;
  const overallPct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  // Portfolio overview
  const statusCounts = {};
  collectives.forEach(c => { statusCounts[c.status] = (statusCounts[c.status] || 0) + 1; });

  return (
    <div className="space-y-5 pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-jakarta text-foreground">Management</h2>
          <p className="text-sm text-muted-foreground">Checklist progress · Product Evaluation & Approval (Stage 2)</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadData} className="gap-1.5 text-xs w-fit">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </Button>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Packages',   value: collectives.length, icon: Package,          color: '#a78bfa' },
          { label: 'Total Tasks',       value: totalTasks,         icon: BriefcaseBusiness, color: '#a78bfa' },
          { label: 'Completed',         value: doneTasks,          icon: CheckCircle2,      color: '#10b981' },
          { label: 'Overall Progress',  value: `${overallPct}%`,  icon: TrendingUp,        color: overallPct === 100 ? '#10b981' : '#a78bfa' },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="bg-card rounded-2xl border border-border p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(139,92,246,0.15)' }}>
                <Icon className="w-5 h-5" style={{ color: s.color }} />
              </div>
              <div>
                <p className="text-xl font-bold font-jakarta leading-tight text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Portfolio breakdown */}
      {collectives.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <BriefcaseBusiness className="w-4 h-4" style={{ color: '#a78bfa' }} /> Package Portfolio
          </h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(statusCounts).map(([status, count]) => (
              <div key={status} className="flex items-center gap-1.5 bg-muted rounded-full px-3 py-1">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: COLLECTIVE_STATUS_COLOR[status] || '#94a3b8' }} />
                <span className="text-xs font-medium text-foreground capitalize">{status.replace(/_/g, ' ')}</span>
                <span className="text-xs font-bold text-muted-foreground">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Checklist Progress */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[1,2,3,4].map(i => <div key={i} className="h-36 bg-card rounded-xl border animate-pulse" />)}
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-2xl border border-border">
          <BriefcaseBusiness className="w-12 h-12 mx-auto mb-4" style={{ color: 'rgba(139,92,246,0.3)' }} />
          <h3 className="font-semibold text-foreground mb-1">No management tasks yet</h3>
          <p className="text-sm text-muted-foreground">Management checklist tasks will appear here once created in the Workflow module.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <BriefcaseBusiness className="w-4 h-4" style={{ color: '#a78bfa' }} />
            <h3 className="text-base font-bold text-foreground">Management Checklist Progress</h3>
            <span className="text-xs text-muted-foreground px-2 py-0.5 bg-muted rounded-full">
              {entries.length} collective{entries.length !== 1 ? 's' : ''}
            </span>
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
                      <div className="h-full rounded-full transition-all" style={{
                        width: `${pct}%`,
                        background: allDone ? 'linear-gradient(90deg, #10b981, #34d399)' : 'linear-gradient(90deg, #6d28d9, #a78bfa)',
                      }} />
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
      )}
    </div>
  );
}
