import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { CheckCircle, Circle, Loader2, AlertTriangle, X, ChevronDown, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

const DEPT_LABELS = {
  product_development: 'Product Dev', marketing: 'Marketing', sales: 'Sales',
  accounting: 'Accounting', admin: 'Admin', operations: 'Operations',
  visa: 'Visa', management: 'Management'
};
const DEPT_COLORS = {
  product_development: 'bg-amber-100 text-amber-700 border-amber-200',
  marketing: 'bg-pink-100 text-pink-700 border-pink-200',
  sales: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  accounting: 'bg-purple-100 text-purple-700 border-purple-200',
  admin: 'bg-sky-100 text-sky-700 border-sky-200',
  operations: 'bg-orange-100 text-orange-700 border-orange-200',
  visa: 'bg-rose-100 text-rose-700 border-rose-200',
  management: 'bg-slate-100 text-slate-700 border-slate-200',
};
const DEPT_BG = {
  product_development: 'bg-amber-500',
  marketing: 'bg-pink-500',
  sales: 'bg-emerald-500',
  accounting: 'bg-purple-500',
  admin: 'bg-sky-500',
  operations: 'bg-orange-500',
  visa: 'bg-rose-500',
  management: 'bg-slate-500',
};
const statusConfig = {
  pending: { icon: Circle, label: 'Pending', cls: 'text-slate-400' },
  in_progress: { icon: Loader2, label: 'In Progress', cls: 'text-sky-500', spin: true },
  completed: { icon: CheckCircle, label: 'Done', cls: 'text-emerald-500' },
  delayed: { icon: AlertTriangle, label: 'Delayed', cls: 'text-rose-500' },
  cancelled: { icon: X, label: 'Cancelled', cls: 'text-slate-400' },
};

const priorityColors = {
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

    // Trigger progress update
    if (next === 'completed') {
      base44.functions.invoke('updateWorkflowProgress', { collective_id: collectiveId }).catch(() => {});
    }
  };

  const filtered = selectedDept === 'all' ? tasks : tasks.filter(t => t.department === selectedDept);

  // Group by stage
  const stageGroups = {};
  filtered.forEach(t => {
    const key = t.stage_number;
    if (!stageGroups[key]) stageGroups[key] = { number: t.stage_number, name: t.stage_name, phase: t.phase_number, phaseName: t.phase_name, tasks: [] };
    stageGroups[key].tasks.push(t);
  });
  const stages = Object.values(stageGroups).sort((a, b) => a.number - b.number);

  // Per-dept stats
  const deptStats = Object.keys(DEPT_LABELS).map(dept => {
    const deptTasks = tasks.filter(t => t.department === dept);
    const done = deptTasks.filter(t => t.status === 'completed').length;
    return { dept, total: deptTasks.length, done, pct: deptTasks.length > 0 ? Math.round((done / deptTasks.length) * 100) : 0 };
  }).filter(d => d.total > 0);

  if (loading) return <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  if (tasks.length === 0) return null;

  return (
    <div className="space-y-4">
      {/* Department Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {deptStats.map(({ dept, total, done, pct }) => (
          <button
            key={dept}
            onClick={() => setSelectedDept(selectedDept === dept ? 'all' : dept)}
            className={cn(
              "rounded-xl border p-3 text-left transition-all hover:shadow-md",
              selectedDept === dept ? "ring-2 ring-primary shadow-md" : "bg-card border-border",
              DEPT_COLORS[dept]
            )}
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className={cn("w-2 h-2 rounded-full", DEPT_BG[dept])} />
              <span className="text-[10px] font-bold">{pct}%</span>
            </div>
            <p className="text-xs font-semibold">{DEPT_LABELS[dept]}</p>
            <p className="text-[10px] opacity-70">{done}/{total} tasks</p>
            <Progress value={pct} className="h-1 mt-1.5" />
          </button>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-3">
        <Select value={selectedDept} onValueChange={setSelectedDept}>
          <SelectTrigger className="w-48 h-8 text-xs">
            <SelectValue placeholder="All Departments" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {Object.entries(DEPT_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground">{filtered.filter(t => t.status === 'completed').length}/{filtered.length} tasks done</span>
      </div>

      {/* Stage checklist groups */}
      <div className="space-y-2">
        {stages.map(stage => {
          const collapsed = collapsedStages[stage.number];
          const done = stage.tasks.filter(t => t.status === 'completed').length;
          const pct = Math.round((done / stage.tasks.length) * 100);
          return (
            <div key={stage.number} className="rounded-xl border border-border overflow-hidden shadow-sm">
              <button
                onClick={() => setCollapsedStages(p => ({ ...p, [stage.number]: !p[stage.number] }))}
                className="w-full flex items-center justify-between bg-slate-800 dark:bg-slate-900 text-white px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span className="text-[10px] bg-white/10 rounded px-2 py-0.5 font-mono">S{stage.number}</span>
                  <div className="text-left">
                    <p className="text-xs font-bold">{stage.name}</p>
                    <p className="text-[10px] text-slate-400">Phase {stage.phase}: {stage.phaseName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="hidden sm:flex items-center gap-2">
                    <div className="w-16 h-1 bg-white/20 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-[10px] text-slate-300">{done}/{stage.tasks.length}</span>
                  </div>
                  {collapsed ? <ChevronRight className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </div>
              </button>
              {!collapsed && (
                <div className="divide-y divide-border bg-card">
                  {stage.tasks.sort((a, b) => (a.order_index || 0) - (b.order_index || 0)).map((task, idx) => {
                    const sc = statusConfig[task.status] || statusConfig.pending;
                    const Icon = sc.icon;
                    const isWarning = task.task_name.startsWith('⚠');
                    const isLoading = updating === task.id;
                    return (
                      <div
                        key={task.id}
                        className={cn(
                          "flex items-center gap-3 px-4 py-2.5 hover:bg-muted/40 transition-colors",
                          isWarning && "bg-rose-50/50 dark:bg-rose-950/20",
                          task.status === 'completed' && "opacity-60"
                        )}
                      >
                        <span className="text-[10px] text-muted-foreground w-6 flex-shrink-0 font-mono">{task.order_index || idx + 1}</span>
                        <button
                          onClick={() => toggleTask(task)}
                          disabled={isLoading}
                          className="flex-shrink-0"
                        >
                          {isLoading
                            ? <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                            : <Icon className={cn("w-4 h-4", sc.cls, sc.spin && "animate-spin")} />
                          }
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            "text-sm leading-snug",
                            task.status === 'completed' ? 'line-through text-muted-foreground' : isWarning ? 'text-rose-700 dark:text-rose-400 font-medium' : 'text-foreground'
                          )}>
                            {task.task_name}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Badge className={cn("text-[9px] px-1.5 py-0.5 hidden sm:inline-flex", priorityColors[task.priority])}>{task.priority}</Badge>
                          <Badge className={cn("text-[9px] px-1.5 py-0.5 hidden md:inline-flex", DEPT_COLORS[task.department])}>{DEPT_LABELS[task.department]}</Badge>
                          {task.requires_approval && <Badge className="text-[9px] px-1.5 py-0.5 bg-purple-100 text-purple-700 hidden sm:inline-flex">Approval</Badge>}
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