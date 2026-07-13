// @ts-nocheck
import { Plane, Users, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const statusColors = {
  active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  launched: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
  ongoing: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
};

export default function UpcomingDepartures({ collectives }) {
  const upcoming = collectives
    .filter(c => c.departure_date && new Date(c.departure_date) >= new Date())
    .sort((a, b) => new Date(a.departure_date) - new Date(b.departure_date))
    .slice(0, 5);

  if (!upcoming.length) {
    return (
      <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
        <h3 className="font-semibold font-jakarta text-foreground mb-4 flex items-center gap-2">
          <Plane className="w-4 h-4 text-primary" /> Upcoming Departures
        </h3>
        <p className="text-sm text-muted-foreground text-center py-6">No upcoming departures</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
      <h3 className="font-semibold font-jakarta text-foreground mb-4 flex items-center gap-2">
        <Plane className="w-4 h-4 text-primary" /> Upcoming Departures
      </h3>
      <div className="space-y-3">
        {upcoming.map((c) => (
          <div key={c.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(139,92,246,0.18)' }}>
              <Plane className="w-4 h-4" style={{ color: '#a78bfa' }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{c.name}</p>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(c.departure_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {c.booked_pax || 0}/{c.total_slots || 0} pax
                </span>
              </div>
            </div>
            <Badge className={cn("text-[10px] capitalize", statusColors[c.status] || statusColors.active)}>
              {c.status}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
}