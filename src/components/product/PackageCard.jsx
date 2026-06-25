// @ts-nocheck
import { Plane, Calendar, Users, TrendingUp, Image, BookOpen, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function PackageCard({ collective: c, assetCount, bookingCount, statusConfig }) {
  const pct = c.total_slots > 0 ? Math.min(100, ((c.booked_pax || 0) / c.total_slots) * 100) : 0;
  const sellingPrice = c.selling_price || c.base_price;
  const revenue = c.total_revenue || (sellingPrice ? (c.booked_pax || 0) * sellingPrice : 0);
  const dateLabel = c.departure_date
    ? new Date(c.departure_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : (c.travel_dates?.[0]?.departure_date
        ? new Date(c.travel_dates[0].departure_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : '—');

  const cfg = statusConfig[c.status] || { label: c.status, class: 'bg-slate-100 text-slate-600' };

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden card-hover">
      {/* Workflow completion progress bar */}
      <div className="h-1.5 w-full bg-muted">
        <div
          className={cn("h-full transition-all", (c.checklist_completion || 0) === 100 ? "bg-emerald-500" : "bg-gradient-to-r from-amber-500 to-orange-500")}
          style={{ width: `${c.checklist_completion || ((c.current_phase || 1) / 7) * 100}%` }}
        />
      </div>

      {/* Image or gradient banner */}
      {c.image_url ? (
        <div className="h-28 overflow-hidden">
          <img src={c.image_url} alt={c.name} className="w-full h-full object-cover" onError={e => e.target.style.display='none'} />
        </div>
      ) : (
        <div className="h-10 gradient-gold opacity-20" />
      )}

      <div className="p-4">
        {/* Badges */}
        <div className="flex flex-wrap gap-1 mb-2">
          <Badge className={cn("text-[10px]", cfg.class)}>{cfg.label}</Badge>
          <Badge variant="outline" className="text-[10px]">
            {c.travel_type === 'international' ? '🌍' : '🏠'} {c.travel_type}
          </Badge>
          {pct >= 100 && <Badge className="text-[10px] bg-rose-100 text-rose-700">Sold Out</Badge>}
          {pct >= 80 && pct < 100 && (
            <Badge className="text-[10px] bg-amber-100 text-amber-700 gap-1">
              <AlertTriangle className="w-2.5 h-2.5" /> Almost Full
            </Badge>
          )}
        </div>

        {/* Name & Destination */}
        <h3 className="font-bold font-jakarta text-sm text-foreground truncate">{c.name}</h3>
        <p className="text-xs text-muted-foreground flex items-center gap-1 mb-3">
          <Plane className="w-3 h-3 text-primary flex-shrink-0" /> {c.destination}
        </p>

        {/* Key metrics grid */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mb-3">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="w-3.5 h-3.5 text-primary" />
            <span>{dateLabel}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Users className="w-3.5 h-3.5 text-secondary" />
            <span>{c.booked_pax || 0}/{c.total_slots || 0} pax</span>
          </div>
          <div className="flex items-center gap-1 text-xs font-semibold text-amber-600">
            <span>₱</span>
            <span>{sellingPrice ? Number(sellingPrice).toLocaleString() : '—'}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-emerald-600">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{revenue > 0 ? `₱${(revenue/1000).toFixed(0)}K` : '—'}</span>
          </div>
        </div>

        {/* Slot occupancy */}
        {c.total_slots > 0 && (
          <div className="mb-3">
            <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
              <span>Slot Occupancy</span>
              <span>{Math.round(pct)}%</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all", pct >= 90 ? "bg-rose-500" : pct >= 70 ? "bg-amber-500" : "bg-gradient-to-r from-emerald-500 to-teal-500")}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )}

        {/* Asset & booking counts */}
        <div className="flex gap-3 pt-2 border-t border-border text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <Image className="w-3 h-3 text-purple-500" /> {assetCount} asset{assetCount !== 1 ? 's' : ''}
          </span>
          <span className="flex items-center gap-1">
            <BookOpen className="w-3 h-3 text-sky-500" /> {bookingCount} booking{bookingCount !== 1 ? 's' : ''}
          </span>
          {c.checklist_completion > 0 && (
            <span className="ml-auto flex items-center gap-1 text-emerald-600">
              ✓ {c.checklist_completion}% done
            </span>
          )}
        </div>
      </div>
    </div>
  );
}