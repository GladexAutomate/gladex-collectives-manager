import { Bed } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

const ROOM_TYPES = [
  { value: 'twin_sharing', label: 'Twin Sharing', icon: '🛏️' },
  { value: 'triple_sharing', label: 'Triple Sharing', icon: '🛏️🛏️' },
  { value: 'quad_sharing', label: 'Quad Sharing', icon: '🛏️🛏️🛏️' },
  { value: 'solo_room', label: 'Solo Room', icon: '🛏️' },
  { value: 'family_room', label: 'Family Room', icon: '🏠' },
];

const RATE_FIELDS = [
  { key: 'rate_adult_child_bed', label: 'Adult & Child w/ Bed', desc: 'Standard adult / child sharing bed' },
  { key: 'rate_child_no_bed', label: 'Child w/o Bed (6 y/o below, max 1.1m)', desc: 'Child no bed rate' },
  { key: 'rate_child', label: 'Child Rate (6 y/o below)', desc: 'General child rate' },
  { key: 'rate_single_supplement', label: 'Single Supplement', desc: 'Additional fee for solo occupancy' },
  { key: 'rate_infant', label: 'Estimated Infant Fee', desc: 'Infants not occupying seat' },
];

export default function RoomConfigurator({ formData, setFormData }) {
  const roomConfigs = formData.room_configurations || [];

  const toggleRoom = (roomType) => {
    const exists = roomConfigs.find(r => r.room_type === roomType);
    if (exists) {
      setFormData(prev => ({ ...prev, room_configurations: roomConfigs.filter(r => r.room_type !== roomType) }));
    } else {
      setFormData(prev => ({ ...prev, room_configurations: [...roomConfigs, { room_type: roomType, price: 0, slots: 0 }] }));
    }
  };

  const updateRoom = (roomType, key, val) => {
    setFormData(prev => ({
      ...prev,
      room_configurations: roomConfigs.map(r => r.room_type === roomType ? { ...r, [key]: Number(val) } : r),
    }));
  };

  const set = (key, val) => setFormData(prev => ({ ...prev, [key]: val === '' ? undefined : Number(val) }));

  return (
    <div className="space-y-4">
      <h4 className="font-semibold text-sm font-jakarta text-foreground flex items-center gap-2">
        <Bed className="w-4 h-4 text-primary" /> Room Configuration & Special Rates
      </h4>

      {/* Room Types */}
      <div>
        <Label className="text-xs mb-2 block">Room Types (select all that apply)</Label>
        <div className="flex flex-wrap gap-2 mb-3">
          {ROOM_TYPES.map(rt => {
            const active = roomConfigs.find(r => r.room_type === rt.value);
            return (
              <button
                type="button"
                key={rt.value}
                onClick={() => toggleRoom(rt.value)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all",
                  active ? "border-primary bg-primary/10 text-primary" : "border-border bg-muted/30 text-muted-foreground hover:border-border/80"
                )}
              >
                <span>{rt.icon}</span> {rt.label}
              </button>
            );
          })}
        </div>

        {/* Room price/slot inputs */}
        {roomConfigs.length > 0 && (
          <div className="space-y-2">
            {roomConfigs.map(room => {
              const rt = ROOM_TYPES.find(r => r.value === room.room_type);
              return (
                <div key={room.room_type} className="grid grid-cols-3 gap-3 items-end p-3 rounded-lg bg-muted/30 border border-border/60">
                  <div>
                    <Label className="text-[10px] text-muted-foreground">{rt?.label}</Label>
                    <p className="text-xs font-medium text-foreground">{rt?.icon}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px]">Price (₱)</Label>
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">₱</span>
                      <Input type="number" className="h-8 text-xs pl-6" value={room.price || ''} onChange={e => updateRoom(room.room_type, 'price', e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px]">Slots</Label>
                    <Input type="number" className="h-8 text-xs" value={room.slots || ''} onChange={e => updateRoom(room.room_type, 'slots', e.target.value)} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Special Rates */}
      <div>
        <Label className="text-xs mb-2 block">Special Rate Configuration</Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {RATE_FIELDS.map(field => (
            <div key={field.key} className="space-y-1">
              <Label className="text-[10px]">{field.label}</Label>
              <div className="relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">₱</span>
                <Input type="number" className="h-8 text-xs pl-6" placeholder="0" value={formData[field.key] || ''} onChange={e => set(field.key, e.target.value)} />
              </div>
              <p className="text-[10px] text-muted-foreground">{field.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}