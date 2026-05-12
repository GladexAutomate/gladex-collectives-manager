import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, Image, Film, Mail, Globe, Facebook, Instagram, Search, Eye, Edit } from 'lucide-react';
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

export default function Marketing() {
  const [assets, setAssets] = useState([]);
  const [collectives, setCollectives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);

  const loadData = () => {
    Promise.all([
      base44.entities.MarketingAsset.list('-created_date'),
      base44.entities.Collective.list(),
    ]).then(([a, c]) => {
      setAssets(a);
      setCollectives(c);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

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

  const statsData = [
    { label: 'Total Assets', value: assets.length },
    { label: 'Published', value: assets.filter(a => a.status === 'published').length },
    { label: 'Pending Approval', value: assets.filter(a => a.status === 'pending_approval').length },
    { label: 'Draft', value: assets.filter(a => a.status === 'draft').length },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-jakarta text-foreground">Marketing</h2>
          <p className="text-sm text-muted-foreground">Manage marketing assets, campaigns, and social media</p>
        </div>
        <Button onClick={openAdd} className="gradient-gold text-white border-0 gap-2">
          <Plus className="w-4 h-4" /> Add Asset
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statsData.map((s, i) => (
          <div key={i} className="bg-card rounded-xl border border-border p-4 text-center">
            <p className="text-2xl font-bold font-jakarta text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </div>

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
                {/* Preview or icon */}
                {asset.file_url ? (
                  <div className="h-36 overflow-hidden bg-muted">
                    <img src={asset.file_url} alt={asset.title} className="w-full h-full object-cover" onError={e => e.target.style.display = 'none'} />
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
            <div className="space-y-1.5">
              <Label>File URL</Label>
              <Input placeholder="https://..." value={formData.file_url || ''} onChange={e => setFormData({...formData, file_url: e.target.value})} />
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