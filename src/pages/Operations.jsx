import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Truck, MapPin, Users, Phone, AlertCircle, Plus, Calendar, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function Operations() {
  const [collectives, setCollectives] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.Collective.list().then(data => {
      setCollectives(data.filter(c => ['ongoing', 'active', 'launched'].includes(c.status)));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const activeTrips = collectives.filter(c => c.status === 'ongoing');
  const upcoming = collectives.filter(c => c.status !== 'ongoing' && c.departure_date && new Date(c.departure_date) >= new Date())
    .sort((a, b) => new Date(a.departure_date) - new Date(b.departure_date));

  const operationChecks = [
    { label: 'Final Passenger Manifest', done: true },
    { label: 'Travel Documents Distributed', done: true },
    { label: 'Pre-Departure Briefing', done: false },
    { label: 'Hotel Reservations Confirmed', done: true },
    { label: 'Transfer Arrangements Confirmed', done: false },
    { label: 'Emergency Contacts Shared', done: true },
    { label: 'Tour Guide Coordination', done: false },
    { label: 'Incident Log Ready', done: true },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-jakarta text-foreground">Operations</h2>
          <p className="text-sm text-muted-foreground">Monitor active trips and pre-departure coordination</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground mb-1">Active Trips</p>
          <p className="text-2xl font-bold font-jakarta text-emerald-600">{activeTrips.length}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground mb-1">Upcoming Departures</p>
          <p className="text-2xl font-bold font-jakarta text-sky-600">{upcoming.length}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground mb-1">Total Pax (Active)</p>
          <p className="text-2xl font-bold font-jakarta text-foreground">
            {activeTrips.reduce((sum, c) => sum + (c.booked_pax || 0), 0)}
          </p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground mb-1">Pre-Dep Readiness</p>
          <p className="text-2xl font-bold font-jakarta text-amber-600">
            {Math.round((operationChecks.filter(o => o.done).length / operationChecks.length) * 100)}%
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Trips */}
        <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
          <h3 className="font-semibold font-jakarta text-foreground mb-4 flex items-center gap-2">
            <Truck className="w-4 h-4 text-primary" /> Active Trips
          </h3>
          {activeTrips.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No active trips right now</p>
          ) : (
            <div className="space-y-3">
              {activeTrips.map(c => (
                <div key={c.id} className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold text-foreground">{c.name}</p>
                    <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">● Ongoing</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {c.destination}
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3" /> {c.booked_pax || 0} pax
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> Departs: {c.departure_date ? new Date(c.departure_date).toLocaleDateString() : '—'}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> Returns: {c.return_date ? new Date(c.return_date).toLocaleDateString() : '—'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pre-Departure Checklist */}
        <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
          <h3 className="font-semibold font-jakarta text-foreground mb-4 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-primary" /> Pre-Departure Checklist
          </h3>
          <div className="space-y-2">
            {operationChecks.map((item, i) => (
              <div key={i} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                <div className={cn("w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0",
                  item.done ? "bg-emerald-500" : "bg-muted border border-border"
                )}>
                  {item.done && <CheckCircle className="w-3 h-3 text-white" />}
                </div>
                <span className={cn("text-sm flex-1", item.done ? "text-muted-foreground line-through" : "text-foreground")}>
                  {item.label}
                </span>
                {!item.done && <Badge className="text-[10px] bg-amber-100 text-amber-700">Pending</Badge>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Upcoming Departures */}
      {upcoming.length > 0 && (
        <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
          <h3 className="font-semibold font-jakarta text-foreground mb-4">Upcoming Departures</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-semibold text-muted-foreground pb-2">Collective</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground pb-2">Destination</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground pb-2">Departure</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground pb-2">Pax</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground pb-2">Operator</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground pb-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {upcoming.map(c => {
                  const daysLeft = Math.ceil((new Date(c.departure_date) - new Date()) / (1000 * 60 * 60 * 24));
                  return (
                    <tr key={c.id} className="hover:bg-muted/20">
                      <td className="py-2 text-sm font-medium text-foreground">{c.name}</td>
                      <td className="py-2 text-xs text-muted-foreground">{c.destination}</td>
                      <td className="py-2">
                        <div>
                          <p className="text-xs text-foreground">{new Date(c.departure_date).toLocaleDateString()}</p>
                          <p className={cn("text-[10px]", daysLeft <= 7 ? "text-rose-500" : daysLeft <= 30 ? "text-amber-500" : "text-muted-foreground")}>
                            {daysLeft} days
                          </p>
                        </div>
                      </td>
                      <td className="py-2 text-xs text-foreground">{c.booked_pax || 0}/{c.total_slots || 0}</td>
                      <td className="py-2 text-xs text-muted-foreground">{c.operator_name || '—'}</td>
                      <td className="py-2">
                        <Badge className={cn("text-[10px] capitalize",
                          c.status === 'active' ? "bg-emerald-100 text-emerald-700" : "bg-sky-100 text-sky-700"
                        )}>
                          {c.status}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}