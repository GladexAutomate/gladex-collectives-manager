// @ts-nocheck
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function KPICard({ title, value, subtitle, icon: Icon, color, trend, trendLabel }) {
  const colorMap = {
    gold: 'from-amber-500 to-orange-500',
    sky: 'from-sky-500 to-cyan-500',
    green: 'from-emerald-500 to-teal-500',
    purple: 'from-purple-500 to-indigo-500',
    rose: 'from-rose-500 to-pink-500',
    slate: 'from-slate-500 to-slate-700',
  };

  const bgMap = {
    gold: 'bg-amber-50 dark:bg-amber-950/20',
    sky: 'bg-sky-50 dark:bg-sky-950/20',
    green: 'bg-emerald-50 dark:bg-emerald-950/20',
    purple: 'bg-purple-50 dark:bg-purple-950/20',
    rose: 'bg-rose-50 dark:bg-rose-950/20',
    slate: 'bg-slate-50 dark:bg-slate-900/20',
  };

  return (
    <div className="bg-card rounded-xl border border-border p-5 card-hover shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">{title}</p>
          <p className="text-2xl font-bold font-jakarta text-foreground">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          {trend !== undefined && (
            <div className={cn("flex items-center gap-1 mt-2 text-xs font-medium", trend >= 0 ? "text-emerald-600" : "text-rose-600")}>
              {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              <span>{trend >= 0 ? '+' : ''}{trend}% {trendLabel}</span>
            </div>
          )}
        </div>
        <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center bg-gradient-to-br flex-shrink-0", colorMap[color] || colorMap.gold)}>
          {Icon && <Icon className="w-5 h-5 text-white" />}
        </div>
      </div>
    </div>
  );
}