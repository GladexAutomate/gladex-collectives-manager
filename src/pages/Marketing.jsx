import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, Image, Film, Mail, Globe, Facebook, Instagram, Search, Edit, Upload, Download, Paperclip, Loader2, Plane, Calendar, Users, TrendingUp, AlertTriangle, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

const statusColors = {
  draft: 'bg-slate-100 text-slate-600',
  pending_approval: 'bg-amber-100 text-amber-700',
  approved: 'bg-sky-100 text-sky-700',
  published: 'bg-emerald-100 text-emerald-700',
  archived: 'bg-purple-100 text-purple-700',
};

const typeConfig = {
  poster: { icon: Image, color: 'text-amber-600', bg: 'bg-amber-50' },
  reel: { icon: Film, color: 'text-rose-600', bg: 'bg-rose-50' },
  caption: { icon: Globe, color: 'text-sky-600', bg: 'bg-sky-50' },
  e_blast: { icon: Mail, color: 'text-purple-600', bg: 'bg-purple-50' },
  video: { icon: Film, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  photo: { icon: Image, color: 'text-blue-600', bg: 'bg-blue-50' },
  brochure: { icon: Globe, color: 'text-orange-600', bg: 'bg-orange-50' },
};

const platformConfig = {
  facebook: { label: 'Facebook', icon: Facebook, color: 'text-blue-600' },
  instagram: { label: 'Instagram', icon: Instagram, color: 'text-pink-600' },
  website: { label: 'Website', icon: Globe, color: 'text-emerald-600' },
  email: { label: 'Email', icon: Mail, color: 'text-purple-600' },
};

const collectiveStatusConfig = {
  draft: { label: 'Draft', class: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300' },
  for_approval: { label: 'For Approval', class: 'bg-purple-100 text-purple-700' },
  product_development: { label: 'Product Dev', class: 'bg-amber-100 text-amber-700' },
  marketing_prep: { label: 'Marketing Prep', class: 'bg-pink-100 text-pink-700' },
  active: { label: 'Active', class: 'bg-emerald-100 text-emerald-700' },
  launched: { label: 'Launched', class: 'bg-sky-100 text-sky-700' },
  open_booking: { label: 'Open Booking', class: 'bg-teal-100 text-teal-700' },
  reservation_ongoing: { label: 'Reservation Ongoing', class: 'bg-blue-100 text-blue-700' },
  ongoing: { label: 'Ongoing Travel', class: 'bg-amber-100 text-amber-700' },
  completed: { label: 'Completed', class: 'bg-purple-100 text-purple-700' },
  cancelled: { label: 'Cancelled', class: 'bg-rose-100 text-rose-700' },
};

export default function Marketing() {
  const [assets, setAssets] = useState([]);
  const [collectives, setCollectives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('assets'); // 'assets' | 'packages'
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [pkgSearch, setPkgSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingProof, setUploadingProof] = useState(false);
  const imageInputRef = useRef(null);
  const proofInputRef = useRef(null);

  useEffect(() => {
    Promise.all([
      base44.entities.MarketingAsset.list('-created_date'),
      base44.entities.Collective.list('-created_date'),
    ]).then(([a, c]) => {
      setAssets(a);
      setCollectives(c);
      setLoading(false);
    }).catch(() => setLoading(false));

    // Real-time sync
    const unsubAssets = base44.entities.MarketingAsset.subscribe((event) => {
      if (event.type === 'create') setAssets(prev => [event.data, ...prev]);
      else if (event.type === 'update') setAssets(prev => prev.map(a => a.id === event.id ? event.data : a));
      else if (event.type === 'delete') setAssets(prev => prev.filter(a => a.id !== event.id));
    });
    const unsubCollectives = base44.entities.Collective.subscribe((event) => {
      if (event.type === 'create') setCollectives(prev => [event.data, ...prev]);
      else if (event.type === 'update') setCollectives(prev => prev.map(c => c.id === event.id ? event.data : c));
      else if (event.type === 'delete') setCollectives(prev => prev.filter(c => c.id !== event.id));
    });
    return () => { unsubAssets(); unsubCollectives(); };
  }, []);

  const loadData = () => {
    Promise.all([
      base44.entities.MarketingAsset.list('-created_date'),
      base44.entities.Collective.list('-created_date'),
    ]).then(([a, c]) => { setAssets(a); setCollectives(c); });
  };

  const openAdd = () => {
    setEditingAsset(null);
    setFormData({ status: 'draft', asset_type: 'poster', platform: [] });
    setShowModal(true);
  };

  const openEdit = (a) => {
    setEditingAsset(a);
    setFormData({ ...a });
    setShowModal(true);
  };

  const handleUploadImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingImage(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setFormData(prev => ({ ...prev, file_url }));
    setUploadingImage(false);
  };

  const handleUploadProof = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingProof(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setFormData(prev => ({ ...prev, proof_url: file_url }));
    setUploadingProof(false);
  };

  const handleSave = async () => {
    setSaving(true);
    if (editingAsset) {
      await base44.entities.MarketingAsset.update(editingAsset.id, formData);
    } else {
      await base44.entities.MarketingAsset.create(formData);
    }
    setSaving(false);
    setShowModal(false);
    loadData();
  };

  const filtered = assets.filter(a => {
    const matchSearch = !search || a.title?.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'all' || a.asset_type === typeFilter;
    const matchStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchSearch && matchType && matchStatus;
  });

  const getCollectiveName = (id) => collectives.find(c => c.id === id)?.name || '';

  const activeCollectives = collectives.filter(c => ['active','launched','open_booking','reservation_ongoing'].includes(c.status));
  const upcomingDepartures = collectives.filter(c => {
    const dep = c.departure_date || (c.travel_dates?.[0]?.departure_date);
    return dep && new Date(dep) > new Date();
  });
  const fullyBooked = collectives.filter(c => c.total_slots > 0 && (c.booked_pax || 0) >= c.total_slots);
  const fmtPHP = (val) => val ? `₱${Number(val).toLocaleString()}` : '—';

  const filteredPackages = collectives.filter(c => {
    return !pkgSearch || c.name?.toLowerCase().includes(pkgSearch.toLowerCase()) || c.destination?.toLowerCase().includes(pkgSearch.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-jakarta text-foreground">Marketing</h2>
          <p className="text-sm text-muted-foreground">Manage marketing assets, campaigns, and social media</p>
        </div>
        {activeTab === 'assets' && (
          <Button onClick={openAdd} className="gradient-gold text-white border-0 gap-2">
            <Plus className="w-4 h-4" /> Add Asset
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted/50 rounded-xl p-1 w-fit">
        {[
          { key: 'assets', label: '🎨 Marketing Assets' },
          { key: 'packages', label: '📦 All Packages' },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={cn("px-4 py-2 rounded-lg text-xs font-medium transition-all", activeTab === tab.key ? "bg-card shadow text-foreground" : "text-muted-foreground hover:text-foreground")}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Stats — changes based on tab */}
      {activeTab === 'assets' ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Assets', value: assets.length, color: 'text-foreground' },
            { label: 'Published', value: assets.filter(a => a.status === 'published').length, color: 'text-emerald-600' },
            { label: 'Pending Approval', value: assets.filter(a => a.status === 'pending_approval').length, color: 'text-amber-600' },
            { label: 'Draft', value: assets.filter(a => a.status === 'draft').length, color: 'text-slate-500' },
          ].map((s, i) => (
            <div key={i} className="bg-card rounded-xl border border-border p-4 text-center">
              <p className={cn("text-2xl font-bold font-jakarta", s.color)}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: 'Total Packages', value: collectives.length, color: 'text-foreground' },
            { label: 'Active Collectives', value: activeCollectives.length, color: 'text-emerald-600' },
            { label: 'Upcoming Departures', value: upcomingDepartures.length, color: 'text-sky-600' },
            { label: 'Fully Booked', value: fullyBooked.length, color: 'text-rose-600' },
            { label: 'Draft Packages', value: collectives.filter(c => c.status === 'draft').length, color: 'text-slate-500' },
            { label: 'With Assets', value: collectives.filter(c => assets.some(a => a.collective_id === c.id)).length, color: 'text-purple-600' },
          ].map((s, i) => (
            <div key={i} className="bg-card rounded-xl border border-border p-4 text-center">
              <p className={cn("text-2xl font-bold font-jakarta", s.color)}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Packages Tab */}
      {activeTab === 'packages' && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search packages by name or destination..." className="pl-9" value={pkgSearch} onChange={e => setPkgSearch(e.target.value)} />
          </div>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1,2,3,4,5,6].map(i => <div key={i} className="h-48 bg-card rounded-xl border animate-pulse" />)}
            </div>
          ) : filteredPackages.length === 0 ? (
            <div className="text-center py-16">
              <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">No packages found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredPackages.map(c => {
                const pct = c.total_slots > 0 ? Math.min(100, ((c.booked_pax || 0) / c.total_slots) * 100) : 0;
                const sellingPrice = c.selling_price || c.base_price;
                const dateCount = (c.travel_dates || []).length;
                const pkgAssets = assets.filter(a => a.collective_id === c.id);
                return (
                  <div key={c.id} className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                    <div className="h-1.5 w-full bg-muted">
                      <div className="h-full bg-gradient-to-r from-amber-500 to-orange-500" style={{ width: `${((c.current_phase || 1) / 7) * 100}%` }} />
                    </div>
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap mb-1">
                            <Badge className={cn("text-[10px]", collectiveStatusConfig[c.status]?.class)}>
                              {collectiveStatusConfig[c.status]?.label || c.status}
                            </Badge>
                            <Badge variant="outline" className="text-[10px]">{c.travel_type === 'international' ? '🌍' : '🏠'} {c.travel_type}</Badge>
                            {pct >= 100 && <Badge className="text-[10px] bg-rose-100 text-rose-700">Sold Out</Badge>}
                            {pct >= 80 && pct < 100 && <Badge className="text-[10px] bg-amber-100 text-amber-700 gap-1"><AlertTriangle className="w-2.5 h-2.5" />Almost Full</Badge>}
                          </div>
                          <h3 className="font-semibold text-foreground font-jakarta text-sm truncate">{c.name}</h3>
                          <p className="text-xs text-muted-foreground flex items-center gap-1"><Plane className="w-3 h-3" />{c.destination}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5 my-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3 text-primary" />{dateCount > 0 ? `${dateCount} date${dateCount > 1 ? 's' : ''}` : c.departure_date ? new Date(c.departure_date).toLocaleDateString('en-US', {month:'short',day:'numeric'}) : '—'}</span>
                        <span className="flex items-center gap-1"><Users className="w-3 h-3 text-secondary" />{c.booked_pax || 0}/{c.total_slots || 0} pax</span>
                        <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3 text-emerald-500" />{fmtPHP(sellingPrice)}</span>
                        <span className="flex items-center gap-1 text-purple-600"><Image className="w-3 h-3" />{pkgAssets.length} asset{pkgAssets.length !== 1 ? 's' : ''}</span>
                      </div>
                      {c.total_slots > 0 && (
                        <div>
                          <div className="flex justify-between text-xs text-muted-foreground mb-1"><span>Slot occupancy</span><span>{Math.round(pct)}%</span></div>
                          <div className="h-1.5 bg-muted rounded-full">
                            <div className={cn("h-full rounded-full transition-all", pct >= 90 ? "bg-rose-500" : pct >= 70 ? "bg-amber-500" : "bg-gradient-to-r from-emerald-500 to-teal-500")} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      )}
                      {pkgAssets.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-border">
                          <p className="text-[10px] text-muted-foreground mb-1.5">Marketing Assets:</p>
                          <div className="flex flex-wrap gap-1">
                            {pkgAssets.slice(0,4).map(a => (
                              <Badge key={a.id} className={cn("text-[10px]", statusColors[a.status])}>{a.asset_type?.replace('_',' ')}</Badge>
                            ))}
                            {pkgAssets.length > 4 && <Badge variant="outline" className="text-[10px]">+{pkgAssets.length - 4} more</Badge>}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Assets Tab */}
      {activeTab === 'assets' && <>
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search assets..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {Object.keys(typeConfig).map(k => <SelectItem key={k} value={k} className="capitalize">{k}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {Object.keys(statusColors).map(k => <SelectItem key={k} value={k} className="capitalize">{k.replace('_', ' ')}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Asset Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-48 bg-card rounded-xl border animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Image className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold text-foreground mb-2">No assets found</h3>
          <Button onClick={openAdd} className="gradient-gold text-white border-0">
            <Plus className="w-4 h-4 mr-2" /> Create First Asset
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(asset => {
            const TypeConfig = typeConfig[asset.asset_type] || typeConfig.poster;
            const TypeIcon = TypeConfig.icon;
            return (
              <div key={asset.id} className="bg-card rounded-xl border border-border shadow-sm card-hover overflow-hidden">
                {/* Preview: image or icon */}
                {asset.file_url ? (
                  <div className="h-36 overflow-hidden bg-muted relative group/thumb">
                    <img src={asset.file_url} alt={asset.title} className="w-full h-full object-cover" onError={e => e.target.style.display = 'none'} />
                    <a href={asset.file_url} target="_blank" rel="noopener noreferrer" className="absolute inset-0 bg-black/50 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center transition-opacity">
                      <Download className="w-6 h-6 text-white" />
                    </a>
                  </div>
                ) : (
                  <div className={cn("h-36 flex items-center justify-center", TypeConfig.bg)}>
                    <TypeIcon className={cn("w-16 h-16 opacity-30", TypeConfig.color)} />
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground text-sm truncate">{asset.title}</p>
                      {asset.collective_id && (
                        <p className="text-xs text-muted-foreground truncate">{getCollectiveName(asset.collective_id)}</p>
                      )}
                    </div>
                    <Badge className={cn("text-[10px] ml-2 flex-shrink-0 capitalize", statusColors[asset.status])}>
                      {asset.status?.replace('_', ' ')}
                    </Badge>
                  </div>

                  {/* Platforms */}
                  {asset.platform?.length > 0 && (
                    <div className="flex gap-1.5 mb-3">
                      {asset.platform.map(p => {
                        const pc = platformConfig[p];
                        if (!pc) return null;
                        const PlatIcon = pc.icon;
                        return <PlatIcon key={p} className={cn("w-3.5 h-3.5", pc.color)} />;
                      })}
                    </div>
                  )}

                  {asset.proof_url && (
                    <a href={asset.proof_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-sky-600 hover:text-sky-700 bg-sky-50 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-800 rounded-lg px-3 py-1.5 mb-2 truncate">
                      <Paperclip className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">Attached Proof</span>
                      <Download className="w-3 h-3 flex-shrink-0 ml-auto" />
                    </a>
                  )}

                  {asset.caption && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{asset.caption}</p>
                  )}

                  <div className="flex gap-2 pt-2 border-t border-border">
                    <Button size="sm" variant="outline" className="flex-1 text-xs h-7" onClick={() => openEdit(asset)}>
                      <Edit className="w-3 h-3 mr-1" /> Edit
                    </Button>
                    {asset.status === 'approved' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-xs h-7 text-emerald-600 border-emerald-200"
                        onClick={async () => {
                          await base44.entities.MarketingAsset.update(asset.id, { status: 'published', published_date: new Date().toISOString().split('T')[0] });
                          loadData();
                        }}
                      >
                        Publish
                      </Button>
                    )}
                    {asset.status === 'draft' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-xs h-7 text-amber-600 border-amber-200"
                        onClick={async () => {
                          await base44.entities.MarketingAsset.update(asset.id, { status: 'pending_approval' });
                          loadData();
                        }}
                      >
                        Submit
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      </>}

      {/* Add/Edit Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-jakarta">{editingAsset ? 'Edit Asset' : 'Add Marketing Asset'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-1.5">
              <Label>Title *</Label>
              <Input value={formData.title || ''} onChange={e => setFormData({...formData, title: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Asset Type</Label>
                <Select value={formData.asset_type} onValueChange={v => setFormData({...formData, asset_type: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.keys(typeConfig).map(k => <SelectItem key={k} value={k} className="capitalize">{k}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={v => setFormData({...formData, status: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.keys(statusColors).map(k => <SelectItem key={k} value={k} className="capitalize">{k.replace('_', ' ')}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Collective</Label>
              <Select value={formData.collective_id || ''} onValueChange={v => setFormData({...formData, collective_id: v})}>
                <SelectTrigger><SelectValue placeholder="Select collective" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>None</SelectItem>
                  {collectives.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {/* Attached File Image */}
            <div className="space-y-1.5">
              <Label>Attached File Image</Label>
              <input ref={imageInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleUploadImage} />
              {formData.file_url ? (
                <div className="relative rounded-lg overflow-hidden border border-border h-32">
                  <img src={formData.file_url} alt="preview" className="w-full h-full object-cover" onError={e => e.target.style.display='none'} />
                  <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center gap-2 transition-opacity">
                    <Button type="button" size="sm" variant="outline" className="bg-white/90 text-xs" onClick={() => imageInputRef.current?.click()}>Replace</Button>
                    <Button type="button" size="sm" variant="outline" className="bg-white/90 text-xs text-rose-600" onClick={() => setFormData(prev => ({...prev, file_url: ''}))}>Remove</Button>
                  </div>
                </div>
              ) : (
                <button type="button" onClick={() => imageInputRef.current?.click()} className="w-full h-24 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-2 hover:border-primary transition-colors text-muted-foreground hover:text-primary">
                  {uploadingImage ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Upload className="w-5 h-5" /><span className="text-xs">Upload image or media file</span></>}
                </button>
              )}
            </div>

            {/* Attached Proof */}
            <div className="space-y-1.5">
              <Label>Attached Proof</Label>
              <input ref={proofInputRef} type="file" accept="image/*,application/pdf,.pdf,.doc,.docx" className="hidden" onChange={handleUploadProof} />
              {formData.proof_url ? (
                <div className="flex items-center gap-3 p-3 rounded-lg border border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/20">
                  <Paperclip className="w-4 h-4 text-sky-600 flex-shrink-0" />
                  <span className="text-xs text-sky-700 flex-1 truncate">Proof attached</span>
                  <a href={formData.proof_url} target="_blank" rel="noopener noreferrer"><Download className="w-4 h-4 text-sky-600" /></a>
                  <button type="button" onClick={() => setFormData(prev => ({...prev, proof_url: ''}))} className="text-rose-500 text-xs hover:underline">Remove</button>
                </div>
              ) : (
                <button type="button" onClick={() => proofInputRef.current?.click()} className="w-full h-16 border-2 border-dashed border-border rounded-lg flex items-center justify-center gap-2 hover:border-primary transition-colors text-muted-foreground hover:text-primary">
                  {uploadingProof ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Paperclip className="w-4 h-4" /><span className="text-xs">Upload campaign proof / PDF</span></>}
                </button>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Caption/Copy</Label>
              <Textarea rows={3} placeholder="Social media caption or copy..." value={formData.caption || ''} onChange={e => setFormData({...formData, caption: e.target.value})} />
            </div>
            <div className="space-y-1.5">
              <Label>Scheduled Date</Label>
              <Input type="date" value={formData.scheduled_date || ''} onChange={e => setFormData({...formData, scheduled_date: e.target.value})} />
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Input value={formData.notes || ''} onChange={e => setFormData({...formData, notes: e.target.value})} />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="gradient-gold text-white border-0">
              {saving ? 'Saving...' : editingAsset ? 'Save Changes' : 'Add Asset'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}