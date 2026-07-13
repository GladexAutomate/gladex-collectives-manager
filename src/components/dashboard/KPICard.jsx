// @ts-nocheck
import { cn } from '@/lib/utils';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function KPICard({ title, value, subtitle, icon: Icon, trend, trendLabel }) {
  return (
    <div className="bg-card rounded-2xl border border-border p-5 card-hover transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">{title}</p>
          <p className="text-2xl font-black font-jakarta text-foreground leading-none">{value}</p>
          {trend !== undefined && (
            <div className={cn("flex items-center gap-1 mt-2 text-[11px] font-semibold", trend >= 0 ? "text-emerald-400" : "text-rose-400")}>
              {trend >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              <span>{trend >= 0 ? '+' : ''}{trend}% {trendLabel}</span>
            </div>
          )}
          {subtitle && !trend && <p className="text-[11px] text-muted-foreground mt-1.5">{subtitle}</p>}
        </div>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(139,92,246,0.18)' }}>
          {Icon && <Icon className="w-5 h-5" style={{ color: '#a78bfa' }} />}
        </div>
      </div>
    </div>
  );
}
