// @ts-nocheck
import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { db } from '@/lib/db';
import { Plus, Image, Film, Mail, Globe, Search, Edit, Upload, Download, Paperclip, Loader2, Plane, ChevronDown, ChevronRight, AlertTriangle, Package, Trash2, X, Expand, CheckCircle2, Send, Inbox } from 'lucide-react';
import { firePipelineNotification } from '@/lib/notificationHelper';
import { broadcastRefresh } from '@/lib/dataSync';
import { pkgCodeStore } from '@/lib/packageCodeStore';
import { driveLinkStore } from '@/lib/driveLinkStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

const statusColors = {
  draft:            'bg-slate-100 text-slate-600 dark:bg-slate-800/40 dark:text-slate-400',
  pending_approval: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
  approved:         'bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400',
  published:        'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
  archived:         'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400',
};

const typeConfig = {
  poster:   { icon: Image, color: 'text-amber-600', label: 'Poster' },
  reel:     { icon: Film,  color: 'text-rose-600',  label: 'Reel' },
  caption:  { icon: Globe, color: 'text-sky-600',   label: 'Caption' },
  e_blast:  { icon: Mail,  color: 'text-purple-600',label: 'E-Blast' },
  video:    { icon: Film,  color: 'text-emerald-600',label: 'Video' },
  photo:    { icon: Image, color: 'text-blue-600',  label: 'Photo' },
  brochure: { icon: Globe, color: 'text-orange-600',label: 'Brochure' },
};

