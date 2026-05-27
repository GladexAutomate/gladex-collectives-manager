import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import {
  CheckCircle, Circle, Loader2, AlertTriangle, X,
  ChevronDown, ChevronRight, Bot, Lock, Clock, CheckSquare
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

const DEPT_CONFIG = {
  product_development: { label: 'Product Development', short: 'PD', bg: 'bg-amber-500',   light: 'bg-amber-50 dark:bg-amber-950/20',   border: 'border-amber-200 dark:border-amber-800',   text: 'text-amber-700 dark:text-amber-400',   badge: 'bg-amber-100 text-amber-700' },
  marketing:           { label: 'Marketing',           short: 'MK', bg: 'bg-pink-500',    light: 'bg-pink-50 dark:bg-pink-950/20',     border: 'border-pink-200 dark:border-pink-800',     text: 'text-pink-700 dark:text-pink-400',     badge: 'bg-pink-100 text-pink-700' },
  sales:               { label: 'Sales',               short: 'SL', bg: 'bg-emerald-500', light: 'bg-emerald-50 dark:bg-emerald-950/20', border: 'border-emerald-200 dark:border-emerald-800', text: 'text-emerald-700 dark:text-emerald-400', badge: 'bg-emerald-100 text-emerald-700' },
  accounting:          { label: 'Accounting',          short: 'AC', bg: 'bg-purple-500',  light: 'bg-purple-50 dark:bg-purple-950/20', border: 'border-purple-200 dark:border-purple-800', text: 'text-purple-700 dark:text-purple-400', badge: 'bg-purple-100 text-purple-700' },
  admin:               { label: 'Admin',               short: 'AD', bg: 'bg-sky-500',     light: 'bg-sky-50 dark:bg-sky-950/20',       border: 'border-sky-200 dark:border-sky-800',       text: 'text-sky-700 dark:text-sky-400',       badge: 'bg-sky-100 text-sky-700' },
  operations:          { label: 'Operations',          short: 'OP', bg: 'bg-orange-500',  light: 'bg-orange-50 dark:bg-orange-950/20', border: 'border-orange-200 dark:border-orange-800', text: 'text-orange-700 dark:text-orange-400', badge: 'bg-orange-100 text-orange-700' },
  visa:                { label: 'Visa',                short: 'VS', bg: 'bg-rose-500',    light: 'bg-rose-50 dark:bg-rose-950/20',     border: 'border-rose-200 dark:border-rose-800',     text: 'text-rose-700 dark:text-rose-400',     badge: 'bg-rose-100 text-rose-700' },
  management:          { label: 'Management',          short: 'MG', bg: 'bg-slate-500',   light: 'bg-slate-50 dark:bg-slate-900/40',   border: 'border-slate-200 dark:border-slate-700',   text: 'text-slate-700 dark:text-slate-400',   badge: 'bg-slate-100 text-slate-700' },
};

const TASK_STATUS = {
  pending:     { icon: Circle,        label: 'Pending',     cls: 'text-slate-400' },
  in_progress: { icon: Loader2,       label: 'In Progress', cls: 'text-sky-500', spin: true },
  completed:   { icon: CheckCircle,   label: 'Done',        cls: 'text-emerald-500' },
  delayed:     { icon: AlertTriangle, label: 'Blocked',     cls: 'text-rose-500' },
  cancelled:   { icon: X,            label: 'Cancelled',   cls: 'text-slate-400' },
};

const PRIORITY_COLORS = {
  low: 'bg-slate-100 text-slate-600', medium: 'bg-sky-100 text-sky-700',
  high: 'bg-amber-100 text-amber-700', urgent: 'bg-rose-100 text-rose-700',
};

export default function DepartmentWorkflowView({ collectiveId, collectiveName }) {
  const [tasks, setTasks] = useState([]);
  const [selectedDept, setSelectedDept] = useState('all');
  const [collapsedStages, setCollapsedStages] = useState({});
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  useEffect(() => {
    if (!collectiveId) { setLoading(false); return; }
    base44.entities.ChecklistTask.filter({ collective_id: collectiveId })
      .then(t => { setTasks(t); setLoading(false); });

    const unsub = base44.entities.ChecklistTask.subscribe(e => {
      if (e.data?.collective_id !== collectiveId) return;
      if (e.type === 'create') setTasks(p => [...p, e.data]);
      else if (e.type === 'update') setTasks(p => p.map(t => t.id === e.id ? e.data : t));
      else if (e.type === 'delete') setTasks(p => p.filter(t => t.id !== e.id));
    });
    return () => unsub();
  }, [collectiveId]);

  const toggleTask = async (task) => {
    const next = task.status === 'pending' ? 'in_progress' : task.status === 'in_progress' ? 'completed' : 'pending';
    setUpdating(task.id);
    await base44.entities.ChecklistTask.update(task.id, {
      status: next,
      completed_at: next === 'completed' ? new Date().toISOString() : null,
    });
    setTasks(p => p.map(t => t.id === task.id ? { ...t, status: next } : t));
    setUpdating(null);
    base44.functions.invoke('updateWorkflowProgress', { collective_id: collectiveId }).catch(() => {});
  };

  // Per-department stats
  const deptStats = Object.entries(DEPT_CONFIG).map(([dept, cfg]) => {
    const dt = tasks.filter(t => t.department === dept);
    const done = dt.filter(t => t.status === 'completed').length;
    const inProgress = dt.filter(t => t.status === 'in_progress').length;
    const pending = dt.filter(t => t.status === 'pending').length;
    const blocked = dt.filter(t => t.status === 'delayed').length;
    const pct = dt.length > 0 ? Math.round((done / dt.length) * 100) : 0;
    const isComplete = dt.length > 0 && done === dt.length;
    return { dept, cfg, total: dt.length, done, inProgress, pending, blocked, pct, isComplete };
  }).filter(d => d.total > 0);

  const displayTasks = selectedDept !== 'all' ? tasks.filter(t => t.department === selectedDept) : tasks;

  // Group by stage
  const stageMap = {};
  displayTasks.forEach(t => {
    if (!stageMap[t.stage_number]) {
      stageMap[t.stage_number] = {
        number: t.stage_number, name: t.stage_name,
        phase: t.phase_number, phaseName: t.phase_name, tasks: [],
      };
    }
    stageMap[t.stage_number].tasks.push(t);
  });
  const stages = Object.values(stageMap).sort((a, b) => a.number - b.number);

  const activeDeptStat = selectedDept !== 'all' ? deptStats.find(d => d.dept === selectedDept) : null;
  const activeCfg = selectedDept !== 'all' ? DEPT_CONFIG[selectedDept] : null;

  if (loading) return (
    <div className="flex items-center justify-center py-16">
      <Loader2 className="w-6 h-6 animate-spin text-primary" />
    </div>
  );

  if (tasks.length === 0) return null;

  // Aggregate stats for "all" view
  const allDone = tasks.filter(t => t.status === 'completed').length;
  const allInProgress = tasks.filter(t => t.status === 'in_progress').length;
  const allPending = tasks.filter(t => t.status === 'pending').length;
  const allBlocked = tasks.filter(t => t.status === 'delayed').length;

  return (
    <div className="space-y-5">

      {/* ── Department Cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {deptStats.map(({ dept, cfg, total, done, inProgress, pending, blocked, pct, isComplete }) => (
          <button
            key={dept}
            onClick={() => setSelectedDept(selectedDept === dept ? 'all' : dept)}
            className={cn(
              "rounded-xl border p-4 text-left transition-all hover:shadow-md",
              selectedDept === dept
                ? `ring-2 ring-offset-1 shadow-md ${cfg.border} ${cfg.light}`
                : "bg-card border-border hover:bg-muted/30"
            )}
          >
            <div className="flex items-center justify-between mb-3">
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold", cfg.bg)}>
                {cfg.short}
              </div>
              <div className="text-right">
                <span className={cn("text-lg font-bold font-jakarta", isComplete ? 'text-emerald-600' : cfg.text)}>{pct}%</span>
                {isComplete && <CheckCircle className="w-3.5 h-3.5 text-emerald-500 ml-1 inline" />}
              </div>
            </div>

            <p className={cn("text-xs font-bold mb-2", cfg.text)}>{cfg.label}</p>
            <Progress value={pct} className="h-1.5 mb-2" />

            <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[10px]">
              <span className="text-emerald-600 font-medium">✓ {done} done</span>
              <span className="text-muted-foreground">{pending} pending</span>
              {inProgress > 0 && <span className="text-sky-600">◌ {inProgress} active</span>}
              {blocked > 0 && <span className="text-rose-600">⚠ {blocked} blocked</span>}
            </div>

            {isComplete && (
              <div className="mt-2 text-[10px] font-semibold text-emerald-600 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> Department Complete
              </div>
            )}
          </button>
        ))}
      </div>

      {/* ── Active dept header / All-dept summary ───────────────────────────── */}
      {activeDeptStat && activeCfg ? (
        <div className={cn("rounded-xl border p-4 flex items-center justify-between", activeCfg.light, activeCfg.border)}>
          <div>
            <h3 className={cn("font-bold font-jakarta text-sm", activeCfg.text)}>{activeCfg.label} Department Tasks</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {activeDeptStat.done} done · {activeDeptStat.pending} pending · {activeDeptStat.inProgress} in progress
              {activeDeptStat.blocked > 0 && ` · ${activeDeptStat.blocked} blocked`}
              {' · '}{activeDeptStat.total} total
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className={cn("text-2xl font-bold font-jakarta", activeCfg.text)}>{activeDeptStat.pct}%</p>
              {activeDeptStat.isComplete && <p className="text-[10px] text-emerald-600 font-semibold">COMPLETE ✓</p>}
            </div>
            <button onClick={() => setSelectedDept('all')} className="text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-4 text-xs bg-card border border-border rounded-xl px-4 py-3">
          <span className="font-semibold text-foreground">All Departments</span>
          <span className="flex items-center gap-1 text-emerald-600 font-medium">
            <CheckSquare className="w-3.5 h-3.5" /> {allDone} completed
          </span>
          <span className="flex items-center gap-1 text-sky-600">
            <Loader2 className="w-3.5 h-3.5" /> {allInProgress} in progress
          </span>
          <span className="flex items-center gap-1 text-muted-foreground">
            <Clock className="w-3.5 h-3.5" /> {allPending} pending
          </span>
          {allBlocked > 0 && (
            <span className="flex items-center gap-1 text-rose-600 font-medium">
              <AlertTriangle className="w-3.5 h-3.5" /> {allBlocked} blocked
            </span>
          )}
          <span className="ml-auto text-muted-foreground">{tasks.length} total tasks</span>
        </div>
      )}

      {/* ── Stage groups ─────────────────────────────────────────────────────── */}
      <div className="space-y-2">
        {stages.map(stage => {
          const collapsed = collapsedStages[stage.number];
          const done = stage.tasks.filter(t => t.status === 'completed').length;
          const total = stage.tasks.length;
          const pct = Math.round((done / total) * 100);
          const inProgress = stage.tasks.filter(t => t.status === 'in_progress').length;
          const blocked = stage.tasks.filter(t => t.status === 'delayed').length;
          const stageComplete = done === total && total > 0;

          return (
            <div key={stage.number} className="rounded-xl border border-border overflow-hidden shadow-sm">
              {/* Stage header */}
              <button
                onClick={() => setCollapsedStages(p => ({ ...p, [stage.number]: !p[stage.number] }))}
                className={cn("w-full flex items-center justify-between px-4 py-3 text-left",
                  stageComplete ? "bg-emerald-800" : "bg-slate-800 dark:bg-slate-900")}
              >
                <div className="flex items-center gap-3">
                  <span className="text-[10px] bg-white/10 text-white rounded px-2 py-0.5 font-mono font-bold">S{stage.number}</span>
                  <div>
                    <p className="text-xs font-bold text-white">{stage.name}</p>
                    <p className="text-[10px] text-slate-400">Phase {stage.phase}: {stage.phaseName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {/* Stage stats */}
                  <div className="hidden sm:flex items-center gap-3 text-[10px] text-slate-300 mr-2">
                    {inProgress > 0 && <span className="text-sky-300">◌ {inProgress}</span>}
                    {blocked > 0 && <span className="text-rose-300">⚠ {blocked}</span>}
                  </div>
                  {stageComplete && <CheckCircle className="w-4 h-4 text-emerald-300" />}
                  <div className="hidden sm:flex items-center gap-2">
                    <div className="w-20 h-1.5 bg-white/20 rounded-full overflow-hidden">
                      <div className={cn("h-full rounded-full transition-all", stageComplete ? "bg-emerald-400" : "bg-amber-400")}
                        style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-[10px] text-slate-300 font-mono w-8">{done}/{total}</span>
                  </div>
                  {collapsed ? <ChevronRight className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </div>
              </button>

              {!collapsed && (
                <div className="divide-y divide-border bg-card">
                  {stage.tasks
                    .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
                    .map((task, idx) => {
                      const sc = TASK_STATUS[task.status] || TASK_STATUS.pending;
                      const Icon = sc.icon;
                      const isWarning = task.task_name.startsWith('⚠');
                      const isLoading = updating === task.id;
                      const isAutoCompleted = task.notes?.includes('Auto-completed');
                      const deptCfg = DEPT_CONFIG[task.department];

                      return (
                        <div
                          key={task.id}
                          className={cn(
                            "flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors",
                            isWarning && "bg-rose-50/50 dark:bg-rose-950/20",
                            task.status === 'completed' && "opacity-60"
                          )}
                        >
                          <span className="text-[10px] text-muted-foreground w-6 flex-shrink-0 font-mono text-right">
                            {task.order_index || idx + 1}
                          </span>

                          <button onClick={() => toggleTask(task)} disabled={isLoading} className="flex-shrink-0">
                            {isLoading
                              ? <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                              : <Icon className={cn("w-4 h-4", sc.cls, sc.spin && "animate-spin")} />
                            }
                          </button>

                          <div className="flex-1 min-w-0">
                            <p className={cn(
                              "text-sm leading-snug",
                              task.status === 'completed' ? 'line-through text-muted-foreground' :
                              isWarning ? 'text-rose-700 dark:text-rose-400 font-medium' : 'text-foreground'
                            )}>
                              {task.task_name}
                            </p>
                            {task.assigned_to && (
                              <p className="text-[10px] text-muted-foreground mt-0.5">→ {task.assigned_to}</p>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {isAutoCompleted && (
                              <span className="hidden sm:inline-flex items-center gap-0.5 text-[9px] text-sky-600 bg-sky-50 border border-sky-200 px-1.5 py-0.5 rounded">
                                <Bot className="w-2.5 h-2.5" /> Auto
                              </span>
                            )}
                            {task.requires_approval && (
                              <span className="hidden sm:inline-flex items-center gap-0.5 text-[9px] text-purple-700 bg-purple-50 border border-purple-200 px-1.5 py-0.5 rounded">
                                <Lock className="w-2.5 h-2.5" /> Approval
                              </span>
                            )}
                            <Badge className={cn("text-[9px] px-1.5 py-0.5 hidden sm:inline-flex", PRIORITY_COLORS[task.priority])}>
                              {task.priority}
                            </Badge>
                            {deptCfg && selectedDept === 'all' && (
                              <Badge className={cn("text-[9px] px-1.5 py-0.5 hidden md:inline-flex", deptCfg.badge)}>
                                {deptCfg.short}
                              </Badge>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}