import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, Search, Globe, Calendar, Users, Eye, Edit, Plane, TrendingUp, AlertTriangle, CheckCircle2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import PricingEngine from '@/components/collectives/PricingEngine';
import TravelDatesManager from '@/components/collectives/TravelDatesManager';
import RoomConfigurator from '@/components/collectives/RoomConfigurator';
import AISmartImport from '@/components/collectives/AISmartImport';

const statusConfig = {
  draft: { label: 'Draft', class: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300' },
  for_approval: { label: 'For Approval', class: 'bg-purple-100 text-purple-700' },
  product_development: { label: 'Product Dev', class: 'bg-amber-100 text-amber-700' },
  marketing_prep: { label: 'Marketing Prep', class: 'bg-pink-100 text-pink-700' },
  active: { label: 'Active', class: 'bg-emerald-100 text-emerald-700' },
  launched: { label: 'Launched', class: 'bg-sky-100 text-sky-700' },
  open_booking: { label: 'Open Booking', class: 'bg-teal-100 text-teal-700' },
  reservation_ongoing: { label: 'Reservation Ongoing', class: 'bg-blue-100 text-blue-700' },
  payment_verification: { label: 'Payment Verification', class: 'bg-orange-100 text-orange-700' },
  documentation: { label: 'Documentation', class: 'bg-indigo-100 text-indigo-700' },
  pre_departure: { label: 'Pre-Departure', class: 'bg-violet-100 text-violet-700' },
  ongoing: { label: 'Ongoing Travel', class: 'bg-amber-100 text-amber-700' },
  completed: { label: 'Completed', class: 'bg-purple-100 text-purple-700' },
  post_evaluation: { label: 'Post-Evaluation', class: 'bg-rose-100 text-rose-700' },
  cancelled: { label: 'Cancelled', class: 'bg-rose-100 text-rose-700' },
};

const MODAL_TABS = ['ai_import', 'basic', 'pricing', 'dates', 'rooms', 'details'];
const TAB_LABELS = { ai_import: '✦ AI Import', basic: 'Basic Info', pricing: 'Pricing', dates: 'Travel Dates', rooms: 'Rooms & Rates', details: 'Details' };

export default function Collectives() {
  const [collectives, setCollectives] = useState([]);
  const [marketingAssets, setMarketingAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingCollective, setEditingCollective] = useState(null);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const navigate = useNavigate();

  const loadCollectives = () => {
    Promise.all([
      base44.entities.Collective.list('-created_date'),
      base44.entities.MarketingAsset.list(),
    ]).then(([colls, assets]) => {
      setCollectives(colls);
      setMarketingAssets(assets);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => {
    loadCollectives();
    const unsubC = base44.entities.Collective.subscribe(e => {
      if (e.type === 'create') setCollectives(p => [e.data, ...p]);
      else if (e.type === 'update') setCollectives(p => p.map(c => c.id === e.id ? e.data : c));
      else if (e.type === 'delete') setCollectives(p => p.filter(c => c.id !== e.id));
    });
    const unsubA = base44.entities.MarketingAsset.subscribe(e => {
      if (e.type === 'create') setMarketingAssets(p => [...p, e.data]);
      else if (e.type === 'update') setMarketingAssets(p => p.map(a => a.id === e.id ? e.data : a));
      else if (e.type === 'delete') setMarketingAssets(p => p.filter(a => a.id !== e.id));
    });
    return () => { unsubC(); unsubA(); };
  }, []);

  const openAdd = () => {
    setEditingCollective(null);
    setFormData({ status: 'draft', travel_type: 'international', base_price_currency: 'PHP', exchange_rate: 1, current_phase: 1, current_stage: 1, travel_dates: [], room_configurations: [] });
    setActiveTab('ai_import');
    setShowModal(true);
  };

  const openEdit = (c) => {
    setEditingCollective(c);
    setFormData({ ...c, travel_dates: c.travel_dates || [], room_configurations: c.room_configurations || [] });
    setActiveTab('basic');
    setShowModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const cleanedDates = (formData.travel_dates || []).map(d => ({
      ...d,
      price_override: d.price_override === '' || d.price_override === undefined ? undefined : Number(d.price_override),
      total_slots: Number(d.total_slots) || 0,
      booked_slots: Number(d.booked_slots) || 0,
    }));
    const payload = { ...formData, travel_dates: cleanedDates };
    if (editingCollective) {
      await base44.entities.Collective.update(editingCollective.id, payload);
    } else {
      await base44.entities.Collective.create(payload);
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

  const handleDelete = async (c) => {
    await base44.entities.Collective.delete(c.id);
    setConfirmDelete(null);
  };

  // Get the best cover image for a collective from its marketing assets
  const getCoverImage = (collectiveId) => {
    const assets = marketingAssets.filter(a => a.collective_id === collectiveId && a.file_url);
    const published = assets.find(a => a.status === 'published');
    const approved = assets.find(a => a.status === 'approved');
    return (published || approved || assets[0])?.file_url || null;
  };

  const fmtPHP = (val) => val ? `₱${Number(val).toLocaleString()}` : '—';

  const getSlotStatus = (c) => {
    const pct = c.total_slots > 0 ? ((c.booked_pax || 0) / c.total_slots) * 100 : 0;
    if (pct >= 100) return 'sold_out';
    if (pct >= 80) return 'almost_full';
    return 'open';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-jakarta text-foreground">Travel Collectives</h2>
          <p className="text-sm text-muted-foreground">{collectives.length} collectives · Enterprise Package Management</p>
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
          <SelectTrigger className="w-44"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {Object.entries(statusConfig).map(([val, cfg]) => (
              <SelectItem key={val} value={val}>{cfg.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="domestic">Domestic</SelectItem>
            <SelectItem value="international">International</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Draft', status: 'draft', color: 'text-slate-600' },
          { label: 'Active/Open', status: ['active', 'open_booking', 'launched'], color: 'text-emerald-600' },
          { label: 'Ongoing', status: 'ongoing', color: 'text-amber-600' },
          { label: 'Completed', status: 'completed', color: 'text-purple-600' },
          { label: 'Cancelled', status: 'cancelled', color: 'text-rose-600' },
        ].map(s => {
          const count = Array.isArray(s.status)
            ? collectives.filter(c => s.status.includes(c.status)).length
            : collectives.filter(c => c.status === s.status).length;
          return (
            <div key={s.label} className="bg-card rounded-xl border border-border p-4 text-center">
              <p className={cn("text-2xl font-bold font-jakarta", s.color)}>{count}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1,2,3,4,5,6].map(i => <div key={i} className="bg-card rounded-xl border border-border p-5 animate-pulse h-56" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <Globe className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold text-foreground mb-2">No collectives found</h3>
          <Button onClick={openAdd} className="gradient-gold text-white border-0"><Plus className="w-4 h-4 mr-2" /> Add Collective</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(c => {
            const slotStatus = getSlotStatus(c);
            const sellingPrice = c.selling_price || c.base_price;
            const pct = c.total_slots > 0 ? Math.min(100, ((c.booked_pax || 0) / c.total_slots) * 100) : 0;
            const dateCount = (c.travel_dates || []).length;
            return (
              <div key={c.id} className="bg-card rounded-xl border border-border shadow-sm card-hover overflow-hidden group">
                {/* Cover image */}
                {getCoverImage(c.id) ? (
                  <div className="h-36 overflow-hidden relative">
                    <img src={getCoverImage(c.id)} alt={c.name} className="w-full h-full object-cover" onError={e => e.target.style.display='none'} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  </div>
                ) : (
                  <div className="h-1.5 w-full bg-muted">
                    <div className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all" style={{ width: `${((c.current_phase || 1) / 7) * 100}%` }} />
                  </div>
                )}
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                        <Badge className={cn("text-[10px] capitalize", statusConfig[c.status]?.class)}>
                          {statusConfig[c.status]?.label || c.status}
                        </Badge>
                        <Badge variant="outline" className="text-[10px]">
                          {c.travel_type === 'international' ? '🌍' : '🏠'} {c.travel_type}
                        </Badge>
                        {c.guaranteed_departure && <Badge className="text-[10px] bg-emerald-100 text-emerald-700">✓ Guaranteed</Badge>}
                        {slotStatus === 'almost_full' && <Badge className="text-[10px] bg-amber-100 text-amber-700 gap-1"><AlertTriangle className="w-2.5 h-2.5" />Almost Full</Badge>}
                        {slotStatus === 'sold_out' && <Badge className="text-[10px] bg-rose-100 text-rose-700">Sold Out</Badge>}
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
                      <span>{dateCount > 0 ? `${dateCount} date${dateCount > 1 ? 's' : ''}` : c.departure_date ? new Date(c.departure_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Users className="w-3.5 h-3.5 text-secondary" />
                      <span>{c.booked_pax || 0}/{c.total_slots || 0} pax</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                      <span>{fmtPHP(sellingPrice)}</span>
                    </div>
                    {c.commission_amount > 0 && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <CheckCircle2 className="w-3.5 h-3.5 text-purple-500" />
                        <span>₱{Number(c.commission_amount).toLocaleString()} comm.</span>
                      </div>
                    )}
                  </div>

                  {c.total_slots > 0 && (
                    <div className="mb-3">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>Slot occupancy</span>
                        <span className={cn(pct >= 90 ? "text-rose-500 font-semibold" : pct >= 70 ? "text-amber-600 font-semibold" : "")}>{Math.round(pct)}%</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full">
                        <div className={cn("h-full rounded-full transition-all", pct >= 90 ? "bg-rose-500" : pct >= 70 ? "bg-amber-500" : "bg-gradient-to-r from-emerald-500 to-teal-500")} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-3 border-t border-border">
                    <Button size="sm" variant="outline" className="flex-1 text-xs h-7 gap-1" onClick={() => navigate(`/workflow?collective=${c.id}`)}>
                      <Eye className="w-3 h-3" /> Workflow
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1 text-xs h-7 gap-1" onClick={() => openEdit(c)}>
                      <Edit className="w-3 h-3" /> Edit
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20" onClick={() => setConfirmDelete(c)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-jakarta">
              {editingCollective ? 'Edit Collective' : 'Add New Collective'}
            </DialogTitle>
          </DialogHeader>

          {/* Tabs */}
          <div className="flex gap-1 border-b border-border pb-2 overflow-x-auto">
            {MODAL_TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors",
                  tab === 'ai_import'
                    ? activeTab === tab
                      ? "gradient-gold text-white"
                      : "text-amber-600 border border-amber-200 hover:bg-amber-50 dark:hover:bg-amber-950/20"
                    : activeTab === tab
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted"
                )}
              >
                {TAB_LABELS[tab]}
              </button>
            ))}
          </div>

          {/* Tab: AI Import */}
          {activeTab === 'ai_import' && (
            <div className="mt-2">
              <AISmartImport
                onParsed={(parsed) => {
                  setFormData(prev => ({ ...prev, ...parsed }));
                  setActiveTab('basic');
                }}
                onClose={() => setActiveTab('basic')}
              />
            </div>
          )}

          {/* Tab: Basic Info */}
          {activeTab === 'basic' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
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
                <Label>Lifecycle Status</Label>
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
                <Label>Total Slots</Label>
                <Input type="number" value={formData.total_slots || ''} onChange={e => setFormData({...formData, total_slots: Number(e.target.value)})} />
              </div>
              <div className="space-y-1.5">
                <Label>Booked Pax</Label>
                <Input type="number" value={formData.booked_pax || ''} onChange={e => setFormData({...formData, booked_pax: Number(e.target.value)})} />
              </div>
              <div className="space-y-1.5 flex items-center gap-2 pt-6">
                <input type="checkbox" id="gd" checked={!!formData.guaranteed_departure} onChange={e => setFormData({...formData, guaranteed_departure: e.target.checked})} className="w-4 h-4" />
                <Label htmlFor="gd" className="cursor-pointer">Guaranteed Departure</Label>
              </div>
              <div className="md:col-span-2 space-y-1.5">
                <Label>Flight Details</Label>
                <Textarea rows={2} placeholder="Airline, flight numbers, routes..." value={formData.flight_details || ''} onChange={e => setFormData({...formData, flight_details: e.target.value})} />
              </div>
              <div className="md:col-span-2 space-y-1.5">
                <Label>Hotel Details</Label>
                <Textarea rows={2} placeholder="Hotels, check-in/out..." value={formData.hotel_details || ''} onChange={e => setFormData({...formData, hotel_details: e.target.value})} />
              </div>
            </div>
          )}

          {/* Tab: Pricing */}
          {activeTab === 'pricing' && (
            <div className="mt-2">
              <PricingEngine formData={formData} setFormData={setFormData} />
            </div>
          )}

          {/* Tab: Travel Dates */}
          {activeTab === 'dates' && (
            <div className="mt-2">
              <TravelDatesManager formData={formData} setFormData={setFormData} />
            </div>
          )}

          {/* Tab: Rooms & Rates */}
          {activeTab === 'rooms' && (
            <div className="mt-2">
              <RoomConfigurator formData={formData} setFormData={setFormData} />
            </div>
          )}

          {/* Tab: Details */}
          {activeTab === 'details' && (
            <div className="space-y-4 mt-2">
              <div className="space-y-1.5">
                <Label>Inclusions</Label>
                <Textarea rows={3} placeholder="What's included..." value={formData.inclusions || ''} onChange={e => setFormData({...formData, inclusions: e.target.value})} />
              </div>
              <div className="space-y-1.5">
                <Label>Exclusions</Label>
                <Textarea rows={3} placeholder="What's NOT included..." value={formData.exclusions || ''} onChange={e => setFormData({...formData, exclusions: e.target.value})} />
              </div>
              <div className="space-y-1.5">
                <Label>Terms & Conditions</Label>
                <Textarea rows={3} value={formData.terms_conditions || ''} onChange={e => setFormData({...formData, terms_conditions: e.target.value})} />
              </div>
              <div className="space-y-1.5">
                <Label>Cancellation Policy</Label>
                <Textarea rows={2} value={formData.cancellation_policy || ''} onChange={e => setFormData({...formData, cancellation_policy: e.target.value})} />
              </div>
              <div className="space-y-1.5">
                <Label>Optional Tours</Label>
                <Textarea rows={2} value={formData.optional_tours || ''} onChange={e => setFormData({...formData, optional_tours: e.target.value})} />
              </div>
              <div className="space-y-1.5">
                <Label>Remarks</Label>
                <Textarea rows={2} value={formData.remarks || ''} onChange={e => setFormData({...formData, remarks: e.target.value})} />
              </div>

            </div>
          )}

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="gradient-gold text-white border-0">
              {saving ? 'Saving...' : editingCollective ? 'Save Changes' : 'Create Collective'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirm Delete */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-xl shadow-2xl p-6 max-w-sm w-full space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-950/30 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-foreground">Delete Collective?</h3>
                <p className="text-xs text-muted-foreground mt-0.5">This will permanently delete <strong>{confirmDelete.name}</strong>.</p>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setConfirmDelete(null)}>Cancel</Button>
              <Button size="sm" className="bg-rose-600 hover:bg-rose-700 text-white" onClick={() => handleDelete(confirmDelete)}>Delete</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}