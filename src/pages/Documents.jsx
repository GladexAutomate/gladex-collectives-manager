// @ts-nocheck
import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, FileText, Upload, CheckCircle, AlertTriangle, Clock, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

const statusConfig = {
  missing: { label: 'Missing', class: 'bg-rose-100 text-rose-700', icon: AlertTriangle },
  submitted: { label: 'Submitted', class: 'bg-sky-100 text-sky-700', icon: Clock },
  verified: { label: 'Verified', class: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
  expired: { label: 'Expired', class: 'bg-amber-100 text-amber-700', icon: AlertTriangle },
  rejected: { label: 'Rejected', class: 'bg-rose-100 text-rose-700', icon: AlertTriangle },
};

const docTypeLabels = {
  passport: '🛂 Passport',
  visa: '📋 Visa',
  travel_insurance: '🛡️ Travel Insurance',
  booking_confirmation: '✅ Booking Confirmation',
  itinerary: '📅 Itinerary',
  voucher: '🎟️ Voucher',
  contract: '📝 Contract',
  invoice: '💳 Invoice',
  receipt: '🧾 Receipt',
  other: '📎 Other',
};

export default function Documents() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);

  const loadDocs = () => {
    base44.entities.Document.list('-created_date').then(data => {
      setDocuments(Array.isArray(data) ? data : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { loadDocs(); }, []);

  const handleSave = async () => {
    setSaving(true);
    await base44.entities.Document.create(formData);
    setSaving(false);
    setShowModal(false);
    loadDocs();
  };

  const updateStatus = async (doc, newStatus) => {
    await base44.entities.Document.update(doc.id, { status: newStatus });
    loadDocs();
  };

  const filtered = documents.filter(d => {
    const matchSearch = !search || d.client_name?.toLowerCase().includes(search.toLowerCase()) || d.file_name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || d.status === statusFilter;
    const matchType = typeFilter === 'all' || d.document_type === typeFilter;
    return matchSearch && matchStatus && matchType;
  });

  const statsData = [
    { label: 'Total Docs', value: documents.length, color: 'text-foreground' },
    { label: 'Verified', value: documents.filter(d => d.status === 'verified').length, color: 'text-emerald-600' },
    { label: 'Submitted', value: documents.filter(d => d.status === 'submitted').length, color: 'text-sky-600' },
    { label: 'Missing', value: documents.filter(d => d.status === 'missing').length, color: 'text-rose-600' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-jakarta text-foreground">Documentation & Visa</h2>
          <p className="text-sm text-muted-foreground">Manage passports, visas, and travel documents</p>
        </div>
        <Button onClick={() => { setFormData({ status: 'missing', document_type: 'passport' }); setShowModal(true); }} className="gradient-gold text-white border-0 gap-2">
          <Plus className="w-4 h-4" /> Add Document
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statsData.map((s, i) => (
          <div key={i} className="bg-card rounded-xl border border-border p-4">
            <p className={cn("text-2xl font-bold font-jakarta", s.color)}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by client or filename..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {Object.entries(statusConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Doc Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {Object.entries(docTypeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Document Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-32 bg-card rounded-xl border animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold text-foreground mb-2">No documents found</h3>
          <Button onClick={() => { setFormData({ status: 'missing', document_type: 'passport' }); setShowModal(true); }} className="gradient-gold text-white border-0">
            <Plus className="w-4 h-4 mr-2" /> Add Document
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(doc => {
            const StatusIcon = statusConfig[doc.status]?.icon || FileText;
            return (
              <div key={doc.id} className="bg-card rounded-xl border border-border p-4 shadow-sm card-hover">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground mb-1">{docTypeLabels[doc.document_type] || doc.document_type}</p>
                    <p className="font-semibold text-foreground text-sm">{doc.client_name}</p>
                    {doc.file_name && <p className="text-xs text-muted-foreground truncate">{doc.file_name}</p>}
                  </div>
                  <Badge className={cn("text-[10px] gap-1 flex-shrink-0 ml-2", statusConfig[doc.status]?.class)}>
                    <StatusIcon className="w-3 h-3" />
                    {statusConfig[doc.status]?.label}
                  </Badge>
                </div>
                {doc.expiry_date && (
                  <p className="text-xs text-muted-foreground mb-2">
                    Expires: {new Date(doc.expiry_date).toLocaleDateString()}
                  </p>
                )}
                {doc.notes && <p className="text-xs text-muted-foreground italic mb-3 line-clamp-2">{doc.notes}</p>}
                <div className="flex gap-2 pt-2 border-t border-border">
                  {doc.status !== 'verified' && (
                    <Button size="sm" variant="outline" className="h-6 text-[10px] gap-1 text-emerald-600 border-emerald-200" onClick={() => updateStatus(doc, 'verified')}>
                      <CheckCircle className="w-3 h-3" /> Verify
                    </Button>
                  )}
                  {doc.file_url && (
                    <Button size="sm" variant="outline" className="h-6 text-[10px]" asChild>
                      <a href={doc.file_url} target="_blank" rel="noopener noreferrer">View</a>
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-jakarta">Add Document</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-1.5">
              <Label>Client Name *</Label>
              <Input value={formData.client_name || ''} onChange={e => setFormData({...formData, client_name: e.target.value})} />
            </div>
            <div className="space-y-1.5">
              <Label>Document Type</Label>
              <Select value={formData.document_type} onValueChange={v => setFormData({...formData, document_type: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(docTypeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={v => setFormData({...formData, status: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(statusConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Expiry Date</Label>
              <Input type="date" value={formData.expiry_date || ''} onChange={e => setFormData({...formData, expiry_date: e.target.value})} />
            </div>
            <div className="space-y-1.5">
              <Label>File URL (upload link)</Label>
              <Input placeholder="https://..." value={formData.file_url || ''} onChange={e => setFormData({...formData, file_url: e.target.value})} />
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Input value={formData.notes || ''} onChange={e => setFormData({...formData, notes: e.target.value})} />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="gradient-gold text-white border-0">
              {saving ? 'Saving...' : 'Add Document'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}