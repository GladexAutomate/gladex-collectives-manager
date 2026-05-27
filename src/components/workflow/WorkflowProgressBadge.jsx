import { cn } from '@/lib/utils';
import { CheckCircle, Zap } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

/**
 * A compact workflow progress badge for use in any module card.
 * Shows: phase/stage, % complete, and a color-coded progress bar.
 */
export default function WorkflowProgressBadge({ collective, className }) {
  if (!collective) return null;
  const pct = collective.checklist_completion || 0;
  const phase = collective.current_phase || 1;

  const color = pct === 100 ? 'text-emerald-600' : pct >= 60 ? 'text-sky-600' : pct >= 30 ? 'text-amber-600' : 'text-slate-500';
  const barColor = pct === 100 ? 'bg-emerald-500' : pct >= 60 ? 'bg-sky-500' : pct >= 30 ? 'bg-amber-500' : 'bg-slate-400';

  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex items-center justify-between text-[10px]">
        <span className="flex items-center gap-1 text-muted-foreground">
          <Zap className="w-2.5 h-2.5" />
          Workflow · Phase {phase}/7
        </span>
        <span className={cn("font-bold font-mono", color)}>
          {pct === 100 ? <span className="flex items-center gap-0.5"><CheckCircle className="w-3 h-3" /> Done</span> : `${pct}%`}
        </span>
      </div>
      <div className="h-1 bg-muted rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full transition-all duration-500", barColor)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}