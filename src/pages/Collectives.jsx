import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, Search, Filter, Globe, Calendar, Users, DollarSign, Eye, Edit, MoreHorizontal, Plane } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

const statusConfig = {
  draft: { label: 'Draft', class: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300' },
  active: { label: 'Active', class: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  launched: { label: 'Launched', class: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400' },
  ongoing: { label: 'Ongoing', class: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  completed: { label: 'Completed', class: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  cancelled: { label: 'Cancelled', class: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' },
};

const phaseColors = {
  1: 'bg-amber-500', 2: 'bg-sky-500', 3: 'bg-emerald-500',
  4: 'bg-purple-500', 5: 'bg-orange-500', 6: 'bg-rose-500', 7: 'bg-teal-500'
};

export default function Collectives() {
  const [collectives, setCollectives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingCollective, setEditingCollective] = useState(null);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const loadCollectives = () => {
    base44.entities.Collective.list('-created_date').then(data => {
      setCollectives(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { loadCollectives(); }, []);

  const openAdd = () => {
    setEditingCollective(null);
    setFormData({ status: 'draft', travel_type: 'international', currency: 'PHP', current_phase: 1, current_stage: 1 });
    setShowModal(true);
  };

  const openEdit = (c) => {
    setEditingCollective(c);
    setFormData({ ...c });
    setShowModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    if (editingCollective) {
      await base44.entities.Collective.update(editingCollective.id, formData);
    } else {
      await base44.entities.Collective.create(formData);
    }
    setSaving(false);
    setShowModal(false);
    loadCollectives();
  };

  const filtered = collectives.filter(c => {
    const matchSearch = !search || c.name?.toLowerCase().includes(search.toLowerCase()) || c.destination?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || c.status === statusFilter;
    const matchType = typeFilter === 'all' || c.travel_type === typeFilter;
    return matchSearch && matchStatus && matchType;
  });

  const formatCurrency = (val, currency = 'PHP') => {
    if (!val) return '—';
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: currency || 'PHP', minimumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-jakarta text-foreground">Travel Collectives</h2>
          <p className="text-sm text-muted-foreground">{collectives.length} collectives total</p>
        </div>
        <Button onClick={openAdd} className="gradient-gold text-white border-0 gap-2">
          <Plus className="w-4 h-4" /> Add Collective
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by name or destination..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {Object.entries(statusConfig).map(([val, cfg]) => (
              <SelectItem key={val} value={val}>{cfg.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="domestic">Domestic</SelectItem>
            <SelectItem value="international">International</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {['draft', 'active', 'ongoing', 'completed'].map(s => (
          <div key={s} className="bg-card rounded-xl border border-border p-4 text-center">
            <p className="text-2xl font-bold font-jakarta text-foreground">
              {collectives.filter(c => c.status === s).length}
            </p>
            <p className="text-xs text-muted-foreground capitalize mt-1">{s}</p>
          </div>
        ))}
      </div>

      {/* Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="bg-card rounded-xl border border-border p-5 animate-pulse h-48" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <Globe className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold text-foreground mb-2">No collectives found</h3>
          <p className="text-sm text-muted-foreground mb-4">Create your first travel collective</p>
          <Button onClick={openAdd} className="gradient-gold text-white border-0">
            <Plus className="w-4 h-4 mr-2" /> Add Collective
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(c => (
            <div key={c.id} className="bg-card rounded-xl border border-border shadow-sm card-hover overflow-hidden">
              {/* Phase indicator bar */}
              <div className="h-1.5 w-full bg-muted">
                <div
                  className={cn("h-full transition-all", phaseColors[c.current_phase] || 'bg-amber-500')}
                  style={{ width: `${((c.current_phase || 1) / 7) * 100}%` }}
                />
              </div>
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={cn("text-[10px] capitalize", statusConfig[c.status]?.class)}>
                        {statusConfig[c.status]?.label || c.status}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] capitalize">
                        {c.travel_type === 'international' ? '🌍' : '🏠'} {c.travel_type}
                      </Badge>
                      {c.guaranteed_departure && (
                        <Badge className="text-[10px] bg-emerald-100 text-emerald-700">✓ Guaranteed</Badge>
                      )}
                    </div>
                    <h3 className="font-semibold text-foreground font-jakarta truncate">{c.name}</h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Plane className="w-3 h-3" /> {c.destination}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 my-3">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar className="w-3.5 h-3.5 text-primary" />
                    <span>{c.departure_date ? new Date(c.departure_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Users className="w-3.5 h-3.5 text-secondary" />
                    <span>{c.booked_pax || 0}/{c.total_slots || 0} slots</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{formatCurrency(c.base_price, c.currency)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Globe className="w-3.5 h-3.5 text-purple-500" />
                    <span>{c.operator_name || '—'}</span>
                  </div>
                </div>

                {/* Slots progress */}
                {c.total_slots > 0 && (
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Slots filled</span>
                      <span>{Math.round(((c.booked_pax || 0) / c.total_slots) * 100)}%</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
                        style={{ width: `${Math.min(100, ((c.booked_pax || 0) / c.total_slots) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex gap-2 mt-3 pt-3 border-t border-border">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 text-xs h-7 gap-1"
                    onClick={() => navigate(`/workflow?collective=${c.id}`)}
                  >
                    <Eye className="w-3 h-3" /> Workflow
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 text-xs h-7 gap-1"
                    onClick={() => openEdit(c)}
                  >
                    <Edit className="w-3 h-3" /> Edit
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-jakarta">
              {editingCollective ? 'Edit Collective' : 'Add New Collective'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="md:col-span-2 space-y-1.5">
              <Label>Collective Name *</Label>
              <Input placeholder="e.g. Japan Cherry Blossom 2026" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div className="space-y-1.5">
              <Label>Destination *</Label>
              <Input placeholder="e.g. Tokyo, Japan" value={formData.destination || ''} onChange={e => setFormData({...formData, destination: e.target.value})} />
            </div>
            <div className="space-y-1.5">
              <Label>Travel Type</Label>
              <Select value={formData.travel_type} onValueChange={v => setFormData({...formData, travel_type: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="domestic">Domestic</SelectItem>
                  <SelectItem value="international">International</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Operator Name</Label>
              <Input placeholder="Tour operator" value={formData.operator_name || ''} onChange={e => setFormData({...formData, operator_name: e.target.value})} />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={v => setFormData({...formData, status: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(statusConfig).map(([val, cfg]) => (
                    <SelectItem key={val} value={val}>{cfg.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Departure Date</Label>
              <Input type="date" value={formData.departure_date || ''} onChange={e => setFormData({...formData, departure_date: e.target.value})} />
            </div>
            <div className="space-y-1.5">
              <Label>Return Date</Label>
              <Input type="date" value={formData.return_date || ''} onChange={e => setFormData({...formData, return_date: e.target.value})} />
            </div>
            <div className="space-y-1.5">
              <Label>Total Slots</Label>
              <Input type="number" value={formData.total_slots || ''} onChange={e => setFormData({...formData, total_slots: Number(e.target.value)})} />
            </div>
            <div className="space-y-1.5">
              <Label>Available Slots</Label>
              <Input type="number" value={formData.available_slots || ''} onChange={e => setFormData({...formData, available_slots: Number(e.target.value)})} />
            </div>
            <div className="space-y-1.5">
              <Label>Base Price</Label>
              <Input type="number" placeholder="0.00" value={formData.base_price || ''} onChange={e => setFormData({...formData, base_price: Number(e.target.value)})} />
            </div>
            <div className="space-y-1.5">
              <Label>Currency</Label>
              <Select value={formData.currency || 'PHP'} onValueChange={v => setFormData({...formData, currency: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PHP">PHP</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="JPY">JPY</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Commission Rate (%)</Label>
              <Input type="number" placeholder="0" value={formData.commission_rate || ''} onChange={e => setFormData({...formData, commission_rate: Number(e.target.value)})} />
            </div>
            <div className="space-y-1.5">
              <Label>Internal Deadline</Label>
              <Input type="date" value={formData.internal_deadline || ''} onChange={e => setFormData({...formData, internal_deadline: e.target.value})} />
            </div>
            <div className="space-y-1.5">
              <Label>Supplier Deadline</Label>
              <Input type="date" value={formData.supplier_deadline || ''} onChange={e => setFormData({...formData, supplier_deadline: e.target.value})} />
            </div>
            <div className="md:col-span-2 space-y-1.5">
              <Label>Flight Details</Label>
              <Textarea rows={2} placeholder="Airline, flight numbers, routes..." value={formData.flight_details || ''} onChange={e => setFormData({...formData, flight_details: e.target.value})} />
            </div>
            <div className="md:col-span-2 space-y-1.5">
              <Label>Hotel Details</Label>
              <Textarea rows={2} placeholder="Hotels, check-in/out..." value={formData.hotel_details || ''} onChange={e => setFormData({...formData, hotel_details: e.target.value})} />
            </div>
            <div className="md:col-span-2 space-y-1.5">
              <Label>Inclusions</Label>
              <Textarea rows={2} placeholder="What's included..." value={formData.inclusions || ''} onChange={e => setFormData({...formData, inclusions: e.target.value})} />
            </div>
            <div className="md:col-span-2 space-y-1.5">
              <Label>Exclusions</Label>
              <Textarea rows={2} placeholder="What's NOT included..." value={formData.exclusions || ''} onChange={e => setFormData({...formData, exclusions: e.target.value})} />
            </div>
            <div className="md:col-span-2 space-y-1.5">
              <Label>Remarks</Label>
              <Textarea rows={2} value={formData.remarks || ''} onChange={e => setFormData({...formData, remarks: e.target.value})} />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="gradient-gold text-white border-0">
              {saving ? 'Saving...' : editingCollective ? 'Save Changes' : 'Create Collective'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}