import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import {
  Loader2, AlertTriangle, ChevronDown, ChevronRight, Building2,
  Globe, ListChecks, Inbox
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import TaskRow from '@/components/workflow/TaskRow';
import DepartmentKPIs from './DepartmentKPIs';
import { DEPARTMENTS, STATUS_LABELS, LIFECYCLE_LABELS, LIFECYCLE_COLORS, isOverdue } from '@/lib/departments';

// Reusable workspace for a single department — aggregates that department's
// tasks across ALL packages (collectives) with a dashboard + task management.
export default function DepartmentHub({ deptKey }) {
  const cfg = DEPARTMENTS[deptKey];
  const [tasks, setTasks] = useState([]);
  const [collectives, setCollectives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [collectiveFilter, setCollectiveFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [collapsed, setCollapsed] = useState({});

  const progressDebounce = useRef(null);
  const triggerProgressUpdate = useCallback((cid) => {
    if (progressDebounce.current) clearTimeout(progressDebounce.current);
    progressDebounce.current = setTimeout(() => {
      base44.functions.invoke('updateWorkflowProgress', { collective_id: cid }).catch(() => {});
    }, 1500);
  }, []);

  const loadData = useCallback(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      base44.entities.ChecklistTask.filter({ department: deptKey }, '-updated_date', 1000),
      base44.entities.Collective.list('-updated_date', 200),
    ])
      .then(([t, c]) => { setTasks(t); setCollectives(c); setLoading(false); })
      .catch(() => { setError('Unable to load department tasks. Please try again.'); setLoading(false); });
  }, [deptKey]);

  useEffect(() => {
    setCollectiveFilter('all');
    setStatusFilter('all');
    loadData();
  }, [deptKey, loadData]);

  const handleToggle = async (task, newStatus) => {
    await base44.entities.ChecklistTask.update(task.id, {
      status: newStatus,
      completed_at: newStatus === 'completed' ? new Date().toISOString() : null,
    });
    setTasks(p => p.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
    triggerProgressUpdate(task.collective_id);
  };

  const collectiveName = (id) => collectives.find(c => c.id === id)?.name || 'Unknown Package';
  const collectiveStatus = (id) => collectives.find(c => c.id === id)?.status || 'draft';

  // Stats for the whole department (respecting collective filter only)
  const scopeTasks = useMemo(
    () => collectiveFilter === 'all' ? tasks : tasks.filter(t => t.collective_id === collectiveFilter),
    [tasks, collectiveFilter]
  );

  const stats = useMemo(() => {
    const done = scopeTasks.filter(t => t.status === 'completed').length;
    const inProgress = scopeTasks.filter(t => t.status === 'in_progress').length;
    const pending = scopeTasks.filter(t => t.status === 'pending').length;
    const overdue = scopeTasks.filter(isOverdue).length;
    const total = scopeTasks.length;
    return { total, done, inProgress, pending, overdue, pct: total ? Math.round((done / total) * 100) : 0 };
  }, [scopeTasks]);

  // Apply status filter for display
  const displayTasks = statusFilter === 'all' ? scopeTasks : scopeTasks.filter(t => t.status === statusFilter);

  // Group by collective → then sort tasks by stage/order
  const grouped = useMemo(() => {
    const map = {};
    displayTasks.forEach(t => {
      if (!map[t.collective_id]) map[t.collective_id] = [];
      map[t.collective_id].push(t);
    });
    return Object.entries(map)
      .map(([cid, list]) => ({
        cid,
        tasks: list.sort((a, b) => (a.stage_number - b.stage_number) || (a.order_index || 0) - (b.order_index || 0)),
        done: list.filter(t => t.status === 'completed').length,
      }))
      .sort((a, b) => collectiveName(a.cid).localeCompare(collectiveName(b.cid)));
  }, [displayTasks, collectives]);

  if (!cfg) return <div className="p-8 text-center text-muted-foreground">Unknown department.</div>;

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center text-white text-base font-bold flex-shrink-0", cfg.bg)}>
            {cfg.short}
          </div>
          <div>
            <h2 className="text-xl font-bold font-jakarta text-foreground">{cfg.label} Department</h2>
            <p className="text-sm text-muted-foreground">Dashboard · Task management across all packages</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Select value={collectiveFilter} onValueChange={setCollectiveFilter}>
            <SelectTrigger className="w-52 h-9 text-xs"><SelectValue placeholder="All Packages" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Packages</SelectItem>
              {collectives.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36 h-9 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {Object.entries(STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── Loading / Error ── */}
      {loading && (
        <div className="flex items-center gap-3 bg-card border border-border rounded-xl p-6">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading {cfg.label} tasks...</p>
        </div>
      )}
      {error && !loading && (
        <div className="flex flex-col items-center gap-3 bg-card border border-rose-200 rounded-xl p-8 text-center">
          <AlertTriangle className="w-8 h-8 text-rose-500" />
          <p className="text-sm font-medium text-foreground">{error}</p>
          <button onClick={loadData} className="text-xs text-primary hover:underline">Retry</button>
        </div>
      )}

      {!loading && !error && (
        <>
          {/* ── KPI Dashboard ── */}
          <DepartmentKPIs stats={stats} cfg={cfg} />

          {/* ── Overall progress bar ── */}
          <div className={cn("rounded-xl border p-4", cfg.light, cfg.border)}>
            <div className="flex items-center justify-between mb-2">
              <span className={cn("text-xs font-semibold", cfg.text)}>Department Completion</span>
              <span className={cn("text-sm font-bold font-jakarta", cfg.text)}>{stats.pct}%</span>
            </div>
            <Progress value={stats.pct} className="h-2" />
          </div>

          {/* ── Empty state ── */}
          {tasks.length === 0 ? (
            <div className="bg-card rounded-xl border border-border p-12 text-center">
              <Inbox className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-40" />
              <h3 className="font-bold font-jakarta text-foreground mb-1">No tasks yet</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                {cfg.label} tasks appear here automatically once packages have generated their workflow checklists.
              </p>
            </div>
          ) : grouped.length === 0 ? (
            <div className="bg-card rounded-xl border border-border p-10 text-center">
              <ListChecks className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
              <p className="text-sm text-muted-foreground">No tasks match the current filters.</p>
            </div>
          ) : (
            /* ── Task list grouped by package ── */
            <div className="space-y-3">
              {grouped.map(group => {
                const isCollapsed = collapsed[group.cid];
                const pct = Math.round((group.done / group.tasks.length) * 100);
                const status = collectiveStatus(group.cid);
                return (
                  <div key={group.cid} className="rounded-xl border border-border overflow-hidden shadow-sm">
                    <button
                      onClick={() => setCollapsed(p => ({ ...p, [group.cid]: !p[group.cid] }))}
                      className="w-full flex items-center justify-between px-4 py-3 text-left bg-slate-800 dark:bg-slate-900"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Globe className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate">{collectiveName(group.cid)}</p>
                          <Badge className={cn("text-[9px] mt-0.5", LIFECYCLE_COLORS[status])}>{LIFECYCLE_LABELS[status]}</Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="hidden sm:flex items-center gap-2">
                          <div className="w-20 h-1.5 bg-white/20 rounded-full overflow-hidden">
                            <div className={cn("h-full rounded-full", pct === 100 ? "bg-emerald-400" : "bg-amber-400")} style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-[10px] text-slate-300 font-mono w-9">{group.done}/{group.tasks.length}</span>
                        </div>
                        {isCollapsed ? <ChevronRight className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                      </div>
                    </button>
                    {!isCollapsed && (
                      <div className="divide-y divide-border bg-card">
                        {group.tasks.map((task, idx) => (
                          <TaskRow key={task.id} task={task} idx={idx} onToggle={handleToggle} />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}