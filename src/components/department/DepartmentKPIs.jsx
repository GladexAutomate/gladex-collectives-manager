import { CheckCircle, Clock, Loader2, AlertTriangle, ListChecks, Gauge } from 'lucide-react';
import { cn } from '@/lib/utils';

// Compact KPI dashboard strip for a single department
export default function DepartmentKPIs({ stats, cfg }) {
  const cards = [
    { label: 'Completion', value: `${stats.pct}%`, icon: Gauge, color: cfg.text, accent: cfg.light },
    { label: 'Total Tasks', value: stats.total, icon: ListChecks, color: 'text-foreground', accent: 'bg-muted/40' },
    { label: 'Completed', value: stats.done, icon: CheckCircle, color: 'text-emerald-600', accent: 'bg-emerald-50 dark:bg-emerald-950/20' },
    { label: 'In Progress', value: stats.inProgress, icon: Loader2, color: 'text-sky-600', accent: 'bg-sky-50 dark:bg-sky-950/20' },
    { label: 'Pending', value: stats.pending, icon: Clock, color: 'text-slate-500', accent: 'bg-slate-50 dark:bg-slate-900/40' },
    { label: 'Overdue', value: stats.overdue, icon: AlertTriangle, color: stats.overdue > 0 ? 'text-rose-600' : 'text-slate-400', accent: stats.overdue > 0 ? 'bg-rose-50 dark:bg-rose-950/20' : 'bg-muted/40' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map(card => {
        const Icon = card.icon;
        return (
          <div key={card.label} className={cn("rounded-xl border border-border p-3.5 flex flex-col gap-1", card.accent)}>
            <div className="flex items-center justify-between">
              <Icon className={cn("w-4 h-4", card.color)} />
            </div>
            <p className={cn("text-2xl font-bold font-jakarta leading-none mt-1", card.color)}>{card.value}</p>
            <p className="text-[10px] text-muted-foreground font-medium">{card.label}</p>
          </div>
        );
      })}
    </div>
  );
}