const pkgStatusConfig = {
  draft:               { label: 'Draft',             class: 'bg-slate-100 text-slate-600 dark:bg-slate-800/40 dark:text-slate-400' },
  for_approval:        { label: 'For Approval',      class: 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400' },
  product_development: { label: 'Product Dev',       class: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400' },
  marketing_prep:      { label: 'Marketing Prep',    class: 'bg-pink-100 text-pink-700 dark:bg-pink-950/40 dark:text-pink-400' },
  active:              { label: 'Active',             class: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' },
  launched:            { label: 'Launched',           class: 'bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400' },
  open_booking:        { label: 'Open Booking',      class: 'bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400' },
  reservation_ongoing: { label: 'Reservations Open', class: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400' },
  ongoing:             { label: 'Ongoing Travel',    class: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400' },
  completed:           { label: 'Completed',         class: 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400' },
  cancelled:           { label: 'Cancelled',         class: 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400' },
};

export default function Marketing() {
  const [assets, setAssets] = useState([]);
  const [collectives, setCollectives] = useState([]);
  const [mkCollectiveIds, setMkCollectiveIds] = useState(new Set());
  const [mkTasks, setMkTasks] = useState([]);
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
  const [posterForm, setPosterForm] = useState({
    packageName: '',
    destination: '',
    dateFrom: '',
    dateTo: '',
    price: '',
    inclusions: '',
    tagline: 'BOOK NOW!',
    duration: '',
    tourCode: '',
    downpayment: '',
  });

  // Canva OAuth connection state
  const [canvaConnected, setCanvaConnected] = useState(() =>
    localStorage.getItem('gladex_canva_connected') === '1'
  );
  const [canvaMsg, setCanvaMsg] = useState(null); // 'connected' | 'error'

  // Canva brand templates + generator state
  const [canvaTemplates, setCanvaTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [templateLoadError, setTemplateLoadError] = useState(null);
  const [selectedTplId, setSelectedTplId] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [generatedResult, setGeneratedResult] = useState(null); // { editUrl, viewUrl }
  const [generateError, setGenerateError] = useState(null);
  const [probeResults, setProbeResults] = useState(null);
  const [probing, setProbing] = useState(false);

  const SUPABASE_FN = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

  const callCanvaFn = async (body) => {
    const res = await fetch(`${SUPABASE_FN}/generate-canva-poster`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return res.json();
  };

  const testCanvaToken = async () => {
    setProbing(true);
    setProbeResults(null);
    const data = await callCanvaFn({ action: 'test_token' });
    setProbeResults(data);

    // Auto-apply: if any brandtemplates variant returned items, use those
    const btVariants = [data.bt_noVersion, data.bt_version_2024, data.bt_version_2023];
    for (const v of btVariants) {
      if (v?.status === 200 && Array.isArray(v?.data?.items) && v.data.items.length > 0) {
        setCanvaTemplates(v.data.items);
        setTemplateLoadError(null);
        break;
      }
    }

    // Fallback: if designs endpoint works but brandtemplates don't
    if (data.designs_endpoint?.status === 200 && Array.isArray(data.designs_endpoint?.data?.items)) {
      const designs = data.designs_endpoint.data.items;
      if (designs.length > 0 && canvaTemplates.length === 0) {
        setCanvaTemplates(designs.map(d => ({ id: d.id, title: d.title ?? d.id, type: 'design' })));
        setTemplateLoadError(null);
      }
    }

    setProbing(false);
  };

  const loadCanvaTemplates = async () => {
    setLoadingTemplates(true);
    setTemplateLoadError(null);
    try {
      const data = await callCanvaFn({ action: 'list_templates' });
      if (data.error) {
        const rawError = JSON.stringify(data.error);
        const msg = data.error?.message || data.error?.code || rawError;
        const statusInfo = data.httpStatus ? ` [HTTP ${data.httpStatus}]` : '';
        const needsTokenRefresh = msg?.toLowerCase().includes('unknown endpoint') || msg?.toLowerCase().includes('not found') || msg?.toLowerCase().includes('permission') || msg?.toLowerCase().includes('unauthorized') || msg?.toLowerCase().includes('invalid_token');
        setTemplateLoadError(needsTokenRefresh ? `token_refresh_needed|||${msg}${statusInfo}` : msg);
      } else {
        setCanvaTemplates(data.templates || []);
        if ((data.templates || []).length === 0) setTemplateLoadError('no_templates');
      }
    } catch (e) {
      setTemplateLoadError(e.message);
    }
    setLoadingTemplates(false);
  };

  const generatePoster = async () => {
    if (!selectedTplId) return alert('Please select a brand template first.');
    if (!posterForm.packageName) return alert('Package Name is required.');
    setGenerating(true);
    setGeneratedResult(null);
    setGenerateError(null);
    try {
      const startData = await callCanvaFn({ action: 'autofill', templateId: selectedTplId, fields: posterForm });
      if (startData.error) throw new Error(startData.error?.message || JSON.stringify(startData.error));
      const jobId = startData.jobId;
      // Poll until complete
      for (let i = 0; i < 30; i++) {
        await new Promise(r => setTimeout(r, 2000));
        const poll = await callCanvaFn({ action: 'check_job', templateId: jobId });
        if (poll?.job?.status === 'success') {
          const design = poll.job.result?.design;
          setGeneratedResult({ editUrl: design?.urls?.edit_url, viewUrl: design?.urls?.view_url });
          setGenerating(false);
          return;
        }
        if (poll?.job?.status === 'failed') throw new Error('Canva autofill job failed');
      }
      throw new Error('Timed out waiting for Canva to generate the design.');
    } catch (e) {
      setGenerateError(e.message);
      setGenerating(false);
    }
  };


  // Detect Canva OAuth return (?canva=connected or ?canva=error)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const canva = params.get('canva');
    if (canva === 'connected') {
      localStorage.setItem('gladex_canva_connected', '1');
      setCanvaConnected(true);
      setCanvaMsg('connected');
      setActiveTab('poster');
      window.history.replaceState({}, '', window.location.pathname);
    } else if (canva === 'error') {
      setCanvaMsg('error');
      setActiveTab('poster');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  useEffect(() => {
    Promise.all([
      db.MarketingAsset.list('-created_date'),
      db.Collective.list('-created_date'),
    ]).then(([a, c]) => {
      setAssets(Array.isArray(a) ? a : []);
      setCollectives(Array.isArray(c) ? c : []);
      setLoading(false);
    }).catch(() => setLoading(false));
    db.ChecklistTask.list()
      .then(tasks => {
        const arr = Array.isArray(tasks) ? tasks : [];
        const mkFiltered = arr.filter(t => t.department === 'marketing');
        setMkCollectiveIds(new Set(mkFiltered.map(t => t.collective_id).filter(Boolean)));
        setMkTasks(mkFiltered);
      })
      .catch(() => {});
    // Listen for data changes from other pages — but skip if reloadAll triggered it (avoid loop)
    let refreshing = false;
    const onRefresh = async () => {
      if (refreshing) return;
      refreshing = true;
      try {
        const [a, c] = await Promise.all([
          db.MarketingAsset.list('-created_date'),
          db.Collective.list('-created_date'),
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
    // file_url stores newline-separated poster URLs — decode back into attachments for modal UI
    const urls = (a.file_url || '').split('\n').filter(Boolean);
    const attachments = urls.map((url, i) => ({ url, name: a.title || `Poster ${i + 1}`, type: 'image/jpeg' }));
    setFormData({ ...a, attachments, file_url: '' });
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
      // Encode attachments array → newline-separated file_url for reliable persistence
      const atts = formData.attachments || [];
      const file_url = atts.map(a => a.url).filter(Boolean).join('\n');
      const payload = { ...formData, file_url };
      if (editingAsset) {
        await db.MarketingAsset.update(editingAsset.id, payload);
      } else {
        await db.MarketingAsset.create(payload);
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
      db.MarketingAsset.list('-created_date'),
      db.Collective.list('-created_date'),
    ]);
    setAssets(Array.isArray(a) ? a : []);
    setCollectives(Array.isArray(c) ? c : []);
  };

  const handleDelete = async (asset) => {
    try {
      await db.MarketingAsset.delete(asset.id);
      await reloadAll();
      broadcastRefresh();
    } catch (e) {
      alert('Delete failed: ' + (e?.message || 'Unknown error'));
    }
  };

  const handlePublish = async (asset) => {
    try {
      await db.MarketingAsset.update(asset.id, { status: 'published', published_date: new Date().toISOString().split('T')[0] });
      // file_url is newline-separated; use first URL for the collective image
      const firstUrl = (asset.file_url || '').split('\n').filter(Boolean)[0] || '';
      if (asset.collective_id && firstUrl) {
        const collective = collectives.find(c => c.id === asset.collective_id);
        if (collective && !collective.image_url) {
          await db.Collective.update(asset.collective_id, { image_url: firstUrl });
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
      await db.MarketingAsset.update(asset.id, { status: 'pending_approval' });
      await reloadAll();
      broadcastRefresh();
    } catch (e) {
      alert('Submit failed: ' + (e?.message || 'Unknown error'));
    }
  };

  const togglePkg = (id) => setExpandedPkg(prev => ({ ...prev, [id]: !prev[id] }));

  // ── Pipeline handlers ────────────────────────────────────────────────────────
  const startWorkingOnPackage = async (collective) => {
    await db.Collective.update(collective.id, { pipeline_stage: 'marketing_in_progress' });
    await reloadAll();
  };

  const sendToSales = async (collective) => {
    await db.Collective.update(collective.id, { pipeline_stage: 'ready_for_sales' });
    await firePipelineNotification(collective, 'sales');
    await reloadAll();
  };

  // --- Filtered data ---
  const activePkgs = collectives.filter(c => !['completed', 'cancelled'].includes(c.status));
  const filteredCollectives = activePkgs.filter(c =>
    !search || c.name?.toLowerCase().includes(search.toLowerCase()) || c.destination?.toLowerCase().includes(search.toLowerCase())
  );

  // Hide assets whose package was deleted (orphaned assets)
  const existingCollectiveIds = new Set(collectives.map(c => c.id));
  const nonOrphanAssets = assets.filter(a => !a.collective_id || existingCollectiveIds.has(a.collective_id));

  const filteredAssets = nonOrphanAssets.filter(a => {
    const matchSearch = !search || a.title?.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'all' || a.asset_type === typeFilter;
    const matchStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchSearch && matchType && matchStatus;
  });

  const assetsForPkg = (pkgId) => assets.filter(a => a.collective_id === pkgId);

  // Pipeline inbox: packages sent by Product Dev
  const pipelineInbox = collectives.filter(c => c.pipeline_stage === 'ready_for_marketing');
  const pipelineWIP   = collectives.filter(c => c.pipeline_stage === 'marketing_in_progress');
  const pipelineAll   = [...pipelineInbox, ...pipelineWIP];

  // Stats
  const pkgsReadyForMarketing = activePkgs.length;
  const pkgsWithAssets = activePkgs.filter(c => nonOrphanAssets.some(a => a.collective_id === c.id)).length;
  const publishedAssets = nonOrphanAssets.filter(a => a.status === 'published').length;
  const pendingAssets = nonOrphanAssets.filter(a => a.status === 'pending_approval').length;

  return (
    <div className="space-y-5 pb-6">
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
          { key: 'assets',   label: '🎨 All Assets' },
          { key: 'pipeline', label: `📥 Pipeline Inbox${pipelineInbox.length > 0 ? ` (${pipelineInbox.length})` : ''}` },
          { key: 'poster',   label: '✨ Poster Generator' },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={cn("px-4 py-2 rounded-lg text-xs font-medium transition-all",
              activeTab === tab.key ? "bg-card shadow text-foreground" : "text-muted-foreground hover:text-foreground",
              tab.key === 'pipeline' && pipelineInbox.length > 0 && activeTab !== 'pipeline' && "text-pink-600"
            )}>
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
          <div key={i} className="bg-card rounded-2xl border border-border p-4 text-center">
            <p className={cn("text-2xl font-bold font-jakarta", s.color)}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search bar */}
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
              <p className="text-sm font-medium text-foreground mb-1">No packages ready for marketing</p>
              <p className="text-xs text-muted-foreground">Packages appear here once Product Development completes their workflow (status becomes Active)</p>
            </div>
          ) : filteredCollectives.map(pkg => {
            const pkgAssets = assetsForPkg(pkg.id);
            const isExpanded = expandedPkg[pkg.id];
            const cfg = pkgStatusConfig[pkg.status] || { label: pkg.status, class: 'bg-slate-100 text-slate-600' };
            const pct = pkg.total_slots > 0 ? Math.min(100, ((pkg.booked_pax || 0) / pkg.total_slots) * 100) : 0;

            return (
              <div key={pkg.id} className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
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
                    {(pkg.package_code || pkgCodeStore.get(pkg.id)) && (
                      <p className="text-[10px] font-mono font-semibold text-muted-foreground mb-0.5 tracking-wide">
                        {pkg.package_code || pkgCodeStore.get(pkg.id)}
                      </p>
                    )}
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
                    {(() => { const dl = pkg.drive_link || assets.find(a => a.collective_id === pkg.id && a.asset_type === 'tariff_link')?.file_url || driveLinkStore.get(pkg.id); return dl && (
                      <div className="flex items-center gap-2 px-4 py-2.5 bg-violet-50 dark:bg-violet-950/25 border-b border-violet-100 dark:border-violet-900/40">
                        <span className="text-[11px] text-violet-700 dark:text-violet-300 font-semibold">🔗 Tariff / Package Link:</span>
                        <a
                          href={dl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-violet-600 dark:text-violet-400 hover:underline truncate flex-1"
                        >
                          {dl}
                        </a>
                        <a
                          href={dl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] font-semibold text-white bg-violet-500 hover:bg-violet-600 px-2 py-0.5 rounded flex-shrink-0"
                        >
                          Open ↗
                        </a>
                      </div>
                    ); })()}
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

{/* Marketing Checklist Progress */}
      {mkTasks.length > 0 && (() => {
        const byCollective = {};
        mkTasks.forEach(t => {
          if (!t.collective_id) return;
          if (!byCollective[t.collective_id]) byCollective[t.collective_id] = [];
          byCollective[t.collective_id].push(t);
        });
        const entries = Object.entries(byCollective).map(([cid, tasks]) => {
          const collective = collectives.find(c => c.id === cid);
          const done  = tasks.filter(t => t.status === 'done' || t.status === 'completed').length;
          const total = tasks.length;
          const pct   = total > 0 ? Math.round((done / total) * 100) : 0;
          return { cid, collective, tasks, done, total, pct };
        }).filter(e => e.collective).sort((a, b) => a.pct - b.pct);
        if (entries.length === 0) return null;
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-4 h-4" style={{ color: '#a78bfa' }} />
              <h3 className="text-base font-bold text-foreground">Marketing Checklist Progress</h3>
              <span className="text-xs text-muted-foreground px-2 py-0.5 bg-muted rounded-full">{entries.length} collective{entries.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {entries.map(({ cid, collective, tasks, done, total, pct }) => {
                const stageGroups = {};
                tasks.forEach(t => {
                  const key = t.stage_name || (t.stage_number ? `Stage ${t.stage_number}` : 'Task');
                  if (!stageGroups[key]) stageGroups[key] = { done: 0, total: 0 };
                  stageGroups[key].total++;
                  if (t.status === 'done' || t.status === 'completed') stageGroups[key].done++;
                });
                const allDone = pct === 100;
                return (
                  <div key={cid} className="bg-card border border-border rounded-xl p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-foreground truncate">{collective.name}</p>
                        <p className="text-xs text-muted-foreground">{collective.destination || '—'} · {collective.status?.replace(/_/g, ' ') || '—'}</p>
                      </div>
                      <span className="text-sm font-black flex-shrink-0" style={{ color: allDone ? '#10b981' : '#a78bfa' }}>{pct}%</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(stageGroups).map(([stage, sg]) => (
                        <span key={stage} className={cn(
                          "text-[10px] font-semibold px-2 py-0.5 rounded-full border",
                          sg.done === sg.total
                            ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                            : "bg-violet-500/10 border-violet-500/20 text-violet-600 dark:text-violet-400"
                        )}>
                          {stage} · {sg.done}/{sg.total}
                        </span>
                      ))}
                    </div>
                    <div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden mb-1.5">
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: allDone ? 'linear-gradient(90deg,#10b981,#34d399)' : 'linear-gradient(90deg,#6d28d9,#a78bfa)' }} />
                      </div>
                      <div className="flex justify-between text-[10px] text-muted-foreground">
                        <span>{done} done</span>
                        <span>{total - done} remaining</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* === PIPELINE TAB === */}
      {activeTab === 'pipeline' && (
        <div className="space-y-4">
          {/* Section: Inbox from Product Dev */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Inbox className="w-4 h-4 text-pink-500" />
              <h3 className="text-sm font-bold text-foreground">From Product Dev</h3>
              <span className="text-xs text-muted-foreground bg-pink-100 dark:bg-pink-950/30 text-pink-700 dark:text-pink-300 px-2 py-0.5 rounded-full">{pipelineInbox.length} new</span>
            </div>
            {pipelineInbox.length === 0 ? (
              <div className="bg-card border border-border rounded-2xl p-8 text-center">
                <Inbox className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm font-medium text-muted-foreground">No new packages from Product Dev</p>
                <p className="text-xs text-muted-foreground/60 mt-1">When Product Dev marks a collective as ready, it will appear here</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {pipelineInbox.map(c => {
                  const pkgAssets = assetsForPkg(c.id);
                  return (
                    <div key={c.id} className="bg-card border-2 border-pink-200 dark:border-pink-800/60 rounded-2xl p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-semibold text-sm text-foreground truncate">{c.name}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Plane className="w-3 h-3" /> {c.destination || '—'}
                          </p>
                        </div>
                        <span className="text-[10px] bg-pink-100 text-pink-700 dark:bg-pink-950/30 dark:text-pink-300 px-2 py-0.5 rounded-full font-medium whitespace-nowrap flex-shrink-0">📥 New</span>
                      </div>
                      {c.selling_price > 0 && (
                        <p className="text-xs text-amber-600 font-bold">₱{Number(c.selling_price).toLocaleString()}/pax</p>
                      )}
                      <p className="text-[10px] text-muted-foreground">{pkgAssets.length} asset{pkgAssets.length !== 1 ? 's' : ''} created so far</p>
                      <div className="flex gap-2">
                        <Button size="sm" className="flex-1 h-7 text-xs gap-1 bg-violet-600 hover:bg-violet-700 text-white border-0"
                          onClick={() => { openAdd(c.id); startWorkingOnPackage(c); }}>
                          <Plus className="w-3 h-3" /> Start + Add Asset
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 text-xs gap-1"
                          onClick={() => startWorkingOnPackage(c)}>
                          Mark Working
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section: In Progress */}
          {pipelineWIP.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-sm">🎨</span>
                <h3 className="text-sm font-bold text-foreground">In Progress</h3>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{pipelineWIP.length}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {pipelineWIP.map(c => {
                  const pkgAssets = assetsForPkg(c.id);
                  const publishedCount = pkgAssets.filter(a => a.status === 'published').length;
                  return (
                    <div key={c.id} className="bg-card border border-purple-200 dark:border-purple-800/40 rounded-2xl p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-semibold text-sm text-foreground truncate">{c.name}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Plane className="w-3 h-3" /> {c.destination || '—'}
                          </p>
                        </div>
                        <span className="text-[10px] bg-purple-100 text-purple-700 dark:bg-purple-950/30 dark:text-purple-300 px-2 py-0.5 rounded-full font-medium flex-shrink-0">🎨 Working</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground">{pkgAssets.length} asset{pkgAssets.length !== 1 ? 's' : ''} · {publishedCount} published</p>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="h-7 text-xs gap-1"
                          onClick={() => openAdd(c.id)}>
                          <Plus className="w-3 h-3" /> Add Asset
                        </Button>
                        <Button size="sm" className="flex-1 h-7 text-xs gap-1 bg-sky-600 hover:bg-sky-700 text-white border-0"
                          onClick={() => sendToSales(c)}>
                          <Send className="w-3 h-3" /> Send to Sales
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* === POSTER GENERATOR TAB === */}
      {activeTab === 'poster' && (
        <div className="space-y-4">

          {/* Canva Connect */}
          <div className="bg-card border border-border rounded-2xl p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
                  <span className="text-base">🎨</span> Canva Connect
                </h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {canvaConnected
                    ? 'Connected — brand templates from your Canva account are available'
                    : 'Connect your Canva account to autofill brand templates with package details'}
                </p>
              </div>
              {canvaConnected ? (
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Connected
                  </span>
                  <Button size="sm" variant="outline" className="text-xs h-7"
                    onClick={() => { localStorage.removeItem('gladex_canva_connected'); setCanvaConnected(false); setCanvaMsg(null); }}>
                    Disconnect
                  </Button>
                </div>
              ) : (
                <Button size="sm" className="shrink-0 gap-1.5 text-xs h-7 bg-[#7d2ae8] hover:bg-[#6b24c6] text-white border-0"
                  onClick={() => { window.location.href = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/canva-login`; }}>
                  Connect Canva
                </Button>
              )}
            </div>
            {canvaMsg === 'connected' && (
              <p className="mt-2 text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 rounded-lg px-3 py-2">
                ✓ Successfully connected to Canva!
              </p>
            )}
            {canvaMsg === 'error' && (
              <p className="mt-2 text-xs text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 rounded-lg px-3 py-2">
                Connection failed. Please try again.
              </p>
            )}
          </div>

          {/* Brand Template — auto-load or manual */}
          <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-sm text-foreground">Brand Template</h3>
                <p className="text-[10px] text-muted-foreground">
                  {canvaTemplates.length > 0
                    ? `${canvaTemplates.length} template${canvaTemplates.length > 1 ? 's' : ''} loaded — select one below`
                    : 'Load your Canva Brand Kit templates or paste an ID manually'}
                </p>
              </div>
              {canvaConnected && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs h-7 shrink-0"
                  disabled={probing}
                  onClick={testCanvaToken}
                >
                  {probing ? <><Loader2 className="w-3 h-3 animate-spin" /> Probing…</> : 'Load Templates'}
                </Button>
              )}
            </div>

            {/* Template selector — shown when templates loaded */}
            {canvaTemplates.length > 0 && (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground">Select Template</Label>
                <Select value={selectedTplId || ''} onValueChange={setSelectedTplId} disabled={!canvaConnected}>
                  <SelectTrigger className="text-xs h-9">
                    <SelectValue placeholder="Choose a brand template…" />
                  </SelectTrigger>
                  <SelectContent>
                    {canvaTemplates.map(t => (
                      <SelectItem key={t.id} value={t.id} className="text-xs">
                        {t.title || t.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Probe results — shown after Load Templates */}
            {probeResults && (
              <div className="rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 px-3 py-2.5 space-y-1.5">
                <p className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">API Probe Results</p>
                {[
                  { label: 'No version header', r: probeResults.bt_noVersion },
                  { label: 'Api-Version 2024-06-18', r: probeResults.bt_version_2024 },
                  { label: 'Api-Version 2023-12-20', r: probeResults.bt_version_2023 },
                  { label: 'Designs endpoint', r: probeResults.designs_endpoint },
                ].map(({ label, r }) => (
                  <div key={label} className="flex items-center gap-2">
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${r?.status === 200 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400'}`}>
                      {r?.status ?? '?'}
                    </span>
                    <span className="text-[10px] text-slate-600 dark:text-slate-400">{label}</span>
                    {r?.status === 200 && <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">✓ works</span>}
                    {r?.status !== 200 && <span className="text-[10px] text-slate-400 truncate">{r?.data?.message || r?.data?.code || ''}</span>}
                  </div>
                ))}
                {probeResults.profile_team_id && (
                  <p className="text-[10px] text-slate-500 dark:text-slate-500 pt-1 border-t border-slate-200 dark:border-slate-700">
                    Team ID: <span className="font-mono">{probeResults.profile_team_id}</span>
                  </p>
                )}
              </div>
            )}

            {/* Manual fallback — always available */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground">Or paste Template ID manually</Label>
              <Input
                placeholder="e.g. OAGVmtpBBXQ"
                value={canvaTemplates.length > 0 ? (selectedTplId || '') : (selectedTplId || '')}
                onChange={e => setSelectedTplId(e.target.value.trim())}
                disabled={!canvaConnected}
              />
              <p className="text-[10px] text-muted-foreground">
                From Canva Brand Hub → open template → copy ID from URL: <code className="bg-muted px-1 rounded">canva.com/brand/templates/<strong>[ID]</strong>/edit</code>
              </p>
            </div>

            {selectedTplId && (
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Template: <span className="font-mono">{selectedTplId}</span>
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Form */}
            <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
              <h3 className="font-semibold text-sm text-foreground">Poster Details</h3>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground">Package Name *</Label>
                <Input placeholder="e.g. Boracay 4D3N Package" value={posterForm.packageName}
                  onChange={e => setPosterForm(p => ({ ...p, packageName: e.target.value }))} />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground">Destination</Label>
                <Input placeholder="e.g. Boracay, Aklan" value={posterForm.destination}
                  onChange={e => setPosterForm(p => ({ ...p, destination: e.target.value }))} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">Date From</Label>
                  <Input type="date" value={posterForm.dateFrom}
                    onChange={e => setPosterForm(p => ({ ...p, dateFrom: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">Date To</Label>
                  <Input type="date" value={posterForm.dateTo}
                    onChange={e => setPosterForm(p => ({ ...p, dateTo: e.target.value }))} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground">Price (per person)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-bold">₱</span>
                  <Input className="pl-7" placeholder="e.g. 12,500" value={posterForm.price}
                    onChange={e => setPosterForm(p => ({ ...p, price: e.target.value }))} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground">Inclusions <span className="text-muted-foreground/60">(one per line)</span></Label>
                <Textarea
                  placeholder={"Roundtrip Airfare\n3 Nights Accommodation\nBreakfast Daily\nTours & Transfers\nVisa Assistance"}
                  rows={5} value={posterForm.inclusions} className="text-xs resize-none"
                  onChange={e => setPosterForm(p => ({ ...p, inclusions: e.target.value }))} />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground">Promo Tag</Label>
                <Input placeholder="e.g. BOOK NOW! or LIMITED SLOTS" value={posterForm.tagline}
                  onChange={e => setPosterForm(p => ({ ...p, tagline: e.target.value }))} />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground">Duration</Label>
                <Input placeholder="e.g. 5 DAYS 3 NIGHTS" value={posterForm.duration}
                  onChange={e => setPosterForm(p => ({ ...p, duration: e.target.value }))} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">Tour Code</Label>
                  <Input placeholder="e.g. UOV15B3" value={posterForm.tourCode}
                    onChange={e => setPosterForm(p => ({ ...p, tourCode: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">Downpayment</Label>
                  <Input placeholder="e.g. PHP 20,000" value={posterForm.downpayment}
                    onChange={e => setPosterForm(p => ({ ...p, downpayment: e.target.value }))} />
                </div>
              </div>
            </div>

            {/* Generate Panel */}
            <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
              <div>
                <h3 className="font-semibold text-sm text-foreground">Generate in Canva</h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">Autofills your selected brand template with the details on the left</p>
              </div>

              {/* Selected template summary */}
              <div className={cn('rounded-xl border p-3 text-xs', selectedTplId ? 'border-purple-300 bg-purple-50 dark:bg-purple-950/20' : 'border-dashed border-border')}>
                {selectedTplId ? (
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
                    <span className="text-foreground font-medium">
                      {canvaTemplates.find(t => t.id === selectedTplId)?.title || selectedTplId}
                    </span>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No template selected — load and pick one above</p>
                )}
              </div>

              <Button
                className="w-full gap-2 bg-[#7d2ae8] hover:bg-[#6b24c6] text-white border-0"
                disabled={!canvaConnected || !selectedTplId || !posterForm.packageName || generating}
                onClick={generatePoster}>
                {generating
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</>
                  : '🎨 Generate Poster in Canva'}
              </Button>

              {generating && (
                <p className="text-xs text-center text-muted-foreground animate-pulse">
                  Canva is creating your poster — this takes 5–20 seconds…
                </p>
              )}

              {generateError && (
                <div className="rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 px-3 py-2">
                  <p className="text-xs text-rose-700 dark:text-rose-400 font-medium">Generation failed</p>
                  <p className="text-[10px] text-rose-600 dark:text-rose-500 mt-0.5">{generateError}</p>
                </div>
              )}

              {generatedResult && (
                <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 p-4 space-y-3">
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> Poster created successfully!
                  </p>
                  <div className="flex flex-col gap-2">
                    {generatedResult.editUrl && (
                      <a href={generatedResult.editUrl} target="_blank" rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 rounded-lg bg-[#7d2ae8] text-white text-xs font-semibold py-2 px-4 hover:bg-[#6b24c6] transition-colors">
                        ✏️ Open & Edit in Canva
                      </a>
                    )}
                    {generatedResult.viewUrl && (
                      <a href={generatedResult.viewUrl} target="_blank" rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 rounded-lg border border-border text-foreground text-xs font-semibold py-2 px-4 hover:bg-muted transition-colors">
                        👁 View Poster
                      </a>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground">Download as PNG/PDF directly from Canva after editing.</p>
                </div>
              )}

              {!canvaConnected && (
                <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg px-3 py-2">
                  Connect your Canva account above to enable poster generation.
                </p>
              )}

              <div className="border-t border-border pt-3 space-y-1">
                <p className="text-[10px] font-semibold text-muted-foreground">How it works</p>
                <ol className="text-[10px] text-muted-foreground space-y-0.5 list-decimal list-inside">
                  <li>Create a brand template in Canva with data fields (e.g. packageName, destination, price)</li>
                  <li>Load your templates above and select one</li>
                  <li>Fill in the package details on the left</li>
                  <li>Click Generate — Canva autofills and gives you an edit link</li>
                </ol>
              </div>
            </div>
          </div>
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

  // file_url stores newline-separated poster URLs — parse into gallery list
  const allImages = (asset.file_url || '').split('\n').filter(Boolean)
    .map((url, i) => ({ url, name: asset.title || `Poster ${i + 1}` }));
  const nonImageAtts = [];

  const SHOW = 4; // max visible in grid before "+N more"

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
      {/* ── Image gallery ── */}
      {allImages.length === 0 ? (
        <div className="h-20 flex items-center justify-center">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(139,92,246,0.18)' }}>
            <Icon className="w-5 h-5" style={{ color: '#a78bfa' }} />
          </div>
        </div>
      ) : allImages.length === 1 ? (
        <div className="relative group/thumb cursor-zoom-in overflow-hidden bg-muted/30"
          style={{ minHeight: 160, maxHeight: 280 }}
          onClick={() => onView?.(allImages[0].url)}>
          <img src={allImages[0].url} alt={allImages[0].name || 'poster'}
            className="w-full h-auto object-contain"
            onError={e => {
              e.target.style.display = 'none';
              // show fallback link when image fails
              const fb = e.target.parentElement?.querySelector('.img-fallback');
              if (fb) fb.style.display = 'flex';
            }} />
          {/* fallback shown when img fails */}
          <div className="img-fallback hidden absolute inset-0 flex-col items-center justify-center gap-2 bg-muted/40 p-4">
            <Paperclip className="w-8 h-8 text-muted-foreground" />
            <a href={allImages[0].url} target="_blank" rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="text-xs text-sky-600 hover:underline text-center break-all px-2">
              View / Download file
            </a>
          </div>
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center gap-3 transition-opacity">
            <Expand className="w-7 h-7 text-white drop-shadow" />
            <a href={allImages[0].url} target="_blank" rel="noopener noreferrer"
              className="text-white hover:text-white/80" onClick={e => e.stopPropagation()} title="Download">
              <Download className="w-6 h-6 drop-shadow" />
            </a>
          </div>
        </div>
      ) : (
        <div className={cn("grid gap-0.5", allImages.length === 2 ? "grid-cols-2" : "grid-cols-3")}>
          {allImages.slice(0, SHOW).map((img, i) => (
            <div key={i}
              className={cn("relative overflow-hidden cursor-zoom-in group/g bg-muted/30",
                allImages.length === 2 ? "aspect-square" : i === 0 && allImages.length === 3 ? "col-span-2 aspect-video" : "aspect-square"
              )}
              onClick={() => onView?.(img.url)}>
              <img src={img.url} alt={img.name}
                className="w-full h-full object-cover transition-transform group-hover/g:scale-105"
                onError={e => { e.target.style.display = 'none'; }} />
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/g:opacity-100 transition-opacity flex items-center justify-center">
                <Expand className="w-5 h-5 text-white drop-shadow" />
              </div>
              {/* +N overlay on last visible cell if there are more */}
              {i === SHOW - 1 && allImages.length > SHOW && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <span className="text-white font-bold text-xl">+{allImages.length - SHOW}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="p-3">
        <div className="flex items-start justify-between mb-1.5">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground text-xs truncate">{asset.title}</p>
            {pkgName && <p className="text-[10px] text-muted-foreground truncate">{pkgName}</p>}
            {allImages.length > 1 && (
              <p className="text-[10px] text-muted-foreground">{allImages.length} posters</p>
            )}
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
        {/* Non-image file attachments */}
        {nonImageAtts.length > 0 && (
          <div className="mb-2 flex gap-1 flex-wrap">
            {nonImageAtts.map((att, idx) => (
              <a key={idx} href={att.url} target="_blank" rel="noopener noreferrer" title={att.name}
                className="flex items-center gap-1 px-2 py-1 rounded border border-border bg-muted/40 hover:bg-muted text-[10px] text-muted-foreground max-w-[90px] truncate">
                <Paperclip className="w-2.5 h-2.5 flex-shrink-0" />
                <span className="truncate">{att.name || 'File'}</span>
              </a>
            ))}
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
            <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/25" onClick={() => setConfirmDel(true)}>
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}