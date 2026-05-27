import { useState } from 'react';
import { CheckCircle, Circle, Loader2, AlertTriangle, X, Bot, Lock, Zap } from 'lucide-react';
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
  const [localStatus, setLocalStatus] = useState(task.status);
  const [isUpdating, setIsUpdating] = useState(false);

  const isAuto = task.completion_mode === 'auto';
  const isAutoCompleted = task.notes?.includes('Auto-completed');
  const isWarning = task.task_name.startsWith('⚠');
  const deptCfg = DEPT_CONFIG[task.department];

  // Derive display status from local optimistic state
  const isDone = localStatus === 'completed';
  const isInProgress = localStatus === 'in_progress';
  const isDelayed = localStatus === 'delayed';

  const handleClick = async () => {
    if (isAuto && !isDone) return; // auto tasks can't be manually completed unless already done (allow unchecking)
    if (isUpdating) return;

    const next = isDone ? 'pending' : isInProgress ? 'completed' : 'in_progress';

    // Optimistic update — instant UI
    setLocalStatus(next);
    setIsUpdating(true);
    await onToggle(task, next);
    setIsUpdating(false);
  };

  const StatusIcon = () => {
    if (isUpdating) return <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />;
    if (isDone) return <CheckCircle className="w-4 h-4 text-emerald-500" />;
    if (isInProgress) return <Loader2 className="w-4 h-4 text-sky-500 animate-spin" />;
    if (isDelayed) return <AlertTriangle className="w-4 h-4 text-rose-500" />;
    return <Circle className="w-4 h-4 text-slate-300" />;
  };

  return (
    <div className={cn(
      "flex items-center gap-3 px-4 py-2.5 transition-colors group",
      isWarning ? "bg-rose-50/50 dark:bg-rose-950/20" : "hover:bg-muted/40",
      isDone && "opacity-60"
    )}>
      {/* Index */}
      <span className="text-[10px] text-muted-foreground w-6 flex-shrink-0 font-mono text-right">
        {task.order_index || idx + 1}
      </span>

      {/* Toggle button — manual tasks are clickable, auto tasks show as locked unless done */}
      <button
        onClick={handleClick}
        disabled={isAuto && !isDone}
        title={isAuto ? (isDone ? 'Auto-completed by system' : 'Auto-synced — completes automatically') : 'Click to update status'}
        className={cn(
          "flex-shrink-0 transition-transform",
          !isAuto && !isDone && "hover:scale-110 cursor-pointer",
          isAuto && !isDone && "cursor-default opacity-60"
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
      </div>

      {/* Right-side badges */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {/* Hybrid mode badge — always visible */}
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