import { useState, useMemo } from 'react';
import {
  CheckCircle, Circle, Loader2, AlertTriangle, X,
  ChevronDown, ChevronRight, Clock, CheckSquare, Zap
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import TaskRow from './TaskRow';

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

// Tasks are passed in from the parent (Workflow.jsx) which owns the subscription.
// This component is display-only — no extra fetching or subscriptions.
export default function DepartmentWorkflowView({ collectiveId, tasks = [], loading = false, error = null, onRetry, onToggle }) {
  const [selectedDept, setSelectedDept] = useState('all');
  const [collapsedStages, setCollapsedStages] = useState({});



  // Per-department stats
  const deptStats = Object.entries(DEPT_CONFIG).map(([dept, cfg]) => {
    const dt = tasks.filter(t => t.department === dept);
    const done = dt.filter(t => t.status === 'completed').length;
    const inProgress = dt.filter(t => t.status === 'in_progress').length;
    const pending = dt.filter(t => t.status === 'pending').length;
    const blocked = dt.filter(t => t.status === 'delayed').length;
    const autoCount = dt.filter(t => t.completion_mode === 'auto').length;
    const manualCount = dt.filter(t => t.completion_mode === 'manual').length;
    const pct = dt.length > 0 ? Math.round((done / dt.length) * 100) : 0;
    const isComplete = dt.length > 0 && done === dt.length;
    return { dept, cfg, total: dt.length, done, inProgress, pending, blocked, autoCount, manualCount, pct, isComplete };
  }).filter(d => d.total > 0);

  const displayTasks = selectedDept !== 'all' ? tasks.filter(t => t.department === selectedDept) : tasks;

  // Group by stage
  const stageMap = {};
  displayTasks.forEach(t => {
    if (!stageMap[t.stage_number]) {
      stageMap[t.stage_number] = { number: t.stage_number, name: t.stage_name, phase: t.phase_number, phaseName: t.phase_name, tasks: [] };
    }
    stageMap[t.stage_number].tasks.push(t);
  });
  const stages = Object.values(stageMap).sort((a, b) => a.number - b.number);

  const activeStat = selectedDept !== 'all' ? deptStats.find(d => d.dept === selectedDept) : null;
  const activeCfg = selectedDept !== 'all' ? DEPT_CONFIG[selectedDept] : null;

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <Loader2 className="w-6 h-6 animate-spin text-primary" />
      <p className="text-xs text-muted-foreground">Loading workflow checklist...</p>
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center py-12 gap-3 bg-card border border-border rounded-xl">
      <AlertTriangle className="w-8 h-8 text-rose-500" />
      <p className="text-sm font-medium text-foreground">{error}</p>
      {onRetry && <button onClick={onRetry} className="text-xs text-primary hover:underline">Retry</button>}
    </div>
  );

  if (tasks.length === 0) return null;

  const allDone = tasks.filter(t => t.status === 'completed').length;
  const allInProgress = tasks.filter(t => t.status === 'in_progress').length;
  const allPending = tasks.filter(t => t.status === 'pending').length;
  const allBlocked = tasks.filter(t => t.status === 'delayed').length;

  return (
    <div className="space-y-5">

      {/* ── Legend ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4 text-[10px] text-muted-foreground bg-muted/40 border border-border rounded-lg px-4 py-2.5 flex-wrap">
        <span className="font-semibold text-foreground text-xs">Completion Mode:</span>
        <span className="flex items-center gap-1.5">
          <span className="inline-flex items-center gap-0.5 text-[9px] text-slate-500 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded font-medium">
            <Zap className="w-2.5 h-2.5" /> Auto-Sync
          </span>
          System detects completion automatically
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-flex items-center gap-0.5 text-[9px] text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded font-medium">
            <Circle className="w-2.5 h-2.5" /> Manual
          </span>
          Department confirms external action
        </span>
      </div>

      {/* ── Department Cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {deptStats.map(({ dept, cfg, total, done, inProgress, pending, blocked, autoCount, manualCount, pct, isComplete }) => (
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
              <div className="text-right flex items-center gap-1">
                <span className={cn("text-lg font-bold font-jakarta", isComplete ? 'text-emerald-600' : cfg.text)}>{pct}%</span>
                {isComplete && <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />}
              </div>
            </div>

            <p className={cn("text-xs font-bold mb-2", cfg.text)}>{cfg.label}</p>
            <Progress value={pct} className="h-1.5 mb-2" />

            <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[10px] mb-2">
              <span className="text-emerald-600 font-medium">✓ {done} done</span>
              <span className="text-muted-foreground">{pending} pending</span>
              {inProgress > 0 && <span className="text-sky-600">◌ {inProgress} active</span>}
              {blocked > 0 && <span className="text-rose-600">⚠ {blocked} blocked</span>}
            </div>

            {/* Auto/Manual split */}
            <div className="flex gap-1.5 flex-wrap">
              <span className="inline-flex items-center gap-0.5 text-[9px] text-slate-500 bg-slate-50 border border-slate-200 px-1 py-0.5 rounded">
                <Zap className="w-2 h-2" /> {autoCount}
              </span>
              <span className="inline-flex items-center gap-0.5 text-[9px] text-amber-600 bg-amber-50 border border-amber-200 px-1 py-0.5 rounded">
                <Circle className="w-2 h-2" /> {manualCount}
              </span>
            </div>

            {isComplete && (
              <div className="mt-2 text-[10px] font-semibold text-emerald-600 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> Department Complete
              </div>
            )}
          </button>
        ))}
      </div>

      {/* ── Active dept header / all-dept summary ───────────────────────────── */}
      {activeStat && activeCfg ? (
        <div className={cn("rounded-xl border p-4 flex items-center justify-between", activeCfg.light, activeCfg.border)}>
          <div>
            <h3 className={cn("font-bold font-jakarta text-sm", activeCfg.text)}>{activeCfg.label} Department</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {activeStat.done} done · {activeStat.pending} pending · {activeStat.inProgress} active
              {activeStat.blocked > 0 && ` · ${activeStat.blocked} blocked`}
              {' · '}{activeStat.autoCount} auto-sync · {activeStat.manualCount} manual
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className={cn("text-2xl font-bold font-jakarta", activeCfg.text)}>{activeStat.pct}%</p>
              {activeStat.isComplete && <p className="text-[10px] text-emerald-600 font-semibold">COMPLETE ✓</p>}
            </div>
            <button onClick={() => setSelectedDept('all')} className="text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-4 text-xs bg-card border border-border rounded-xl px-4 py-3">
          <span className="font-semibold text-foreground">All Departments</span>
          <span className="flex items-center gap-1 text-emerald-600 font-medium"><CheckSquare className="w-3.5 h-3.5" /> {allDone} done</span>
          <span className="flex items-center gap-1 text-sky-600"><Loader2 className="w-3.5 h-3.5" /> {allInProgress} active</span>
          <span className="flex items-center gap-1 text-muted-foreground"><Clock className="w-3.5 h-3.5" /> {allPending} pending</span>
          {allBlocked > 0 && <span className="flex items-center gap-1 text-rose-600"><AlertTriangle className="w-3.5 h-3.5" /> {allBlocked} blocked</span>}
          <span className="ml-auto text-muted-foreground">{tasks.length} total</span>
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
          const manualPending = stage.tasks.filter(t => t.completion_mode === 'manual' && t.status !== 'completed').length;
          const stageComplete = done === total && total > 0;

          return (
            <div key={stage.number} className="rounded-xl border border-border overflow-hidden shadow-sm">
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
                  <div className="hidden sm:flex items-center gap-2 text-[10px] text-slate-300">
                    {inProgress > 0 && <span className="text-sky-300">◌ {inProgress}</span>}
                    {blocked > 0 && <span className="text-rose-300">⚠ {blocked}</span>}
                    {manualPending > 0 && !stageComplete && (
                      <span className="text-amber-300 flex items-center gap-0.5">
                        <Circle className="w-2.5 h-2.5" /> {manualPending} manual
                      </span>
                    )}
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
                    .map((task, idx) => (
                      <TaskRow
                       key={task.id}
                       task={task}
                       idx={idx}
                       onToggle={onToggle}
                       showDept={selectedDept === 'all'}
                      />
                    ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}