import { useState, useEffect, useRef, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, Image, Film, Mail, Globe, Search, Edit, Upload, Download, Paperclip, Loader2, Plane, ChevronDown, ChevronRight, AlertTriangle, Package, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

const statusColors = {
  draft:            'bg-slate-100 text-slate-600',
  pending_approval: 'bg-amber-100 text-amber-700',
  approved:         'bg-sky-100 text-sky-700',
  published:        'bg-emerald-100 text-emerald-700',
  archived:         'bg-purple-100 text-purple-700',
};

const typeConfig = {
  poster:   { icon: Image, color: 'text-amber-600', bg: 'bg-amber-50', label: 'Poster' },
  reel:     { icon: Film,  color: 'text-rose-600',  bg: 'bg-rose-50',  label: 'Reel' },
  caption:  { icon: Globe, color: 'text-sky-600',   bg: 'bg-sky-50',   label: 'Caption' },
  e_blast:  { icon: Mail,  color: 'text-purple-600',bg: 'bg-purple-50',label: 'E-Blast' },
  video:    { icon: Film,  color: 'text-emerald-600',bg:'bg-emerald-50',label: 'Video' },
  photo:    { icon: Image, color: 'text-blue-600',  bg: 'bg-blue-50',  label: 'Photo' },
  brochure: { icon: Globe, color: 'text-orange-600',bg: 'bg-orange-50',label: 'Brochure' },
};

const pkgStatusConfig = {
  draft:               { label: 'Draft',             class: 'bg-slate-100 text-slate-600' },
  for_approval:        { label: 'For Approval',      class: 'bg-purple-100 text-purple-700' },
  product_development: { label: 'Product Dev',       class: 'bg-amber-100 text-amber-700' },
  marketing_prep:      { label: 'Marketing Prep',    class: 'bg-pink-100 text-pink-700' },
  active:              { label: 'Active',             class: 'bg-emerald-100 text-emerald-700' },
  launched:            { label: 'Launched',           class: 'bg-sky-100 text-sky-700' },
  open_booking:        { label: 'Open Booking',      class: 'bg-teal-100 text-teal-700' },
  reservation_ongoing: { label: 'Reservations Open', class: 'bg-blue-100 text-blue-700' },
  ongoing:             { label: 'Ongoing Travel',    class: 'bg-amber-100 text-amber-700' },
  completed:           { label: 'Completed',         class: 'bg-purple-100 text-purple-700' },
  cancelled:           { label: 'Cancelled',         class: 'bg-rose-100 text-rose-700' },
};

export default function Marketing() {
  const [assets, setAssets] = useState([]);
  const [collectives, setCollectives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('packages');
  const [search, setSearch] = useState('');
  const [expandedPkg, setExpandedPkg] = useState({});
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [preselectedPkg, setPreselectedPkg] = useState(null);
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

    const unsubA = base44.entities.MarketingAsset.subscribe((e) => {
      if (e.type === 'create') setAssets(p => [e.data, ...p]);
      else if (e.type === 'update') setAssets(p => p.map(a => a.id === e.id ? e.data : a));
      else if (e.type === 'delete') setAssets(p => p.filter(a => a.id !== e.id));
    });
    const unsubC = base44.entities.Collective.subscribe((e) => {
      if (e.type === 'create') setCollectives(p => [e.data, ...p]);
      else if (e.type === 'update') setCollectives(p => p.map(c => c.id === e.id ? e.data : c));
      else if (e.type === 'delete') setCollectives(p => p.filter(c => c.id !== e.id));
    });
    return () => { unsubA(); unsubC(); };
  }, []);

  const openAdd = (pkgId = null) => {
    setEditingAsset(null);
    setPreselectedPkg(pkgId);
    setFormData({ status: 'draft', asset_type: 'poster', platform: [], collective_id: pkgId || '' });
    setShowModal(true);
  };

  const openEdit = (a) => {
    setEditingAsset(a);
    setPreselectedPkg(null);
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
  };

  const handleDelete = async (asset) => {
    await base44.entities.MarketingAsset.delete(asset.id);
  };

  const handlePublish = async (asset) => {
    await base44.entities.MarketingAsset.update(asset.id, { status: 'published', published_date: new Date().toISOString().split('T')[0] });
    // Sync cover image to collective if it has a file_url
    if (asset.collective_id && asset.file_url) {
      const collective = collectives.find(c => c.id === asset.collective_id);
      if (collective && !collective.image_url) {
        await base44.entities.Collective.update(asset.collective_id, { image_url: asset.file_url });
      }
    }
  };

  const handleSubmitForApproval = async (asset) => {
    await base44.entities.MarketingAsset.update(asset.id, { status: 'pending_approval' });
  };

  const togglePkg = (id) => setExpandedPkg(prev => ({ ...prev, [id]: !prev[id] }));

  // --- Filtered data ---
  const filteredCollectives = collectives.filter(c =>
    !search || c.name?.toLowerCase().includes(search.toLowerCase()) || c.destination?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredAssets = assets.filter(a => {
    const matchSearch = !search || a.title?.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'all' || a.asset_type === typeFilter;
    const matchStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchSearch && matchType && matchStatus;
  });

  const assetsForPkg = (pkgId) => assets.filter(a => a.collective_id === pkgId);

  // Stats
  const pkgsWithAssets = collectives.filter(c => assets.some(a => a.collective_id === c.id)).length;
  const publishedAssets = assets.filter(a => a.status === 'published').length;
  const pendingAssets = assets.filter(a => a.status === 'pending_approval').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-jakarta text-foreground">Marketing</h2>
          <p className="text-sm text-muted-foreground">Package-linked campaigns · Assets · Social media</p>
        </div>
        <Button onClick={() => openAdd()} className="gradient-gold text-white border-0 gap-2">
          <Plus className="w-4 h-4" /> Add Asset
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted/50 rounded-xl p-1 w-fit">
        {[
          { key: 'packages', label: '📦 Packages + Assets' },
          { key: 'assets', label: '🎨 All Assets' },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={cn("px-4 py-2 rounded-lg text-xs font-medium transition-all",
              activeTab === tab.key ? "bg-card shadow text-foreground" : "text-muted-foreground hover:text-foreground")}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Packages', value: collectives.length, color: 'text-foreground' },
          { label: 'Packages with Assets', value: pkgsWithAssets, color: 'text-purple-600' },
          { label: 'Published Assets', value: publishedAssets, color: 'text-emerald-600' },
          { label: 'Pending Approval', value: pendingAssets, color: 'text-amber-600' },
        ].map((s, i) => (
          <div key={i} className="bg-card rounded-xl border border-border p-4 text-center">
            <p className={cn("text-2xl font-bold font-jakarta", s.color)}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search bar (shared) */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder={activeTab === 'packages' ? "Search packages or destination..." : "Search assets..."}
          className="pl-9"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* === PACKAGES + ASSETS TAB === */}
      {activeTab === 'packages' && (
        <div className="space-y-3">
          {loading ? (
            [1,2,3].map(i => <div key={i} className="h-20 bg-card rounded-xl border animate-pulse" />)
          ) : filteredCollectives.length === 0 ? (
            <div className="text-center py-16">
              <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">No packages found</p>
            </div>
          ) : filteredCollectives.map(pkg => {
            const pkgAssets = assetsForPkg(pkg.id);
            const isExpanded = expandedPkg[pkg.id];
            const cfg = pkgStatusConfig[pkg.status] || { label: pkg.status, class: 'bg-slate-100 text-slate-600' };
            const pct = pkg.total_slots > 0 ? Math.min(100, ((pkg.booked_pax || 0) / pkg.total_slots) * 100) : 0;

            return (
              <div key={pkg.id} className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                {/* Package header row */}
                <div
                  className="flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => togglePkg(pkg.id)}
                >
                  {isExpanded
                    ? <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    : <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  }
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-foreground font-jakarta truncate">{pkg.name}</span>
                      <Badge className={cn("text-[10px]", cfg.class)}>{cfg.label}</Badge>
                      {pct >= 80 && pct < 100 && <Badge className="text-[10px] bg-amber-100 text-amber-700 gap-1"><AlertTriangle className="w-2.5 h-2.5" />Almost Full</Badge>}
                      {pct >= 100 && <Badge className="text-[10px] bg-rose-100 text-rose-700">Sold Out</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Plane className="w-3 h-3" /> {pkg.destination}
                      {pkg.departure_date && ` · ${new Date(pkg.departure_date).toLocaleDateString('en-US', {month:'short',day:'numeric',year:'numeric'})}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-xs text-muted-foreground hidden sm:block">
                      {pkgAssets.length} asset{pkgAssets.length !== 1 ? 's' : ''}
                    </span>
                    {pkgAssets.length > 0 && (
                      <div className="flex gap-1">
                        {[...new Set(pkgAssets.map(a => a.status))].map(s => (
                          <span key={s} className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-medium", statusColors[s])}>
                            {pkgAssets.filter(a => a.status === s).length} {s?.replace('_',' ')}
                          </span>
                        ))}
                      </div>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs gap-1"
                      onClick={e => { e.stopPropagation(); openAdd(pkg.id); }}
                    >
                      <Plus className="w-3 h-3" /> Add Asset
                    </Button>
                  </div>
                </div>

                {/* Expanded assets */}
                {isExpanded && (
                  <div className="border-t border-border bg-muted/20">
                    {pkgAssets.length === 0 ? (
                      <div className="py-8 text-center">
                        <Image className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-xs text-muted-foreground mb-3">No assets yet for this package</p>
                        <Button size="sm" variant="outline" className="text-xs gap-1" onClick={() => openAdd(pkg.id)}>
                          <Plus className="w-3 h-3" /> Create First Asset
                        </Button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                        {pkgAssets.map(asset => <AssetCard key={asset.id} asset={asset} onEdit={openEdit} onDelete={handleDelete} onPublish={handlePublish} onSubmit={handleSubmitForApproval} />)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* === ALL ASSETS TAB === */}
      {activeTab === 'assets' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {Object.entries(typeConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
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

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1,2,3,4,5,6].map(i => <div key={i} className="h-48 bg-card rounded-xl border animate-pulse" />)}
            </div>
          ) : filteredAssets.length === 0 ? (
            <div className="text-center py-16">
              <Image className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold text-foreground mb-2">No assets found</h3>
              <Button onClick={() => openAdd()} className="gradient-gold text-white border-0">
                <Plus className="w-4 h-4 mr-2" /> Create First Asset
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredAssets.map(asset => {
                const pkgName = collectives.find(c => c.id === asset.collective_id)?.name;
                return <AssetCard key={asset.id} asset={asset} pkgName={pkgName} onEdit={openEdit} onDelete={handleDelete} onPublish={handlePublish} onSubmit={handleSubmitForApproval} />;
              })}
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-jakarta">{editingAsset ? 'Edit Asset' : 'Add Marketing Asset'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-1.5">
              <Label>Package *</Label>
              <Select value={formData.collective_id || ''} onValueChange={v => setFormData({...formData, collective_id: v})}>
                <SelectTrigger><SelectValue placeholder="Select package" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>No package</SelectItem>
                  {collectives.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Title *</Label>
              <Input value={formData.title || ''} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g. Japan Cherry Blossom 2026 - Main Poster" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Asset Type</Label>
                <Select value={formData.asset_type} onValueChange={v => setFormData({...formData, asset_type: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(typeConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
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
            {/* Image upload */}
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
            {/* Proof upload */}
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

// ---- Reusable Asset Card ----
function AssetCard({ asset, pkgName, onEdit, onDelete, onPublish, onSubmit }) {
  const [confirmDel, setConfirmDel] = useState(false);
  const cfg = typeConfig[asset.asset_type] || typeConfig.poster;
  const Icon = cfg.icon;
  return (
    <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
      {asset.file_url ? (
        <div className="h-32 overflow-hidden bg-muted relative group/thumb">
          <img src={asset.file_url} alt={asset.title} className="w-full h-full object-cover" onError={e => e.target.style.display='none'} />
          <a href={asset.file_url} target="_blank" rel="noopener noreferrer" className="absolute inset-0 bg-black/50 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center transition-opacity">
            <Download className="w-6 h-6 text-white" />
          </a>
        </div>
      ) : (
        <div className={cn("h-20 flex items-center justify-center", cfg.bg)}>
          <Icon className={cn("w-10 h-10 opacity-30", cfg.color)} />
        </div>
      )}
      <div className="p-3">
        <div className="flex items-start justify-between mb-1.5">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground text-xs truncate">{asset.title}</p>
            {pkgName && <p className="text-[10px] text-muted-foreground truncate">{pkgName}</p>}
          </div>
          <Badge className={cn("text-[10px] ml-2 flex-shrink-0 capitalize", statusColors[asset.status])}>
            {asset.status?.replace('_', ' ')}
          </Badge>
        </div>
        {asset.proof_url && (
          <a href={asset.proof_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[10px] text-sky-600 hover:text-sky-700 bg-sky-50 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-800 rounded-lg px-2 py-1 mb-2 truncate">
            <Paperclip className="w-2.5 h-2.5 flex-shrink-0" />
            <span className="truncate">Proof</span>
            <Download className="w-2.5 h-2.5 flex-shrink-0 ml-auto" />
          </a>
        )}
        {asset.caption && <p className="text-[10px] text-muted-foreground line-clamp-2 mb-2">{asset.caption}</p>}

        {confirmDel ? (
          <div className="flex gap-1.5 pt-2 border-t border-border">
            <span className="text-[10px] text-rose-600 flex-1 flex items-center">Delete this asset?</span>
            <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px] text-muted-foreground" onClick={() => setConfirmDel(false)}>No</Button>
            <Button size="sm" className="h-6 px-2 text-[10px] bg-rose-600 hover:bg-rose-700 text-white" onClick={() => onDelete(asset)}>Yes</Button>
          </div>
        ) : (
          <div className="flex gap-1.5 pt-2 border-t border-border">
            <Button size="sm" variant="outline" className="flex-1 text-[10px] h-6 px-2" onClick={() => onEdit(asset)}>
              <Edit className="w-2.5 h-2.5 mr-1" /> Edit
            </Button>
            {asset.status === 'approved' && (
              <Button size="sm" variant="outline" className="flex-1 text-[10px] h-6 px-2 text-emerald-600 border-emerald-200" onClick={() => onPublish(asset)}>Publish</Button>
            )}
            {asset.status === 'draft' && (
              <Button size="sm" variant="outline" className="flex-1 text-[10px] h-6 px-2 text-amber-600 border-amber-200" onClick={() => onSubmit(asset)}>Submit</Button>
            )}
            <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-rose-400 hover:text-rose-600 hover:bg-rose-50" onClick={() => setConfirmDel(true)}>
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}