import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import {
  CheckCircle, Circle, Loader2, AlertTriangle, X,
  ChevronDown, ChevronRight, Bot, Sparkles, RefreshCw,
  Zap, Clock, CheckSquare, ListChecks, Building2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import DepartmentWorkflowView from '@/components/workflow/DepartmentWorkflowView';
import TaskRow from '@/components/workflow/TaskRow';

// ─── CONFIG ────────────────────────────────────────────────────────────────────
const PHASES = [
  { number: 1, name: 'PRODUCT PREPARATION', color: 1, stages: [1,2,3,4,5,6] },
  { number: 2, name: 'LAUNCHING',           color: 2, stages: [7,8] },
  { number: 3, name: 'SALES',               color: 3, stages: [9,10] },
  { number: 4, name: 'DOCUMENTATION',       color: 4, stages: [11] },
  { number: 5, name: 'PRE-DEPARTURE & ONGOING TRAVEL', color: 5, stages: [12,13] },
  { number: 6, name: 'SALES INCOME',        color: 6, stages: [14] },
  { number: 7, name: 'CLIENT EVALUATION',   color: 7, stages: [15] },
];

const STAGE_NAMES = {
  1: 'Product Sourcing', 2: 'Product Evaluation & Approval', 3: 'Product Creation',
  4: 'Internal Documentation', 5: 'Upload in Collectives Tracker', 6: 'Marketing Endorsement',
  7: 'Product Launch', 8: 'Reservation & Slot Holding',
  9: 'Payment Coordination', 10: 'Booking Confirmation',
  11: 'Documentation',
  12: 'Pre-Departure Coordination', 13: 'During Travel',
  14: 'Post-Travel Evaluation',
  15: 'Post-Trip Evaluation & Client Feedback',
};

const STAGE_DEPARTMENTS = {
  1: ['product_development'], 2: ['product_development','management'], 3: ['product_development'],
  4: ['admin'], 5: ['product_development'], 6: ['marketing'],
  7: ['product_development','marketing'], 8: ['sales','admin'],
  9: ['sales','accounting'], 10: ['admin'],
  11: ['admin','visa'],
  12: ['admin','operations'], 13: ['operations','sales'],
  14: ['sales','accounting'],
  15: ['admin'],
};

const phaseColors = {
  1: { bg: 'bg-amber-500',   text: 'text-amber-700 dark:text-amber-400',   light: 'bg-amber-50 dark:bg-amber-950/20',   border: 'border-amber-200 dark:border-amber-800' },
  2: { bg: 'bg-sky-500',     text: 'text-sky-700 dark:text-sky-400',       light: 'bg-sky-50 dark:bg-sky-950/20',       border: 'border-sky-200 dark:border-sky-800' },
  3: { bg: 'bg-emerald-500', text: 'text-emerald-700 dark:text-emerald-400', light: 'bg-emerald-50 dark:bg-emerald-950/20', border: 'border-emerald-200 dark:border-emerald-800' },
  4: { bg: 'bg-purple-500',  text: 'text-purple-700 dark:text-purple-400', light: 'bg-purple-50 dark:bg-purple-950/20', border: 'border-purple-200 dark:border-purple-800' },
  5: { bg: 'bg-orange-500',  text: 'text-orange-700 dark:text-orange-400', light: 'bg-orange-50 dark:bg-orange-950/20', border: 'border-orange-200 dark:border-orange-800' },
  6: { bg: 'bg-rose-500',    text: 'text-rose-700 dark:text-rose-400',     light: 'bg-rose-50 dark:bg-rose-950/20',     border: 'border-rose-200 dark:border-rose-800' },
  7: { bg: 'bg-teal-500',    text: 'text-teal-700 dark:text-teal-400',     light: 'bg-teal-50 dark:bg-teal-950/20',     border: 'border-teal-200 dark:border-teal-800' },
};

const DEPT_CONFIG = {
  product_development: { label: 'Product Dev', short: 'PD', bg: 'bg-amber-500',   badge: 'bg-amber-100 text-amber-700',   text: 'text-amber-700' },
  marketing:           { label: 'Marketing',   short: 'MK', bg: 'bg-pink-500',    badge: 'bg-pink-100 text-pink-700',     text: 'text-pink-700' },
  sales:               { label: 'Sales',       short: 'SL', bg: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-700', text: 'text-emerald-700' },
  accounting:          { label: 'Accounting',  short: 'AC', bg: 'bg-purple-500',  badge: 'bg-purple-100 text-purple-700', text: 'text-purple-700' },
  admin:               { label: 'Admin',       short: 'AD', bg: 'bg-sky-500',     badge: 'bg-sky-100 text-sky-700',       text: 'text-sky-700' },
  operations:          { label: 'Operations',  short: 'OP', bg: 'bg-orange-500',  badge: 'bg-orange-100 text-orange-700', text: 'text-orange-700' },
  visa:                { label: 'Visa',        short: 'VS', bg: 'bg-rose-500',    badge: 'bg-rose-100 text-rose-700',     text: 'text-rose-700' },
  management:          { label: 'Management',  short: 'MG', bg: 'bg-slate-500',   badge: 'bg-slate-100 text-slate-700',   text: 'text-slate-700' },
};

const TASK_STATUS = {
  pending:     { label: 'Pending' },
  in_progress: { label: 'In Progress' },
  completed:   { label: 'Done' },
  delayed:     { label: 'Delayed' },
  cancelled:   { label: 'Cancelled' },
};

const LIFECYCLE_LABELS = {
  draft: 'Draft', open_booking: 'Open Booking', confirmed_departure: 'Confirmed',
  ongoing: 'Ongoing', completed: 'Completed', cancelled: 'Cancelled',
};
const LIFECYCLE_COLORS = {
  draft: 'bg-slate-100 text-slate-600', open_booking: 'bg-teal-100 text-teal-700',
  confirmed_departure: 'bg-sky-100 text-sky-700', ongoing: 'bg-amber-100 text-amber-700',
  completed: 'bg-emerald-100 text-emerald-700', cancelled: 'bg-rose-100 text-rose-700',
};

// ─── MAIN PAGE ─────────────────────────────────────────────────────────────────
export default function Workflow() {
  const [collectives, setCollectives] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [selectedCollective, setSelectedCollective] = useState('');
  const [view, setView] = useState('department'); // 'department' | 'phases'
  const [deptFilter, setDeptFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedPhases, setExpandedPhases] = useState({ 1: true });
  const [initializing, setInitializing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [syncResult, setSyncResult] = useState(null);


  useEffect(() => {
    base44.entities.Collective.list().then(setCollectives);
    const unsub = base44.entities.Collective.subscribe(e => {
      if (e.type === 'create') setCollectives(p => [...p, e.data]);
      else if (e.type === 'update') setCollectives(p => p.map(c => c.id === e.id ? e.data : c));
      else if (e.type === 'delete') setCollectives(p => p.filter(c => c.id !== e.id));
    });
    const params = new URLSearchParams(window.location.search);
    const cid = params.get('collective');
    if (cid) setSelectedCollective(cid);
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!selectedCollective) { setTasks([]); return; }

    let cancelled = false;
    base44.entities.ChecklistTask.filter({ collective_id: selectedCollective })
      .then(data => {
        if (cancelled) return;
        setTasks(data);
        if (data.length === 0) autoInitWorkflow(selectedCollective);
      })
      .catch(() => { if (!cancelled) setTasks([]); });

    const unsub = base44.entities.ChecklistTask.subscribe(e => {
      if (e.data?.collective_id !== selectedCollective) return;
      if (e.type === 'create') setTasks(p => [...p, e.data]);
      else if (e.type === 'update') setTasks(p => p.map(t => t.id === e.id ? e.data : t));
      else if (e.type === 'delete') setTasks(p => p.filter(t => t.id !== e.id));
    });

    return () => { cancelled = true; unsub(); };
  }, [selectedCollective]);

  const autoInitWorkflow = async (id) => {
    setInitializing(true);
    try {
      await base44.functions.invoke('autoGenerateWorkflow', { collective_id: id });
      const fresh = await base44.entities.ChecklistTask.filter({ collective_id: id });
      setTasks(fresh);
    } finally {
      setInitializing(false);
    }
  };

  const syncData = async () => {
    if (!selectedCollective) return;
    setSyncing(true); setSyncResult(null);
    try {
      const res = await base44.functions.invoke('syncExistingData', { collective_id: selectedCollective });
      const fresh = await base44.entities.ChecklistTask.filter({ collective_id: selectedCollective });
      setTasks(fresh);
      setSyncResult(res.data);
    } finally {
      setSyncing(false);
    }
  };

  const regenWorkflow = async () => {
    if (!selectedCollective) return;
    setRegenerating(true);
    try {
      await base44.functions.invoke('autoGenerateWorkflow', { collective_id: selectedCollective, force_regenerate: true });
      const fresh = await base44.entities.ChecklistTask.filter({ collective_id: selectedCollective });
      setTasks(fresh);
    } finally {
      setRegenerating(false);
    }
  };

  const handleTaskToggle = async (task, newStatus) => {
    await base44.entities.ChecklistTask.update(task.id, {
      status: newStatus,
      completed_at: newStatus === 'completed' ? new Date().toISOString() : null,
      notes: newStatus === 'completed' && task.completion_mode === 'manual'
        ? ((task.notes ? task.notes + ' | ' : '') + 'Manually confirmed')
        : task.notes,
    });
    setTasks(p => p.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
    base44.functions.invoke('updateWorkflowProgress', { collective_id: selectedCollective }).catch(() => {});
  };

  const collective = collectives.find(c => c.id === selectedCollective);
  const totalDone = tasks.filter(t => t.status === 'completed').length;
  const totalProgress = tasks.length > 0 ? Math.round((totalDone / tasks.length) * 100) : 0;
  const pendingCount = tasks.filter(t => t.status === 'pending').length;
  const inProgressCount = tasks.filter(t => t.status === 'in_progress').length;
  const blockedCount = tasks.filter(t => t.status === 'delayed').length;

  const getPhaseProgress = (phaseNum) => {
    const pt = tasks.filter(t => t.phase_number === phaseNum);
    if (!pt.length) return 0;
    return Math.round((pt.filter(t => t.status === 'completed').length / pt.length) * 100);
  };

  // Dept stats for summary
  const deptStats = Object.entries(DEPT_CONFIG).map(([dept, cfg]) => {
    const dt = tasks.filter(t => t.department === dept);
    const done = dt.filter(t => t.status === 'completed').length;
    return { dept, cfg, total: dt.length, done, pct: dt.length ? Math.round((done / dt.length) * 100) : 0 };
  }).filter(d => d.total > 0);

  // Phase checklist view filtered tasks
  const filteredTasks = tasks.filter(t => {
    const ms = statusFilter === 'all' || t.status === statusFilter;
    const md = deptFilter === 'all' || t.department === deptFilter;
    return ms && md;
  });

  return (
    <div className="space-y-5">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-jakarta text-foreground flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" /> Workflow Engine
          </h2>
          <p className="text-sm text-muted-foreground">
            Department-based operational tracker · 7 Phases · 15 Stages · 90 Checklist Items
          </p>
        </div>

        {/* Collective selector + action buttons */}
        <div className="flex flex-wrap gap-2 items-center">
          <Select value={selectedCollective || ''} onValueChange={v => { setSelectedCollective(v); setSyncResult(null); }}>
            <SelectTrigger className="w-60 h-9 text-sm"><SelectValue placeholder="Select a package..." /></SelectTrigger>
            <SelectContent>
              {collectives.map(c => (
                <SelectItem key={c.id} value={c.id}>
                  <div className="flex items-center gap-2">
                    <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", (LIFECYCLE_COLORS[c.status] || LIFECYCLE_COLORS.draft).split(' ')[0])} />
                    {c.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedCollective && (
            <>
              <Button size="sm" variant="outline" onClick={syncData} disabled={syncing}
                className="h-9 gap-1.5 text-xs text-sky-600 border-sky-200 hover:bg-sky-50">
                {syncing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                Auto-Sync
              </Button>
              <Button size="sm" variant="outline" onClick={regenWorkflow} disabled={regenerating}
                className="h-9 gap-1.5 text-xs text-rose-600 border-rose-200 hover:bg-rose-50">
                {regenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                Reset
              </Button>
            </>
          )}
        </div>
      </div>

      {/* ── No collective selected ── */}
      {!selectedCollective && (
        <div className="bg-card rounded-xl border border-border p-12 text-center shadow-sm">
          <ListChecks className="w-12 h-12 text-primary mx-auto mb-4 opacity-40" />
          <h3 className="font-bold font-jakarta text-lg text-foreground mb-2">Select a Package to View Workflow</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Choose a collective above. Each package has an auto-generated department workflow with 7 phases, 15 stages, and 90 checklist items. Tasks auto-complete when you record activity in other modules.
          </p>
          {collectives.length === 0 && (
            <p className="text-xs text-muted-foreground mt-4 italic">No collectives found. Create one in the Collectives module first.</p>
          )}
        </div>
      )}

      {/* ── Initializing ── */}
      {initializing && (
        <div className="flex items-center gap-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 rounded-xl p-4">
          <Loader2 className="w-5 h-5 animate-spin text-amber-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-700">Generating workflow...</p>
            <p className="text-xs text-amber-600">Creating 90 checklist items across 7 phases & 15 stages</p>
          </div>
        </div>
      )}

      {/* ── Syncing ── */}
      {syncing && (
        <div className="flex items-center gap-3 bg-sky-50 dark:bg-sky-950/20 border border-sky-200 rounded-xl p-4">
          <Sparkles className="w-5 h-5 animate-pulse text-sky-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-sky-700">Smart Sync in progress...</p>
            <p className="text-xs text-sky-600">Scanning bookings, payments, assets, documents, surveys</p>
          </div>
        </div>
      )}

      {/* ── Sync result ── */}
      {syncResult && !syncing && (
        <div className="flex items-start gap-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 rounded-xl p-4">
          <Bot className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-emerald-700">
              Auto-Sync Complete — {syncResult.workflow_progress?.completion_pct || 0}% overall progress
            </p>
            <p className="text-xs text-emerald-600 mt-0.5">
              {syncResult.synced_entities?.marketing_assets || 0} assets · {syncResult.synced_entities?.bookings || 0} bookings · {syncResult.synced_entities?.payments || 0} payments · {syncResult.synced_entities?.documents || 0} docs · {syncResult.synced_entities?.surveys || 0} surveys
            </p>
          </div>
          <button onClick={() => setSyncResult(null)} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Main workflow content ── */}
      {selectedCollective && !initializing && tasks.length > 0 && (
        <>
          {/* ── Collective status bar ── */}
          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <div>
                  <h3 className="font-bold font-jakarta text-foreground text-base truncate">{collective?.name}</h3>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <Badge className={cn("text-xs", LIFECYCLE_COLORS[collective?.status || 'draft'])}>
                      {LIFECYCLE_LABELS[collective?.status || 'draft']}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{collective?.destination}</span>
                    {collective?.departure_date && (
                      <span className="text-xs text-muted-foreground">· Departs {collective.departure_date}</span>
                    )}
                  </div>
                </div>
              </div>
              {/* KPI strip */}
              <div className="flex items-center gap-5 flex-shrink-0">
                <div className="text-center">
                  <p className="text-xl font-bold font-jakarta text-primary">{totalProgress}%</p>
                  <p className="text-[10px] text-muted-foreground">Overall</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold font-jakarta text-emerald-600">{totalDone}</p>
                  <p className="text-[10px] text-muted-foreground">Completed</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold font-jakarta text-sky-600">{inProgressCount}</p>
                  <p className="text-[10px] text-muted-foreground">In Progress</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold font-jakarta text-slate-500">{pendingCount}</p>
                  <p className="text-[10px] text-muted-foreground">Pending</p>
                </div>
                {blockedCount > 0 && (
                  <div className="text-center">
                    <p className="text-xl font-bold font-jakarta text-rose-600">{blockedCount}</p>
                    <p className="text-[10px] text-muted-foreground">Blocked</p>
                  </div>
                )}
              </div>
            </div>

            {/* Progress bar */}
            <Progress value={totalProgress} className="h-2 rounded-none" />

            {/* Phase pills */}
            <div className="px-5 py-3 flex gap-1.5 flex-wrap border-t border-border bg-muted/30">
              {PHASES.map(phase => {
                const c = phaseColors[phase.number];
                const pct = getPhaseProgress(phase.number);
                return (
                  <div key={phase.number} className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold border", c.light, c.border)}>
                    <div className={cn("w-1.5 h-1.5 rounded-full", c.bg)} />
                    <span className={c.text}>Ph.{phase.number}</span>
                    <span className="text-muted-foreground">{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── View Toggle ── */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex rounded-lg border border-border overflow-hidden bg-card">
              <button
                onClick={() => setView('department')}
                className={cn("flex items-center gap-1.5 px-4 py-2 text-xs font-medium transition-colors",
                  view === 'department' ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground hover:bg-muted/40")}
              >
                <Building2 className="w-3.5 h-3.5" /> By Department
              </button>
              <button
                onClick={() => setView('phases')}
                className={cn("flex items-center gap-1.5 px-4 py-2 text-xs font-medium transition-colors",
                  view === 'phases' ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground hover:bg-muted/40")}
              >
                <ListChecks className="w-3.5 h-3.5" /> Phase Checklist
              </button>
            </div>

            {view === 'phases' && (
              <div className="flex gap-2 ml-auto flex-wrap">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-36 h-8 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    {Object.entries(TASK_STATUS).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={deptFilter} onValueChange={setDeptFilter}>
                  <SelectTrigger className="w-44 h-8 text-xs"><SelectValue placeholder="Department" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {Object.entries(DEPT_CONFIG).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* ═══ DEPARTMENT VIEW ═══ */}
          {view === 'department' && (
            <DepartmentWorkflowView collectiveId={selectedCollective} collectiveName={collective?.name} />
          )}

          {/* ═══ PHASE CHECKLIST VIEW ═══ */}
          {view === 'phases' && (
            <div className="space-y-3">
              {PHASES.map(phase => {
                const c = phaseColors[phase.number];
                const phaseTasks = filteredTasks.filter(t => t.phase_number === phase.number);
                const allPhaseTasks = tasks.filter(t => t.phase_number === phase.number);
                const phaseDone = allPhaseTasks.filter(t => t.status === 'completed').length;
                const phasePct = getPhaseProgress(phase.number);
                const expanded = expandedPhases[phase.number];
                const stageNums = phase.stages;

                return (
                  <div key={phase.number} className={cn("rounded-xl border overflow-hidden shadow-sm", c.border)}>
                    {/* Phase header */}
                    <button
                      onClick={() => setExpandedPhases(p => ({ ...p, [phase.number]: !p[phase.number] }))}
                      className={cn("w-full flex items-center justify-between p-4 text-left", c.light)}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold flex-shrink-0", c.bg)}>
                          {phase.number}
                        </div>
                        <div>
                          <p className={cn("font-bold font-jakarta text-sm", c.text)}>Phase {phase.number}: {phase.name}</p>
                          <p className="text-xs text-muted-foreground">{phaseDone}/{allPhaseTasks.length} tasks · {phasePct}% complete</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="hidden sm:block w-28">
                          <Progress value={phasePct} className="h-1.5" />
                        </div>
                        <span className={cn("text-sm font-bold", c.text)}>{phasePct}%</span>
                        {expanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                      </div>
                    </button>

                    {expanded && (
                      <div className="divide-y divide-border bg-card">
                        {stageNums.map(stageNum => {
                          const stageTasks = phaseTasks.filter(t => t.stage_number === stageNum);
                          const allStageTasks = tasks.filter(t => t.stage_number === stageNum);
                          const stageDone = allStageTasks.filter(t => t.status === 'completed').length;
                          const stageComplete = allStageTasks.length > 0 && stageDone === allStageTasks.length;
                          const stageDepts = STAGE_DEPARTMENTS[stageNum] || [];

                          return (
                            <div key={stageNum}>
                              {/* Stage header */}
                              <div className={cn("flex items-center justify-between px-4 py-2.5",
                                stageComplete ? "bg-emerald-800" : "bg-slate-800 dark:bg-slate-900")}>
                                <div className="flex items-center gap-3">
                                  <span className="text-[10px] bg-white/10 text-white rounded px-2 py-0.5 font-mono font-bold">S{stageNum}</span>
                                  <div>
                                    <p className="text-xs font-bold text-white">{STAGE_NAMES[stageNum]}</p>
                                    <div className="flex gap-1 mt-0.5 flex-wrap">
                                      {stageDepts.map(d => (
                                        <span key={d} className={cn("text-[9px] px-1.5 py-0.5 rounded font-medium", DEPT_CONFIG[d]?.badge)}>
                                          {DEPT_CONFIG[d]?.short}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {stageComplete && <CheckCircle className="w-4 h-4 text-emerald-300" />}
                                  <span className="text-[10px] text-slate-300 font-mono">{stageDone}/{allStageTasks.length}</span>
                                </div>
                              </div>

                              {/* Task rows */}
                              <div className="divide-y divide-border/40">
                                {stageTasks.length === 0 ? (
                                  <p className="text-xs text-muted-foreground italic py-3 pl-14">No tasks match current filters</p>
                                ) : stageTasks
                                    .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
                                    .map((task, idx) => (
                                      <TaskRow
                                        key={task.id}
                                        task={task}
                                        idx={idx}
                                        onToggle={handleTaskToggle}
                                        showDept={deptFilter === 'all'}
                                      />
                                    ))}
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
          )}
        </>
      )}
    </div>
  );
}