import { useState, useRef } from 'react';
import { CheckCircle, Circle, Loader2, AlertTriangle, Lock, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const PRIORITY_COLORS = {
  low: 'bg-slate-100 text-slate-600',
  medium: 'bg-sky-100 text-sky-700',
  high: 'bg-amber-100 text-amber-700',
  urgent: 'bg-rose-100 text-rose-700',
};

const DEPT_CONFIG = {
  product_development: { short: 'PD', badge: 'bg-amber-100 text-amber-700' },
  marketing:           { short: 'MK', badge: 'bg-pink-100 text-pink-700' },
  sales:               { short: 'SL', badge: 'bg-emerald-100 text-emerald-700' },
  accounting:          { short: 'AC', badge: 'bg-purple-100 text-purple-700' },
  admin:               { short: 'AD', badge: 'bg-sky-100 text-sky-700' },
  operations:          { short: 'OP', badge: 'bg-orange-100 text-orange-700' },
  visa:                { short: 'VS', badge: 'bg-rose-100 text-rose-700' },
  management:          { short: 'MG', badge: 'bg-slate-100 text-slate-700' },
};

export default function TaskRow({ task, onToggle, showDept = false, idx = 0 }) {
  // Use task.status as the source of truth — only override locally while saving
  const [saving, setSaving] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  // Track the "displayed" status independently so we can do optimistic UI
  const [displayStatus, setDisplayStatus] = useState(task.status);
  // Keep a ref to the last committed status so we can rollback on error
  const committedStatus = useRef(task.status);

  const isAuto = task.completion_mode === 'auto';
  const isWarning = task.task_name?.startsWith('⚠');
  const deptCfg = DEPT_CONFIG[task.department];

  const isDone = displayStatus === 'completed';
  const isInProgress = displayStatus === 'in_progress';
  const isDelayed = displayStatus === 'delayed';

  const handleClick = async () => {
    if (isAuto && !isDone) return;
    if (saving) return;

    const prev = committedStatus.current;
    const next = isDone ? 'pending' : isInProgress ? 'completed' : 'in_progress';

    // Optimistic update
    setDisplayStatus(next);
    setSaving(true);
    setSaveFailed(false);

    try {
      await onToggle(task, next);
      committedStatus.current = next;
    } catch {
      // Rollback to last committed status
      setDisplayStatus(prev);
      setSaveFailed(true);
      setTimeout(() => setSaveFailed(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  const StatusIcon = () => {
    if (saving) return <Loader2 className="w-4 h-4 animate-spin text-amber-500" />;
    if (isDone) return <CheckCircle className="w-4 h-4 text-emerald-500" />;
    if (isDelayed) return <AlertTriangle className="w-4 h-4 text-rose-500" />;
    if (isInProgress) return <Circle className="w-4 h-4 text-sky-400" />;
    return <Circle className="w-4 h-4 text-slate-300" />;
  };

  return (
    <div className={cn(
      "flex items-center gap-3 px-4 py-2.5 transition-colors group",
      isWarning ? "bg-rose-50/50 dark:bg-rose-950/20" : "hover:bg-muted/40",
      isDone && !saving && "opacity-60"
    )}>
      {/* Index */}
      <span className="text-[10px] text-muted-foreground w-6 flex-shrink-0 font-mono text-right">
        {task.order_index || idx + 1}
      </span>

      {/* Toggle button */}
      <button
        onClick={handleClick}
        disabled={(isAuto && !isDone) || saving}
        title={isAuto ? (isDone ? 'Auto-completed by system' : 'Auto-synced — completes automatically') : 'Click to update status'}
        className={cn(
          "flex-shrink-0 transition-transform",
          !isAuto && !saving && "hover:scale-110 cursor-pointer",
          (isAuto && !isDone) && "cursor-default opacity-60",
          saving && "cursor-wait"
        )}
      >
        <StatusIcon />
      </button>

      {/* Task name */}
      <div className="flex-1 min-w-0">
        <p className={cn(
          "text-sm leading-snug",
          isDone ? 'line-through text-muted-foreground' :
          isWarning ? 'text-rose-700 dark:text-rose-400 font-medium' :
          'text-foreground'
        )}>
          {task.task_name}
        </p>
        {saving && (
          <p className="text-[10px] text-amber-600 mt-0.5">Saving...</p>
        )}
        {saveFailed && (
          <p className="text-[10px] text-rose-600 mt-0.5">Save failed — please try again</p>
        )}
      </div>

      {/* Right-side badges */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {isAuto ? (
          <span className={cn(
            "inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded font-medium border",
            isDone
              ? "text-sky-600 bg-sky-50 border-sky-200"
              : "text-slate-500 bg-slate-50 border-slate-200"
          )}>
            <Zap className="w-2.5 h-2.5" />
            {isDone ? 'Auto' : 'Auto-Sync'}
          </span>
        ) : (
          <span className={cn(
            "inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded font-medium border",
            isDone
              ? "text-emerald-600 bg-emerald-50 border-emerald-200"
              : "text-amber-600 bg-amber-50 border-amber-200"
          )}>
            {isDone ? <CheckCircle className="w-2.5 h-2.5" /> : <Circle className="w-2.5 h-2.5" />}
            Manual
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
        {showDept && deptCfg && (
          <Badge className={cn("text-[9px] px-1.5 py-0.5 hidden md:inline-flex", deptCfg.badge)}>
            {deptCfg.short}
          </Badge>
        )}
      </div>
    </div>
  );
}