import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import {
  CheckSquare, ChevronRight, ChevronDown, Clock, AlertTriangle, CheckCircle, Circle,
  Loader2, X, Kanban, LayoutList, Users, Plane, Zap, RefreshCw, BarChart2, Bot, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import DepartmentWorkflowView from '@/components/workflow/DepartmentWorkflowView';

// ─── CONFIG ────────────────────────────────────────────────────────────────────
const PHASES = [
  { number: 1, name: 'PRODUCT PREPARATION', color: 'amber', stages: [
    { number: 1, name: 'Product Sourcing' }, { number: 2, name: 'Product Evaluation & Approval' },
    { number: 3, name: 'Product Creation' }, { number: 4, name: 'Internal Documentation' },
    { number: 5, name: 'Upload in Collectives Tracker' }, { number: 6, name: 'Marketing Endorsement' },
  ]},
  { number: 2, name: 'LAUNCHING', color: 'sky', stages: [
    { number: 7, name: 'Product Launch' }, { number: 8, name: 'Reservation & Slot Holding' },
  ]},
  { number: 3, name: 'SALES', color: 'emerald', stages: [
    { number: 9, name: 'Payment Coordination' }, { number: 10, name: 'Booking Confirmation' },
  ]},
  { number: 4, name: 'DOCUMENTATION', color: 'purple', stages: [{ number: 11, name: 'Documentation' }] },
  { number: 5, name: 'PRE-DEPARTURE & ONGOING TRAVEL', color: 'orange', stages: [
    { number: 12, name: 'Pre-Departure Coordination' }, { number: 13, name: 'During Travel' },
  ]},
  { number: 6, name: 'SALES INCOME', color: 'rose', stages: [{ number: 14, name: 'Post-Travel Evaluation' }] },
  { number: 7, name: 'CLIENT EVALUATION', color: 'teal', stages: [{ number: 15, name: 'Post-Trip Evaluation & Client Feedback' }] },
];

const STAGE_DEPARTMENTS = {
  1: ['product_development'], 2: ['product_development', 'management'], 3: ['product_development'],
  4: ['admin'], 5: ['product_development'], 6: ['marketing'], 7: ['product_development', 'marketing'],
  8: ['sales', 'admin'], 9: ['sales', 'accounting'], 10: ['admin'], 11: ['admin', 'visa'],
  12: ['admin', 'operations'], 13: ['operations', 'sales'], 14: ['sales'], 15: ['admin'],
};

const DEPT_LABELS = { product_development: 'Product Dev', marketing: 'Marketing', sales: 'Sales', accounting: 'Accounting', admin: 'Admin', operations: 'Operations', visa: 'Visa', management: 'Management' };
const DEPT_COLORS = { product_development: 'bg-amber-100 text-amber-700', marketing: 'bg-pink-100 text-pink-700', sales: 'bg-emerald-100 text-emerald-700', accounting: 'bg-purple-100 text-purple-700', admin: 'bg-sky-100 text-sky-700', operations: 'bg-orange-100 text-orange-700', visa: 'bg-rose-100 text-rose-700', management: 'bg-slate-100 text-slate-700' };
const priorityConfig = { low: 'bg-slate-100 text-slate-600', medium: 'bg-sky-100 text-sky-700', high: 'bg-amber-100 text-amber-700', urgent: 'bg-rose-100 text-rose-700' };
const taskStatusConfig = { pending: { icon: Circle, label: 'Pending', class: 'text-slate-400' }, in_progress: { icon: Loader2, label: 'In Progress', class: 'text-sky-500', spin: true }, completed: { icon: CheckCircle, label: 'Done', class: 'text-emerald-500' }, delayed: { icon: AlertTriangle, label: 'Delayed', class: 'text-rose-500' }, cancelled: { icon: X, label: 'Cancelled', class: 'text-slate-400' } };

const phaseColorMap = {
  1: { bg: 'bg-amber-500', text: 'text-amber-600', light: 'bg-amber-50 dark:bg-amber-950/20', border: 'border-amber-200 dark:border-amber-800' },
  2: { bg: 'bg-sky-500', text: 'text-sky-600', light: 'bg-sky-50 dark:bg-sky-950/20', border: 'border-sky-200 dark:border-sky-800' },
  3: { bg: 'bg-emerald-500', text: 'text-emerald-600', light: 'bg-emerald-50 dark:bg-emerald-950/20', border: 'border-emerald-200 dark:border-emerald-800' },
  4: { bg: 'bg-purple-500', text: 'text-purple-600', light: 'bg-purple-50 dark:bg-purple-950/20', border: 'border-purple-200 dark:border-purple-800' },
  5: { bg: 'bg-orange-500', text: 'text-orange-600', light: 'bg-orange-50 dark:bg-orange-950/20', border: 'border-orange-200 dark:border-orange-800' },
  6: { bg: 'bg-rose-500', text: 'text-rose-600', light: 'bg-rose-50 dark:bg-rose-950/20', border: 'border-rose-200 dark:border-rose-800' },
  7: { bg: 'bg-teal-500', text: 'text-teal-600', light: 'bg-teal-50 dark:bg-teal-950/20', border: 'border-teal-200 dark:border-teal-800' },
};

const LIFECYCLE_STAGES = ['draft', 'for_approval', 'product_development', 'marketing_prep', 'open_booking', 'reservation_ongoing', 'payment_verification', 'documentation', 'pre_departure', 'ongoing', 'completed'];
const LIFECYCLE_LABELS = { draft: 'Draft', for_approval: 'For Approval', product_development: 'Product Dev', marketing_prep: 'Marketing Prep', open_booking: 'Open Booking', reservation_ongoing: 'Reservation Ongoing', payment_verification: 'Payment Verification', documentation: 'Documentation', pre_departure: 'Pre-Departure', ongoing: 'Ongoing Travel', completed: 'Completed' };
const LIFECYCLE_COLORS = { draft: 'bg-slate-100 text-slate-600', for_approval: 'bg-purple-100 text-purple-700', product_development: 'bg-amber-100 text-amber-700', marketing_prep: 'bg-pink-100 text-pink-700', open_booking: 'bg-teal-100 text-teal-700', reservation_ongoing: 'bg-blue-100 text-blue-700', payment_verification: 'bg-orange-100 text-orange-700', documentation: 'bg-indigo-100 text-indigo-700', pre_departure: 'bg-violet-100 text-violet-700', ongoing: 'bg-amber-100 text-amber-700', completed: 'bg-emerald-100 text-emerald-700' };

// ─── MAIN COMPONENT ────────────────────────────────────────────────────────────
export default function Workflow() {
  const [collectives, setCollectives] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [selectedCollective, setSelectedCollective] = useState('');
  const [expandedPhases, setExpandedPhases] = useState({ 1: true });
  const [statusFilter, setStatusFilter] = useState('all');
  const [deptFilter, setDeptFilter] = useState('all');
  const [viewMode, setViewMode] = useState('kanban');
  const [checklistSubView, setChecklistSubView] = useState('full'); // 'full' | 'department'
  const [initializing, setInitializing] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [updatingTask, setUpdatingTask] = useState(null);
  const [updatingStage, setUpdatingStage] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);

  useEffect(() => {
    base44.entities.Collective.list().then(setCollectives);
    const unsub = base44.entities.Collective.subscribe(e => {
      if (e.type === 'create') setCollectives(p => [...p, e.data]);
      else if (e.type === 'update') setCollectives(p => p.map(c => c.id === e.id ? e.data : c));
      else if (e.type === 'delete') setCollectives(p => p.filter(c => c.id !== e.id));
    });
    // Check URL param
    const params = new URLSearchParams(window.location.search);
    const cid = params.get('collective');
    if (cid) { setSelectedCollective(cid); setViewMode('checklist'); }
    return () => unsub();
  }, []);

  useEffect(() => {
    if (selectedCollective) {
      base44.entities.ChecklistTask.filter({ collective_id: selectedCollective }).then(data => {
        setTasks(data);
        // Auto-initialize if no tasks exist yet
        if (data.length === 0) {
          autoInitWorkflow(selectedCollective);
        }
      });
    } else {
      base44.entities.ChecklistTask.list('-created_date', 300).then(setTasks);
    }

    const unsub = base44.entities.ChecklistTask.subscribe(e => {
      const relevant = !selectedCollective || e.data?.collective_id === selectedCollective || e.collective_id === selectedCollective;
      if (!relevant) return;
      if (e.type === 'create') setTasks(p => [...p, e.data]);
      else if (e.type === 'update') setTasks(p => p.map(t => t.id === e.id ? e.data : t));
      else if (e.type === 'delete') setTasks(p => p.filter(t => t.id !== e.id));
    });
    return () => unsub();
  }, [selectedCollective]);

  const autoInitWorkflow = async (collectiveId) => {
    setInitializing(true);
    await base44.functions.invoke('autoGenerateWorkflow', { collective_id: collectiveId });
    const fresh = await base44.entities.ChecklistTask.filter({ collective_id: collectiveId });
    setTasks(fresh);
    setInitializing(false);
  };

  const syncExistingData = async () => {
    if (!selectedCollective) return;
    setSyncing(true);
    setSyncResult(null);
    const res = await base44.functions.invoke('syncExistingData', { collective_id: selectedCollective });
    const fresh = await base44.entities.ChecklistTask.filter({ collective_id: selectedCollective });
    setTasks(fresh);
    setSyncResult(res.data);
    setSyncing(false);
  };

  const reGenerateWorkflow = async () => {
    if (!selectedCollective) return;
    setRegenerating(true);
    await base44.functions.invoke('autoGenerateWorkflow', { collective_id: selectedCollective, force_regenerate: true });
    const fresh = await base44.entities.ChecklistTask.filter({ collective_id: selectedCollective });
    setTasks(fresh);
    setRegenerating(false);
  };

  const updateTaskStatus = async (task, newStatus) => {
    setUpdatingTask(task.id);
    const now = new Date().toISOString();
    await base44.entities.ChecklistTask.update(task.id, {
      status: newStatus,
      completed_at: newStatus === 'completed' ? now : null,
    });
    const updated = tasks.map(t => t.id === task.id ? { ...t, status: newStatus, completed_at: newStatus === 'completed' ? now : null } : t);
    setTasks(updated);
    setUpdatingTask(null);

    // Trigger server-side progress recalculation
    if (selectedCollective) {
      base44.functions.invoke('updateWorkflowProgress', { collective_id: selectedCollective }).catch(() => {});
    }
  };

  const moveCollectiveStage = async (collective, newStatus) => {
    setUpdatingStage(collective.id);
    await base44.entities.Collective.update(collective.id, { status: newStatus });
    setCollectives(prev => prev.map(c => c.id === collective.id ? { ...c, status: newStatus } : c));
    setUpdatingStage(null);
  };

  const filteredTasks = tasks.filter(t => {
    const matchStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchDept = deptFilter === 'all' || t.department === deptFilter;
    return matchStatus && matchDept;
  });

  const getTasksForStage = (stageNumber) => filteredTasks.filter(t => t.stage_number === stageNumber);
  const getPhaseProgress = (phaseNumber) => {
    const pt = tasks.filter(t => t.phase_number === phaseNumber);
    if (!pt.length) return 0;
    return Math.round((pt.filter(t => t.status === 'completed').length / pt.length) * 100);
  };

  const totalCompleted = tasks.filter(t => t.status === 'completed').length;
  const totalProgress = tasks.length > 0 ? Math.round((totalCompleted / tasks.length) * 100) : 0;
  const togglePhase = (n) => setExpandedPhases(prev => ({ ...prev, [n]: !prev[n] }));

  const selectedCollectiveObj = collectives.find(c => c.id === selectedCollective);

  const kanbanCols = LIFECYCLE_STAGES.map(stage => ({
    stage, label: LIFECYCLE_LABELS[stage], color: LIFECYCLE_COLORS[stage],
    items: collectives.filter(c => (c.status || 'draft') === stage),
  })).filter(col => col.items.length > 0 || ['draft', 'product_development', 'open_booking', 'ongoing', 'completed'].includes(col.stage));

  // ─── RENDER ───────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-jakarta text-foreground flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" /> Workflow Engine
          </h2>
          <p className="text-sm text-muted-foreground flex items-center gap-1.5">
            Auto-Generated · 7 Phases · 15 Stages · 90 Checklist Items
            <span className="inline-flex items-center gap-1 text-[10px] bg-sky-100 text-sky-700 px-2 py-0.5 rounded-full font-medium">
              <Bot className="w-2.5 h-2.5" /> Smart Action Sync Active
            </span>
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" variant={viewMode === 'kanban' ? 'default' : 'outline'} className={cn("gap-1.5 h-8 text-xs", viewMode === 'kanban' && "gradient-gold text-white border-0")} onClick={() => setViewMode('kanban')}>
            <Kanban className="w-3.5 h-3.5" /> Destination Board
          </Button>
          <Button size="sm" variant={viewMode === 'checklist' ? 'default' : 'outline'} className={cn("gap-1.5 h-8 text-xs", viewMode === 'checklist' && "gradient-gold text-white border-0")} onClick={() => setViewMode('checklist')}>
            <CheckSquare className="w-3.5 h-3.5" /> Checklist View
          </Button>
        </div>
      </div>

      {/* ═══ KANBAN VIEW ═══ */}
      {viewMode === 'kanban' && (
        <div className="space-y-4">
          {/* Stats */}
          <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center"><p className="text-2xl font-bold font-jakarta text-primary">{collectives.length}</p><p className="text-xs text-muted-foreground">Total Collectives</p></div>
              <div className="text-center"><p className="text-2xl font-bold font-jakarta text-emerald-600">{collectives.filter(c => ['open_booking','reservation_ongoing'].includes(c.status)).length}</p><p className="text-xs text-muted-foreground">Booking Open</p></div>
              <div className="text-center"><p className="text-2xl font-bold font-jakarta text-amber-600">{collectives.filter(c => c.status === 'ongoing').length}</p><p className="text-xs text-muted-foreground">Ongoing Travel</p></div>
              <div className="text-center"><p className="text-2xl font-bold font-jakarta text-purple-600">{collectives.filter(c => c.status === 'completed').length}</p><p className="text-xs text-muted-foreground">Completed</p></div>
            </div>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-4">
            {kanbanCols.map(col => (
              <div key={col.stage} className="flex-shrink-0 w-72">
                <div className={cn("flex items-center justify-between px-3 py-2 rounded-t-lg mb-2", col.color)}>
                  <span className="text-xs font-semibold">{col.label}</span>
                  <span className="text-xs font-bold">{col.items.length}</span>
                </div>
                <div className="space-y-2 min-h-[80px]">
                  {col.items.map(c => {
                    const pct = c.total_slots > 0 ? Math.round(((c.booked_pax || 0) / c.total_slots) * 100) : 0;
                    const sellingPrice = c.selling_price || c.base_price;
                    const nextStageIdx = LIFECYCLE_STAGES.indexOf(col.stage);
                    const nextStage = LIFECYCLE_STAGES[nextStageIdx + 1];
                    const wfPct = c.checklist_completion || 0;
                    return (
                      <div key={c.id} className="bg-card border border-border rounded-xl p-3 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="text-xs font-semibold text-foreground font-jakarta line-clamp-2">{c.name}</p>
                            <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5"><Plane className="w-2.5 h-2.5" /> {c.destination}</p>
                          </div>
                          <button onClick={() => { setSelectedCollective(c.id); setViewMode('checklist'); }} className="text-muted-foreground hover:text-primary ml-2 flex-shrink-0">
                            <CheckSquare className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                          <span className="flex items-center gap-1"><Users className="w-2.5 h-2.5" />{c.booked_pax || 0}/{c.total_slots || 0}</span>
                          {sellingPrice > 0 && <span className="font-medium text-emerald-600">₱{Number(sellingPrice).toLocaleString()}</span>}
                        </div>
                        {/* Workflow progress mini bar */}
                        <div className="flex items-center gap-1.5 mb-2">
                          <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${wfPct}%` }} />
                          </div>
                          <span className="text-[9px] text-muted-foreground font-mono">{wfPct}%</span>
                        </div>
                        {nextStage && (
                          <button
                            disabled={updatingStage === c.id}
                            onClick={() => moveCollectiveStage(c, nextStage)}
                            className="w-full text-[10px] text-center text-primary hover:underline flex items-center justify-center gap-1 mt-1"
                          >
                            {updatingStage === c.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <ChevronRight className="w-3 h-3" />}
                            Move to {LIFECYCLE_LABELS[nextStage]}
                          </button>
                        )}
                      </div>
                    );
                  })}
                  {col.items.length === 0 && (
                    <div className="border-2 border-dashed border-border rounded-xl p-4 text-center">
                      <p className="text-[10px] text-muted-foreground">No collectives</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ CHECKLIST VIEW ═══ */}
      {viewMode === 'checklist' && (
        <div className="space-y-4">
          {/* Collective selector + controls */}
          <div className="flex flex-wrap gap-3 items-center">
            <Select value={selectedCollective || ''} onValueChange={v => setSelectedCollective(v)}>
              <SelectTrigger className="w-64"><SelectValue placeholder="Select a collective..." /></SelectTrigger>
              <SelectContent>
                {collectives.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>

            {selectedCollective && (
              <>
                <div className="flex rounded-lg border border-border overflow-hidden">
                  <button onClick={() => setChecklistSubView('full')} className={cn("px-3 py-1.5 text-xs font-medium transition-colors", checklistSubView === 'full' ? "bg-primary text-white" : "bg-card text-muted-foreground hover:text-foreground")}>
                    Full Checklist
                  </button>
                  <button onClick={() => setChecklistSubView('department')} className={cn("px-3 py-1.5 text-xs font-medium transition-colors", checklistSubView === 'department' ? "bg-primary text-white" : "bg-card text-muted-foreground hover:text-foreground")}>
                    By Department
                  </button>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={syncExistingData}
                  disabled={syncing}
                  className="gap-1.5 h-8 text-xs text-sky-600 border-sky-200 hover:bg-sky-50"
                >
                  {syncing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  Auto-Sync Now
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={reGenerateWorkflow}
                  disabled={regenerating}
                  className="gap-1.5 h-8 text-xs text-rose-600 border-rose-200 hover:bg-rose-50"
                >
                  {regenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                  Reset Workflow
                </Button>
              </>
            )}
          </div>

          {/* Auto-init loading */}
          {initializing && (
            <div className="flex items-center gap-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 rounded-xl p-4">
              <Loader2 className="w-5 h-5 animate-spin text-amber-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-amber-700">Auto-generating workflow...</p>
                <p className="text-xs text-amber-600">Creating 90 checklist items across 7 phases & 15 stages</p>
              </div>
            </div>
          )}

          {/* Syncing loader */}
          {syncing && (
            <div className="flex items-center gap-3 bg-sky-50 dark:bg-sky-950/20 border border-sky-200 rounded-xl p-4">
              <Sparkles className="w-5 h-5 animate-pulse text-sky-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-sky-700">Smart Sync in progress...</p>
                <p className="text-xs text-sky-600">Scanning all existing system data — bookings, payments, assets, documents</p>
              </div>
            </div>
          )}

          {/* Sync result banner */}
          {syncResult && !syncing && (
            <div className="flex items-start gap-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 rounded-xl p-4">
              <Bot className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-emerald-700">Auto-Sync Complete — {syncResult.workflow_progress?.completion_pct || 0}% workflow progress</p>
                <p className="text-xs text-emerald-600 mt-0.5">
                  Scanned: {syncResult.synced_entities?.marketing_assets || 0} assets · {syncResult.synced_entities?.bookings || 0} bookings · {syncResult.synced_entities?.payments || 0} payments · {syncResult.synced_entities?.documents || 0} documents · {syncResult.synced_entities?.surveys || 0} surveys
                </p>
              </div>
              <button onClick={() => setSyncResult(null)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
            </div>
          )}

          {!selectedCollective && (
            <div className="bg-card rounded-xl border border-border p-8 text-center shadow-sm">
              <Zap className="w-10 h-10 text-primary mx-auto mb-3 opacity-50" />
              <h3 className="font-semibold font-jakarta text-foreground mb-1">Select a Collective</h3>
              <p className="text-sm text-muted-foreground">Choose a collective above to view its auto-generated workflow. Workflows are created automatically when a collective is selected for the first time.</p>
            </div>
          )}

          {selectedCollective && !initializing && tasks.length > 0 && (
            <>
              {/* Overall progress summary */}
              <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold font-jakarta text-foreground">{selectedCollectiveObj?.name || 'Workflow Progress'}</h3>
                    <p className="text-xs text-muted-foreground">{totalCompleted} of {tasks.length} checklist items complete · Phase {selectedCollectiveObj?.current_phase || 1} of 7</p>
                  </div>
                  <span className="text-2xl font-bold font-jakarta text-primary">{totalProgress}%</span>
                </div>
                <Progress value={totalProgress} className="h-2 mb-3" />
                {/* Phase progress pills */}
                <div className="flex gap-1.5 flex-wrap">
                  {PHASES.map(phase => {
                    const colors = phaseColorMap[phase.number];
                    const pct = getPhaseProgress(phase.number);
                    return (
                      <button
                        key={phase.number}
                        onClick={() => togglePhase(phase.number)}
                        className={cn("flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-medium border transition-all hover:opacity-80", colors.light, colors.border)}
                      >
                        <div className={cn("w-1.5 h-1.5 rounded-full", colors.bg)} />
                        <span className={colors.text}>Ph.{phase.number}</span>
                        <span className="text-muted-foreground">{pct}%</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ─── Department View ─── */}
              {checklistSubView === 'department' && (
                <DepartmentWorkflowView collectiveId={selectedCollective} collectiveName={selectedCollectiveObj?.name} />
              )}

              {/* ─── Full Checklist View ─── */}
              {checklistSubView === 'full' && (
                <div className="space-y-3">
                  {/* Filters */}
                  <div className="flex flex-wrap gap-3">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-36 h-8 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        {Object.entries(taskStatusConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Select value={deptFilter} onValueChange={setDeptFilter}>
                      <SelectTrigger className="w-44 h-8 text-xs"><SelectValue placeholder="Department" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Departments</SelectItem>
                        {Object.entries(DEPT_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Phase accordion */}
                  {PHASES.map(phase => {
                    const colors = phaseColorMap[phase.number];
                    const progress = getPhaseProgress(phase.number);
                    const expanded = expandedPhases[phase.number];
                    const phaseTaskCount = tasks.filter(t => t.phase_number === phase.number).length;
                    const phaseCompletedCount = tasks.filter(t => t.phase_number === phase.number && t.status === 'completed').length;
                    return (
                      <div key={phase.number} className={cn("rounded-xl border overflow-hidden shadow-sm", colors.border)}>
                        <button onClick={() => togglePhase(phase.number)} className={cn("w-full flex items-center justify-between p-4 text-left", colors.light)}>
                          <div className="flex items-center gap-3">
                            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold", colors.bg)}>{phase.number}</div>
                            <div>
                              <p className={cn("font-semibold font-jakarta text-sm", colors.text)}>Phase {phase.number}: {phase.name}</p>
                              <p className="text-xs text-muted-foreground">{phaseCompletedCount}/{phaseTaskCount} tasks · {progress}% complete</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="hidden sm:block w-24"><Progress value={progress} className="h-1.5" /></div>
                            <span className={cn("text-xs font-semibold", colors.text)}>{progress}%</span>
                            {expanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                          </div>
                        </button>

                        {expanded && (
                          <div className="divide-y divide-border bg-card">
                            {phase.stages.map(stage => {
                              const stageTasks = getTasksForStage(stage.number);
                              const stageDone = stageTasks.filter(t => t.status === 'completed').length;
                              const stageComplete = stageTasks.length > 0 && stageDone === stageTasks.length;
                              return (
                                <div key={stage.number}>
                                  {/* Stage header */}
                                  <div className={cn("flex items-center justify-between px-4 py-2.5", stageComplete ? "bg-emerald-800" : "bg-slate-800 dark:bg-slate-900")}>
                                    <div className="flex items-center gap-3">
                                      <span className="text-[10px] bg-white/10 text-white rounded px-2 py-0.5 font-mono font-bold">S{stage.number}</span>
                                      <div>
                                        <p className="text-xs font-bold text-white">{stage.name.toUpperCase()}</p>
                                        <div className="flex items-center gap-1 mt-0.5">
                                          {(STAGE_DEPARTMENTS[stage.number] || []).map(d => (
                                            <span key={d} className="text-[9px] text-slate-300">{DEPT_LABELS[d]}</span>
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {stageComplete && <CheckCircle className="w-4 h-4 text-emerald-300" />}
                                      <span className="text-[10px] text-slate-300">{stageDone}/{stageTasks.length}</span>
                                    </div>
                                  </div>
                                  {/* Task rows */}
                                  <div className="divide-y divide-border/40">
                                    {stageTasks.length === 0 ? (
                                      <p className="text-xs text-muted-foreground italic py-2 pl-4">No tasks match current filters</p>
                                    ) : stageTasks
                                        .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
                                        .map((task, taskIdx) => {
                                          const StatusIcon = taskStatusConfig[task.status]?.icon || Circle;
                                          const isWarning = task.task_name.startsWith('⚠');
                                          const isLoading = updatingTask === task.id;
                                          return (
                                            <div key={task.id} className={cn(
                                              "flex items-center gap-3 px-4 py-2.5 hover:bg-muted/40 transition-colors group",
                                              isWarning && "bg-rose-50/50 dark:bg-rose-950/20",
                                              task.status === 'completed' && "opacity-60"
                                            )}>
                                              <span className="text-[10px] text-muted-foreground w-6 flex-shrink-0 font-mono">{task.order_index || taskIdx + 1}</span>
                                              <button
                                                onClick={() => {
                                                  const next = task.status === 'pending' ? 'in_progress' : task.status === 'in_progress' ? 'completed' : 'pending';
                                                  updateTaskStatus(task, next);
                                                }}
                                                disabled={isLoading}
                                                className="flex-shrink-0"
                                              >
                                                {isLoading
                                                  ? <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                                                  : <StatusIcon className={cn("w-4 h-4", taskStatusConfig[task.status]?.class, taskStatusConfig[task.status]?.spin && "animate-spin")} />
                                                }
                                              </button>
                                              <div className="flex-1 min-w-0">
                                                <p className={cn("text-sm", task.status === 'completed' ? 'line-through text-muted-foreground' : isWarning ? 'text-rose-700 dark:text-rose-400 font-medium' : 'text-foreground')}>
                                                  {task.task_name}
                                                </p>
                                              </div>
                                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                                {task.status === 'completed' && task.notes?.includes('Auto-completed') && (
                                                  <span title="Auto-completed by system" className="flex items-center gap-0.5 text-[9px] text-sky-600 bg-sky-50 border border-sky-200 px-1.5 py-0.5 rounded hidden sm:inline-flex">
                                                    <Bot className="w-2.5 h-2.5" /> Auto
                                                  </span>
                                                )}
                                                <Badge className={cn("text-[9px] px-1.5 py-0.5 hidden sm:inline-flex", priorityConfig[task.priority])}>{task.priority}</Badge>
                                                <Badge className={cn("text-[9px] px-1.5 py-0.5 hidden md:inline-flex", DEPT_COLORS[task.department])}>{DEPT_LABELS[task.department]}</Badge>
                                                {task.requires_approval && <Badge className="text-[9px] px-1.5 py-0.5 bg-purple-100 text-purple-700 hidden sm:inline-flex">Approval</Badge>}
                                              </div>
                                            </div>
                                          );
                                        })}
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
      )}
    </div>
  );
}