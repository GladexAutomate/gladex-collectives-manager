// @ts-nocheck
import { useState, useEffect, useRef, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, Image, Film, Mail, Globe, Search, Edit, Upload, Download, Paperclip, Loader2, Plane, ChevronDown, ChevronRight, AlertTriangle, Package, Trash2, X, Expand, FolderOpen, ExternalLink } from 'lucide-react';
import { broadcastRefresh } from '@/lib/dataSync';
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
  const [mkCollectiveIds, setMkCollectiveIds] = useState(new Set());
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
  const [uploadingAttachments, setUploadingAttachments] = useState(false);
  const [preselectedPkg, setPreselectedPkg] = useState(null);
  const [lightboxUrl, setLightboxUrl] = useState(null);
  const imageInputRef = useRef(null);
  const proofInputRef = useRef(null);
  const attachmentsInputRef = useRef(null);

  useEffect(() => {
    Promise.all([
      base44.entities.MarketingAsset.list('-created_date'),
      base44.entities.Collective.list('-created_date'),
    ]).then(([a, c]) => {
      setAssets(Array.isArray(a) ? a : []);
      setCollectives(Array.isArray(c) ? c : []);
      setLoading(false);
    }).catch(() => setLoading(false));
    base44.entities.ChecklistTask.list()
      .then(tasks => {
        const mkIds = new Set(
          (Array.isArray(tasks) ? tasks : []).filter(t => t.department === 'marketing').map(t => t.collective_id).filter(Boolean)
        );
        setMkCollectiveIds(mkIds);
      })
      .catch(() => {});
    // Listen for data changes from other pages — but skip if reloadAll triggered it (avoid loop)
    let refreshing = false;
    const onRefresh = async () => {
      if (refreshing) return;
      refreshing = true;
      try {
        const [a, c] = await Promise.all([
          base44.entities.MarketingAsset.list('-created_date'),
          base44.entities.Collective.list('-created_date'),
        ]);
        setAssets(Array.isArray(a) ? a : []);
        setCollectives(Array.isArray(c) ? c : []);
      } finally {
        refreshing = false;
      }
    };
    window.addEventListener('gladex:refresh', onRefresh);
    return () => window.removeEventListener('gladex:refresh', onRefresh);
  }, []);

  const autoTitle = (collectiveId, assetType) => {
    const pkg = collectives.find(c => c.id === collectiveId);
    if (!pkg) return '';
    const typeLbl = typeConfig[assetType]?.label || assetType;
    return `${pkg.name} – ${typeLbl}`;
  };

  const openAdd = (pkgId = null) => {
    setEditingAsset(null);
    setPreselectedPkg(pkgId);
    const title = pkgId ? autoTitle(pkgId, 'poster') : '';
    setFormData({ status: 'draft', asset_type: 'poster', platform: [], collective_id: pkgId || '', title, attachments: [] });
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

  const handleUploadAttachments = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploadingAttachments(true);
    const uploaded = [];
    for (const file of files) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      uploaded.push({ url: file_url, name: file.name, type: file.type });
    }
    setFormData(prev => ({ ...prev, attachments: [...(prev.attachments || []), ...uploaded] }));
    setUploadingAttachments(false);
    e.target.value = '';
  };

  const removeAttachment = (idx) => {
    setFormData(prev => ({ ...prev, attachments: (prev.attachments || []).filter((_, i) => i !== idx) }));
  };

  const handleSave = async () => {
    if (!formData.title?.trim()) {
      alert('Please enter a title for this asset.');
      return;
    }
    if (!formData.collective_id) {
      alert('Please select a package.');
      return;
    }
    setSaving(true);
    try {
      if (editingAsset) {
        await base44.entities.MarketingAsset.update(editingAsset.id, formData);
      } else {
        await base44.entities.MarketingAsset.create(formData);
      }
      setShowModal(false);
      await reloadAll();
      broadcastRefresh();
    } catch (e) {
      alert('Save failed: ' + (e?.message || 'Unknown error'));
    }
    setSaving(false);
  };

  const reloadAll = async () => {
    const [a, c] = await Promise.all([
      base44.entities.MarketingAsset.list('-created_date'),
      base44.entities.Collective.list('-created_date'),
    ]);
    setAssets(Array.isArray(a) ? a : []);
    setCollectives(Array.isArray(c) ? c : []);
  };

  const handleDelete = async (asset) => {
    try {
      await base44.entities.MarketingAsset.delete(asset.id);
      await reloadAll();
      broadcastRefresh();
    } catch (e) {
      alert('Delete failed: ' + (e?.message || 'Unknown error'));
    }
  };

  const handlePublish = async (asset) => {
    try {
      await base44.entities.MarketingAsset.update(asset.id, { status: 'published', published_date: new Date().toISOString().split('T')[0] });
      if (asset.collective_id && asset.file_url) {
        const collective = collectives.find(c => c.id === asset.collective_id);
        if (collective && !collective.image_url) {
          await base44.entities.Collective.update(asset.collective_id, { image_url: asset.file_url });
        }
      }
      await reloadAll();
      broadcastRefresh();
    } catch (e) {
      alert('Publish failed: ' + (e?.message || 'Unknown error'));
    }
  };

  const handleSubmitForApproval = async (asset) => {
    try {
      await base44.entities.MarketingAsset.update(asset.id, { status: 'pending_approval' });
      await reloadAll();
      broadcastRefresh();
    } catch (e) {
      alert('Submit failed: ' + (e?.message || 'Unknown error'));
    }
  };

  const togglePkg = (id) => setExpandedPkg(prev => ({ ...prev, [id]: !prev[id] }));

  // --- Filtered data ---
  // Show only packages with marketing workflow tasks, excluding completed/cancelled
  const activePkgs = collectives.filter(c =>
    mkCollectiveIds.has(c.id) && !['completed', 'cancelled'].includes(c.status)
  );
  const filteredCollectives = activePkgs.filter(c =>
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
  const pkgsReadyForMarketing = activePkgs.length;
  const pkgsWithAssets = activePkgs.filter(c => assets.some(a => a.collective_id === c.id)).length;
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
          { key: 'tariff', label: '📋 Tariff' },
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
          { label: 'Ready for Marketing', value: pkgsReadyForMarketing, color: 'text-pink-600' },
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
      {activeTab !== 'tariff' && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={activeTab === 'packages' ? "Search packages or destination..." : "Search assets..."}
            className="pl-9"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      )}

      {/* === PACKAGES + ASSETS TAB === */}
      {activeTab === 'packages' && (
        <div className="space-y-3">
          {loading ? (
            [1,2,3].map(i => <div key={i} className="h-20 bg-card rounded-xl border animate-pulse" />)
          ) : filteredCollectives.length === 0 ? (
            <div className="text-center py-16">
              <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm font-medium text-foreground mb-1">No packages ready for marketing</p>
              <p className="text-xs text-muted-foreground">Packages appear here once Product Development completes their workflow (status becomes Active)</p>
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
                    {pkg.drive_link && (
                      <div className="flex items-center gap-2 px-4 py-2.5 bg-sky-50 border-b border-sky-100">
                        <span className="text-[11px] text-sky-700 font-medium">📁 Drive Folder:</span>
                        <a
                          href={pkg.drive_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-sky-600 hover:text-sky-800 hover:underline truncate flex-1"
                        >
                          {pkg.drive_link}
                        </a>
                        <a
                          href={pkg.drive_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] font-semibold text-white bg-sky-500 hover:bg-sky-600 px-2 py-0.5 rounded flex-shrink-0"
                        >
                          Open ↗
                        </a>
                      </div>
                    )}
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
                        {pkgAssets.map(asset => <AssetCard key={asset.id} asset={asset} onEdit={openEdit} onDelete={handleDelete} onPublish={handlePublish} onSubmit={handleSubmitForApproval} onView={setLightboxUrl} />)}
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
          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-36"><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {Object.entries(typeConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="Status" /></SelectTrigger>
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
                return <AssetCard key={asset.id} asset={asset} pkgName={pkgName} onEdit={openEdit} onDelete={handleDelete} onPublish={handlePublish} onSubmit={handleSubmitForApproval} onView={setLightboxUrl} />;
              })}
            </div>
          )}
        </div>
      )}

      {/* Tariff Tab */}
      {activeTab === 'tariff' && (
        <div className="space-y-5">
          {/* Header banner */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                <FolderOpen className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="font-bold text-base font-jakarta text-amber-900">POTB Collectives Tariff</h3>
                <p className="text-xs text-amber-700 mt-0.5">25 destination folders · Rates & pricing documents · Google Drive</p>
              </div>
            </div>
            <a
              href="https://drive.google.com/drive/folders/1gWPN5UHfC5xcBc2D4GluQZQcd_FRjRe1"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors flex-shrink-0"
            >
              <ExternalLink className="w-4 h-4" /> Open Full Drive Folder
            </a>
          </div>

          {/* Destination grid */}
          <div>
            <p className="text-xs text-muted-foreground mb-3 font-medium uppercase tracking-wide">Browse by Destination</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {[
                { name: 'Japan',            emoji: '🇯🇵' },
                { name: 'Korea',            emoji: '🇰🇷' },
                { name: 'Taiwan',           emoji: '🇹🇼' },
                { name: 'China',            emoji: '🇨🇳' },
                { name: 'Hongkong',         emoji: '🇭🇰' },
                { name: 'Singapore',        emoji: '🇸🇬' },
                { name: 'Thailand',         emoji: '🇹🇭' },
                { name: 'Vietnam',          emoji: '🇻🇳' },
                { name: 'Bali',             emoji: '🌴' },
                { name: 'India',            emoji: '🇮🇳' },
                { name: 'South Asia',       emoji: '🌏' },
                { name: 'Central Asia',     emoji: '🗺️' },
                { name: 'Mongolia',         emoji: '🏕️' },
                { name: 'Dubai',            emoji: '🇦🇪' },
                { name: 'Holy Land',        emoji: '✡️' },
                { name: 'Europe',           emoji: '🇪🇺' },
                { name: 'United Kingdom',   emoji: '🇬🇧' },
                { name: 'America',          emoji: '🇺🇸' },
                { name: 'Canada',           emoji: '🇨🇦' },
                { name: 'New Zealand',      emoji: '🇳🇿' },
                { name: 'Cruise',           emoji: '🚢' },
                { name: 'Tri-City',         emoji: '🏙️' },
                { name: 'Fam Tour',         emoji: '✈️' },
                { name: 'Premium Packages', emoji: '⭐' },
                { name: 'Land Arrangement', emoji: '🏨' },
              ].map(dest => (
                <a
                  key={dest.name}
                  href="https://drive.google.com/drive/folders/1gWPN5UHfC5xcBc2D4GluQZQcd_FRjRe1"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group bg-card border border-border hover:border-amber-300 hover:shadow-md rounded-xl p-4 flex flex-col items-center gap-2 transition-all text-center"
                >
                  <span className="text-3xl">{dest.emoji}</span>
                  <span className="text-xs font-semibold text-foreground group-hover:text-amber-700 transition-colors leading-tight">{dest.name}</span>
                  <span className="text-[10px] text-muted-foreground group-hover:text-amber-500 flex items-center gap-0.5 transition-colors">
                    <ExternalLink className="w-2.5 h-2.5" /> View Tariff
                  </span>
                </a>
              ))}
            </div>
          </div>

          <p className="text-[11px] text-muted-foreground text-center">
            All tariff documents are stored in Google Drive. Click any destination to browse its folder.
          </p>
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
              <Select value={formData.collective_id || ''} onValueChange={v => {
                const newTitle = autoTitle(v, formData.asset_type || 'poster');
                setFormData(prev => ({ ...prev, collective_id: v, title: prev.title || newTitle }));
              }}>
                <SelectTrigger><SelectValue placeholder="Select package" /></SelectTrigger>
                <SelectContent>
                  {collectives.filter(c => (mkCollectiveIds.has(c.id) && !['completed','cancelled'].includes(c.status)) || (editingAsset && c.id === editingAsset.collective_id)).length === 0 ? (
                    <SelectItem value="_none" disabled>No packages available</SelectItem>
                  ) : (
                    collectives.filter(c => (mkCollectiveIds.has(c.id) && !['completed','cancelled'].includes(c.status)) || (editingAsset && c.id === editingAsset.collective_id)).map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Title * <span className="text-xs font-normal text-muted-foreground">(auto-filled from package name)</span></Label>
              <Input value={formData.title || ''} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g. Korea Spring 2026 – Poster" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Asset Type</Label>
                <Select value={formData.asset_type} onValueChange={v => {
                  const newTitle = autoTitle(formData.collective_id, v);
                  setFormData(prev => ({ ...prev, asset_type: v, title: newTitle || prev.title }));
                }}>
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
            {/* Attachments — multiple files/posters */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Attachments / Posters</Label>
                <span className="text-[10px] text-muted-foreground">{(formData.attachments || []).length} file{(formData.attachments || []).length !== 1 ? 's' : ''}</span>
              </div>
              <input
                ref={attachmentsInputRef}
                type="file"
                accept="image/*,video/*,application/pdf,.doc,.docx"
                multiple
                className="hidden"
                onChange={handleUploadAttachments}
              />
              {/* Attachment thumbnails */}
              {(formData.attachments || []).length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {(formData.attachments || []).map((att, idx) => {
                    const isImage = att.type?.startsWith('image/') || /\.(jpe?g|png|gif|webp|svg)$/i.test(att.name || '');
                    return (
                      <div key={idx} className="relative group rounded-lg overflow-hidden border border-border bg-muted/30">
                        {isImage ? (
                          <img src={att.url} alt={att.name} className="w-full h-20 object-cover" />
                        ) : (
                          <div className="w-full h-20 flex flex-col items-center justify-center gap-1">
                            <Paperclip className="w-5 h-5 text-muted-foreground" />
                            <span className="text-[9px] text-muted-foreground text-center px-1 truncate w-full">{att.name}</span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1.5 transition-opacity">
                          <a href={att.url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}>
                            <Download className="w-4 h-4 text-white" />
                          </a>
                          <button onClick={() => removeAttachment(idx)} className="text-rose-400 hover:text-rose-300">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <button
                type="button"
                onClick={() => attachmentsInputRef.current?.click()}
                className="w-full h-14 border-2 border-dashed border-border rounded-lg flex items-center justify-center gap-2 hover:border-primary transition-colors text-muted-foreground hover:text-primary"
              >
                {uploadingAttachments
                  ? <><Loader2 className="w-4 h-4 animate-spin" /><span className="text-xs">Uploading…</span></>
                  : <><Upload className="w-4 h-4" /><span className="text-xs">Add files or posters (multiple allowed)</span></>
                }
              </button>
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

      {/* Lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center p-4"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            className="absolute top-4 right-4 text-white hover:text-white/70 transition-colors z-10"
            onClick={() => setLightboxUrl(null)}
          >
            <X className="w-8 h-8" />
          </button>
          <a
            href={lightboxUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute top-4 right-16 text-white hover:text-white/70 transition-colors z-10"
            onClick={e => e.stopPropagation()}
            title="Download / Open original"
          >
            <Download className="w-6 h-6" />
          </a>
          <img
            src={lightboxUrl}
            alt="Full view"
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}

// ---- Reusable Asset Card ----
function AssetCard({ asset, pkgName, onEdit, onDelete, onPublish, onSubmit, onView }) {
  const [confirmDel, setConfirmDel] = useState(false);
  const cfg = typeConfig[asset.asset_type] || typeConfig.poster;
  const Icon = cfg.icon;
  return (
    <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
      {asset.file_url ? (
        <div
          className="min-h-[160px] max-h-[280px] overflow-hidden bg-muted/30 relative group/thumb cursor-zoom-in flex items-center justify-center"
          onClick={() => onView?.(asset.file_url)}
        >
          <img src={asset.file_url} alt={asset.title} className="w-full h-auto object-contain" onError={e => e.target.style.display='none'} />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center gap-3 transition-opacity">
            <Expand className="w-7 h-7 text-white drop-shadow" />
            <a
              href={asset.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white hover:text-white/80"
              onClick={e => e.stopPropagation()}
              title="Download original"
            >
              <Download className="w-6 h-6 drop-shadow" />
            </a>
          </div>
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
        {/* Attachments strip */}
        {asset.attachments?.length > 0 && (
          <div className="mb-2 space-y-1">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">{asset.attachments.length} Attachment{asset.attachments.length !== 1 ? 's' : ''}</p>
            <div className="flex gap-1.5 flex-wrap">
              {asset.attachments.map((att, idx) => {
                const isImage = att.type?.startsWith('image/') || /\.(jpe?g|png|gif|webp|svg)$/i.test(att.name || '');
                return isImage ? (
                  <a key={idx} href={att.url} target="_blank" rel="noopener noreferrer" title={att.name}>
                    <img src={att.url} alt={att.name} className="w-10 h-10 object-cover rounded border border-border hover:opacity-80 transition-opacity" />
                  </a>
                ) : (
                  <a key={idx} href={att.url} target="_blank" rel="noopener noreferrer" title={att.name}
                    className="flex items-center gap-1 px-2 py-1 rounded border border-border bg-muted/40 hover:bg-muted text-[10px] text-muted-foreground max-w-[80px] truncate">
                    <Paperclip className="w-2.5 h-2.5 flex-shrink-0" />
                    <span className="truncate">{att.name || 'File'}</span>
                  </a>
                );
              })}
            </div>
          </div>
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