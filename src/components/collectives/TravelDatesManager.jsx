import { useState } from 'react';
import { Plus, Trash2, Calendar, Users, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

const dateStatusConfig = {
  open: { label: 'Open', class: 'bg-emerald-100 text-emerald-700' },
  almost_full: { label: 'Almost Full', class: 'bg-amber-100 text-amber-700' },
  sold_out: { label: 'Sold Out', class: 'bg-rose-100 text-rose-700' },
  closed: { label: 'Closed', class: 'bg-slate-100 text-slate-600' },
};

export default function TravelDatesManager({ formData, setFormData }) {
  const travelDates = formData.travel_dates || [];
  const [adding, setAdding] = useState(false);
  const [newDate, setNewDate] = useState({ departure_date: '', return_date: '', total_slots: 30, booked_slots: 0, status: 'open', price_override: '', label: '' });

  const addDate = () => {
    if (!newDate.departure_date) return;
    const dateLabel = newDate.label || `${new Date(newDate.departure_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}–${newDate.return_date ? new Date(newDate.return_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}`;
    const updated = [...travelDates, { ...newDate, label: dateLabel }];
    setFormData(prev => ({ ...prev, travel_dates: updated }));
    setNewDate({ departure_date: '', return_date: '', total_slots: 30, booked_slots: 0, status: 'open', price_override: '', label: '' });
    setAdding(false);
  };

  const removeDate = (idx) => {
    setFormData(prev => ({ ...prev, travel_dates: travelDates.filter((_, i) => i !== idx) }));
  };

  const updateDate = (idx, key, val) => {
    const updated = travelDates.map((d, i) => i === idx ? { ...d, [key]: val } : d);
    setFormData(prev => ({ ...prev, travel_dates: updated }));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-sm font-jakarta text-foreground flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" /> Available Travel Dates
        </h4>
        <Button type="button" size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => setAdding(!adding)}>
          <Plus className="w-3 h-3" /> Add Date
        </Button>
      </div>

      {travelDates.length === 0 && !adding && (
        <p className="text-xs text-muted-foreground italic py-2">No travel dates added. Click "Add Date" to set available departure schedules.</p>
      )}

      {/* Existing Dates */}
      <div className="space-y-2">
        {travelDates.map((d, idx) => {
          const fillPct = d.total_slots > 0 ? Math.round((d.booked_slots / d.total_slots) * 100) : 0;
          const statusCfg = dateStatusConfig[d.status] || dateStatusConfig.open;
          return (
            <div key={idx} className="border border-border rounded-lg p-3 bg-muted/20">
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium text-foreground">{d.label || `${d.departure_date} → ${d.return_date}`}</span>
                    <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-medium", statusCfg.class)}>{statusCfg.label}</span>
                    {fillPct >= 80 && <AlertTriangle className="w-3 h-3 text-amber-500" />}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <p className="text-[10px] text-muted-foreground">Departure</p>
                      <input type="date" className="text-xs border-0 bg-transparent p-0 text-foreground w-full outline-none" value={d.departure_date || ''} onChange={e => updateDate(idx, 'departure_date', e.target.value)} />
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground">Return</p>
                      <input type="date" className="text-xs border-0 bg-transparent p-0 text-foreground w-full outline-none" value={d.return_date || ''} onChange={e => updateDate(idx, 'return_date', e.target.value)} />
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground">Slots</p>
                      <div className="flex items-center gap-1 text-xs text-foreground font-medium">
                        <Users className="w-3 h-3 text-secondary" />
                        {d.booked_slots || 0}/{d.total_slots || 0}
                      </div>
                    </div>
                  </div>
                  {d.total_slots > 0 && (
                    <div className="mt-2">
                      <div className="h-1.5 bg-muted rounded-full">
                        <div className={cn("h-full rounded-full", fillPct >= 90 ? "bg-rose-500" : fillPct >= 70 ? "bg-amber-500" : "bg-emerald-500")} style={{ width: `${Math.min(100, fillPct)}%` }} />
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Select value={d.status} onValueChange={v => updateDate(idx, 'status', v)}>
                    <SelectTrigger className="w-24 h-7 text-[10px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(dateStatusConfig).map(([k, v]) => <SelectItem key={k} value={k} className="text-xs">{v.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <button onClick={() => removeDate(idx)} className="text-muted-foreground hover:text-destructive ml-1">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add new date form */}
      {adding && (
        <div className="border border-primary/40 rounded-lg p-3 bg-primary/5 space-y-3">
          <p className="text-xs font-medium text-foreground">New Travel Date</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-[10px]">Departure Date *</Label>
              <Input type="date" className="h-8 text-xs" value={newDate.departure_date} onChange={e => setNewDate({...newDate, departure_date: e.target.value})} />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px]">Return Date</Label>
              <Input type="date" className="h-8 text-xs" value={newDate.return_date} onChange={e => setNewDate({...newDate, return_date: e.target.value})} />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px]">Total Slots</Label>
              <Input type="number" className="h-8 text-xs" value={newDate.total_slots} onChange={e => setNewDate({...newDate, total_slots: Number(e.target.value)})} />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px]">Label (optional)</Label>
              <Input className="h-8 text-xs" placeholder="e.g. July 3–6" value={newDate.label} onChange={e => setNewDate({...newDate, label: e.target.value})} />
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="button" size="sm" className="h-7 text-xs gradient-gold text-white border-0" onClick={addDate}>Add</Button>
            <Button type="button" size="sm" variant="outline" className="h-7 text-xs" onClick={() => setAdding(false)}>Cancel</Button>
          </div>
        </div>
      )}
    </div>
  );
}