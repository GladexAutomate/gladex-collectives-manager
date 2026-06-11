import { useState } from 'react';
import { Plus, Trash2, Calendar, Users, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

const DATE_STATUS = {
  open:        { label: 'Open',        class: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  almost_full: { label: 'Almost Full', class: 'bg-amber-100  text-amber-700  border-amber-200'  },
  sold_out:    { label: 'Sold Out',    class: 'bg-rose-100   text-rose-700   border-rose-200'    },
  closed:      { label: 'Closed',      class: 'bg-slate-100  text-slate-600  border-slate-200'   },
};

const BLANK_DATE = () => ({
  label: '',
  departure_date: '',
  return_date: '',
  cutoff_date: '',
  total_slots: 30,
  booked_slots: 0,
  status: 'open',
  price_override: '',
  notes: '',
});

function DateCard({ d, idx, onUpdate, onRemove }) {
  const [expanded, setExpanded] = useState(false);
  const fillPct = d.total_slots > 0 ? Math.round(((d.booked_slots || 0) / d.total_slots) * 100) : 0;
  const sc = DATE_STATUS[d.status] || DATE_STATUS.open;

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-card">
      {/* Card Header */}
      <div className="flex items-center gap-3 p-3">
        <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/20 flex items-center justify-center flex-shrink-0">
          <Calendar className="w-4 h-4 text-amber-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-foreground truncate">
              {d.label || (d.departure_date ? `Departure ${idx + 1}` : `Date ${idx + 1}`)}
            </span>
            <span className={cn("text-[10px] px-1.5 py-0.5 rounded border font-medium flex-shrink-0", sc.class)}>{sc.label}</span>
            {fillPct >= 80 && <AlertTriangle className="w-3 h-3 text-amber-500 flex-shrink-0" />}
          </div>
          <div className="flex items-center gap-3 mt-0.5 text-[11px] text-muted-foreground flex-wrap">
            {d.departure_date && <span>🛫 {d.departure_date}</span>}
            {d.return_date && <span>🛬 {d.return_date}</span>}
            {d.total_slots > 0 && (
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" /> {d.booked_slots || 0}/{d.total_slots}
              </span>
            )}
          </div>
          {d.total_slots > 0 && (
            <div className="mt-1.5 h-1 bg-muted rounded-full overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all", fillPct >= 90 ? "bg-rose-500" : fillPct >= 70 ? "bg-amber-500" : "bg-emerald-500")}
                style={{ width: `${Math.min(100, fillPct)}%` }}
              />
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => setExpanded(e => !e)}
            className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            title="Edit"
          >
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => onRemove(idx)}
            className="p-1.5 rounded hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors text-muted-foreground hover:text-rose-600"
            title="Remove"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Expanded Edit Form */}
      {expanded && (
        <div className="border-t border-border p-3 bg-muted/20 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground">Label / Name</Label>
              <Input className="h-8 text-xs" placeholder="e.g. Oct 05–10" value={d.label || ''} onChange={e => onUpdate(idx, 'label', e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground">Status</Label>
              <Select value={d.status || 'open'} onValueChange={v => onUpdate(idx, 'status', v)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(DATE_STATUS).map(([k, v]) => (
                    <SelectItem key={k} value={k} className="text-xs">{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground">Departure Date *</Label>
              <Input type="date" className="h-8 text-xs" value={d.departure_date || ''} onChange={e => onUpdate(idx, 'departure_date', e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground">Return Date</Label>
              <Input type="date" className="h-8 text-xs" value={d.return_date || ''} onChange={e => onUpdate(idx, 'return_date', e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground">Booking Cut-Off Date</Label>
              <Input type="date" className="h-8 text-xs" value={d.cutoff_date || ''} onChange={e => onUpdate(idx, 'cutoff_date', e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground">Price Override (₱, optional)</Label>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">₱</span>
                <Input type="number" className="h-8 text-xs pl-6" placeholder="Leave empty to use base price" value={d.price_override || ''} onChange={e => onUpdate(idx, 'price_override', e.target.value === '' ? '' : Number(e.target.value))} />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground">Total Slots</Label>
              <Input type="number" className="h-8 text-xs" value={d.total_slots || 0} onChange={e => onUpdate(idx, 'total_slots', Number(e.target.value))} />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground">Booked Slots</Label>
              <Input type="number" className="h-8 text-xs" value={d.booked_slots || 0} onChange={e => onUpdate(idx, 'booked_slots', Number(e.target.value))} />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground">Notes</Label>
            <Textarea rows={2} className="text-xs resize-none" placeholder="Any notes for this departure..." value={d.notes || ''} onChange={e => onUpdate(idx, 'notes', e.target.value)} />
          </div>
        </div>
      )}
    </div>
  );
}

// TravelDatesManager accepts two calling conventions:
// 1. { travelDates, onChange }  — direct array passing (used by EZQuoteWorkspace)
// 2. { formData, setFormData }  — legacy object wrapping (kept for backward compat)
export default function TravelDatesManager({ travelDates: travelDatesProp, onChange, formData, setFormData }) {
  // Normalise props
  const travelDates = travelDatesProp !== undefined ? (travelDatesProp || []) : (formData?.travel_dates || []);
  const setDates = (updater) => {
    const newDates = typeof updater === 'function' ? updater(travelDates) : updater;
    if (onChange) {
      onChange(newDates);
    } else if (setFormData) {
      setFormData(prev => ({ ...prev, travel_dates: newDates }));
    }
  };

  const [showAddForm, setShowAddForm] = useState(false);
  const [newDate, setNewDate] = useState(BLANK_DATE());
  const [addError, setAddError] = useState('');

  const handleAdd = () => {
    if (!newDate.departure_date) {
      setAddError('Departure date is required.');
      return;
    }
    setAddError('');
    const label = newDate.label ||
      [
        newDate.departure_date && new Date(newDate.departure_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        newDate.return_date && new Date(newDate.return_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      ].filter(Boolean).join(' – ');
    const entry = {
      ...newDate,
      label,
      total_slots: Number(newDate.total_slots) || 0,
      booked_slots: Number(newDate.booked_slots) || 0,
      price_override: newDate.price_override === '' ? undefined : Number(newDate.price_override),
    };
    setDates(prev => [...prev, entry]);
    setNewDate(BLANK_DATE());
    setShowAddForm(false);
  };

  const handleUpdate = (idx, key, val) => {
    setDates(prev => prev.map((d, i) => i === idx ? { ...d, [key]: val } : d));
  };

  const handleRemove = (idx) => {
    setDates(prev => prev.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-semibold text-sm font-jakarta text-foreground flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" /> Travel Dates
          </h4>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Add multiple departure schedules for this package.
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          className="h-8 text-xs gap-1.5 gradient-gold text-white border-0"
          onClick={() => { setShowAddForm(true); setAddError(''); }}
        >
          <Plus className="w-3.5 h-3.5" /> Add Travel Date
        </Button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="border-2 border-amber-300 dark:border-amber-700 rounded-xl p-4 bg-amber-50/60 dark:bg-amber-950/10 space-y-3">
          <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">New Departure Schedule</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground">Departure Date *</Label>
              <Input type="date" className="h-9 text-sm" value={newDate.departure_date} onChange={e => setNewDate(p => ({ ...p, departure_date: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground">Return Date</Label>
              <Input type="date" className="h-9 text-sm" value={newDate.return_date} onChange={e => setNewDate(p => ({ ...p, return_date: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground">Booking Cut-Off Date</Label>
              <Input type="date" className="h-9 text-sm" value={newDate.cutoff_date} onChange={e => setNewDate(p => ({ ...p, cutoff_date: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground">Label (optional)</Label>
              <Input className="h-9 text-sm" placeholder="e.g. Oct 05–10" value={newDate.label} onChange={e => setNewDate(p => ({ ...p, label: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground">Total Slots</Label>
              <Input type="number" className="h-9 text-sm" value={newDate.total_slots} onChange={e => setNewDate(p => ({ ...p, total_slots: Number(e.target.value) }))} />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground">Status</Label>
              <Select value={newDate.status} onValueChange={v => setNewDate(p => ({ ...p, status: v }))}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(DATE_STATUS).map(([k, v]) => (
                    <SelectItem key={k} value={k} className="text-xs">{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label className="text-[10px] text-muted-foreground">Notes (optional)</Label>
              <Textarea rows={2} className="text-xs resize-none" placeholder="Any special notes for this departure..." value={newDate.notes} onChange={e => setNewDate(p => ({ ...p, notes: e.target.value }))} />
            </div>
          </div>
          {addError && (
            <p className="text-xs text-rose-600 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> {addError}</p>
          )}
          <div className="flex gap-2">
            <Button type="button" size="sm" className="h-8 text-xs gradient-gold text-white border-0 gap-1.5" onClick={handleAdd}>
              <Plus className="w-3.5 h-3.5" /> Add Departure
            </Button>
            <Button type="button" size="sm" variant="outline" className="h-8 text-xs" onClick={() => { setShowAddForm(false); setAddError(''); }}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {travelDates.length === 0 && !showAddForm && (
        <div className="text-center py-10 border-2 border-dashed border-border rounded-xl bg-muted/20">
          <Calendar className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm font-medium text-muted-foreground">No travel dates yet</p>
          <p className="text-xs text-muted-foreground/60 mt-1 max-w-xs mx-auto">
            Add departure schedules to allow multiple booking windows for this package.
          </p>
          <Button
            type="button"
            size="sm"
            className="mt-3 h-8 text-xs gradient-gold text-white border-0 gap-1.5"
            onClick={() => setShowAddForm(true)}
          >
            <Plus className="w-3.5 h-3.5" /> Add First Travel Date
          </Button>
        </div>
      )}

      {/* Date Cards */}
      {travelDates.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            {travelDates.length} Departure{travelDates.length !== 1 ? 's' : ''} Scheduled
          </p>
          {travelDates.map((d, idx) => (
            <DateCard
              key={idx}
              d={d}
              idx={idx}
              onUpdate={handleUpdate}
              onRemove={handleRemove}
            />
          ))}
        </div>
      )}
    </div>
  );
}