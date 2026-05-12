import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, Star, TrendingUp, BarChart3, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { cn } from '@/lib/utils';

const RATING_FIELDS = [
  { key: 'hotel_rating', label: 'Hotel Experience' },
  { key: 'tour_quality_rating', label: 'Tour Quality' },
  { key: 'flight_rating', label: 'Flight Experience' },
  { key: 'guide_rating', label: 'Tour Guide' },
  { key: 'transfer_rating', label: 'Transfers' },
  { key: 'optional_tours_rating', label: 'Optional Tours' },
  { key: 'overall_rating', label: 'Overall' },
];

function StarRating({ value, onChange, max = 5 }) {
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map(star => (
        <button key={star} type="button" onClick={() => onChange && onChange(star)}>
          <Star className={cn("w-6 h-6 transition-colors", star <= (value || 0) ? "text-amber-400 fill-amber-400" : "text-muted-foreground")} />
        </button>
      ))}
    </div>
  );
}

export default function Feedback() {
  const [surveys, setSurveys] = useState([]);
  const [collectives, setCollectives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);

  const loadData = () => {
    Promise.all([
      base44.entities.Survey.list('-created_date'),
      base44.entities.Collective.list(),
    ]).then(([s, c]) => {
      setSurveys(s);
      setCollectives(c);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const handleSave = async () => {
    setSaving(true);
    await base44.entities.Survey.create({ ...formData, submitted_at: new Date().toISOString() });
    setSaving(false);
    setShowModal(false);
    loadData();
  };

  const avgRating = (field) => {
    const vals = surveys.filter(s => s[field]).map(s => s[field]);
    if (!vals.length) return 0;
    return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1);
  };

  const radarData = RATING_FIELDS.map(f => ({
    subject: f.label,
    value: parseFloat(avgRating(f.key)) || 0,
  }));

  const npsData = surveys.reduce((acc, s) => {
    if (!s.nps_score) return acc;
    if (s.nps_score >= 9) acc.promoters++;
    else if (s.nps_score >= 7) acc.passives++;
    else acc.detractors++;
    return acc;
  }, { promoters: 0, passives: 0, detractors: 0 });

  const npsScore = surveys.length
    ? Math.round(((npsData.promoters - npsData.detractors) / surveys.length) * 100)
    : 0;

  const getCollectiveName = (id) => collectives.find(c => c.id === id)?.name || '—';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-jakarta text-foreground">Client Feedback</h2>
          <p className="text-sm text-muted-foreground">Post-trip surveys and satisfaction analytics</p>
        </div>
        <Button onClick={() => { setFormData({}); setShowModal(true); }} className="gradient-gold text-white border-0 gap-2">
          <Plus className="w-4 h-4" /> Record Feedback
        </Button>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground mb-1">Total Surveys</p>
          <p className="text-2xl font-bold font-jakarta text-foreground">{surveys.length}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground mb-1">Avg Overall Rating</p>
          <div className="flex items-center gap-2">
            <p className="text-2xl font-bold font-jakarta text-amber-500">{avgRating('overall_rating')}</p>
            <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground mb-1">NPS Score</p>
          <p className={cn("text-2xl font-bold font-jakarta", npsScore >= 50 ? 'text-emerald-600' : npsScore >= 0 ? 'text-amber-600' : 'text-rose-600')}>
            {npsScore}
          </p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground mb-1">Would Recommend</p>
          <p className="text-2xl font-bold font-jakarta text-emerald-600">
            {surveys.length ? Math.round((surveys.filter(s => s.would_recommend).length / surveys.length) * 100) : 0}%
          </p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
          <h3 className="font-semibold font-jakarta text-foreground mb-4">Satisfaction by Category</h3>
          <ResponsiveContainer width="100%" height={240}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="hsl(var(--border))" />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <Radar name="Rating" dataKey="value" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.3} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
          <h3 className="font-semibold font-jakarta text-foreground mb-4">Category Averages</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={radarData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
              <XAxis type="number" domain={[0, 5]} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis type="category" dataKey="subject" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} width={90} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
              <Bar dataKey="value" fill="#f59e0b" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Survey List */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-24 bg-card rounded-xl border animate-pulse" />)}
        </div>
      ) : surveys.length === 0 ? (
        <div className="text-center py-16">
          <Star className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold text-foreground mb-2">No feedback yet</h3>
          <p className="text-sm text-muted-foreground">Record your first client survey</p>
        </div>
      ) : (
        <div className="space-y-3">
          {surveys.map(s => (
            <div key={s.id} className="bg-card rounded-xl border border-border p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-foreground">{s.client_name}</p>
                  <p className="text-xs text-muted-foreground">{getCollectiveName(s.collective_id)}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span className="font-bold text-foreground">{s.overall_rating || '—'}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-3 mt-3">
                {RATING_FIELDS.slice(0, 6).map(f => (
                  <div key={f.key} className="text-center">
                    <p className="text-[10px] text-muted-foreground">{f.label}</p>
                    <p className="text-xs font-semibold text-foreground">{s[f.key] || '—'}/5</p>
                  </div>
                ))}
              </div>
              {s.suggestions && (
                <p className="text-xs text-muted-foreground italic mt-2 pt-2 border-t border-border">"{s.suggestions}"</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Feedback Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-jakarta">Record Client Feedback</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Client Name *</Label>
                <Input value={formData.client_name || ''} onChange={e => setFormData({...formData, client_name: e.target.value})} />
              </div>
              <div className="space-y-1.5">
                <Label>Collective</Label>
                <Select value={formData.collective_id || ''} onValueChange={v => setFormData({...formData, collective_id: v})}>
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    {collectives.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {RATING_FIELDS.map(f => (
              <div key={f.key} className="flex items-center justify-between">
                <Label className="text-sm">{f.label}</Label>
                <StarRating value={formData[f.key]} onChange={v => setFormData({...formData, [f.key]: v})} />
              </div>
            ))}

            <div className="space-y-1.5">
              <Label>NPS Score (0-10)</Label>
              <Input type="number" min="0" max="10" value={formData.nps_score || ''} onChange={e => setFormData({...formData, nps_score: Number(e.target.value)})} />
            </div>
            <div className="space-y-1.5">
              <Label>Would Recommend?</Label>
              <Select value={formData.would_recommend ? 'yes' : 'no'} onValueChange={v => setFormData({...formData, would_recommend: v === 'yes'})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Highlights</Label>
              <Textarea rows={2} placeholder="What did the client love?" value={formData.highlights || ''} onChange={e => setFormData({...formData, highlights: e.target.value})} />
            </div>
            <div className="space-y-1.5">
              <Label>Suggestions for Improvement</Label>
              <Textarea rows={2} value={formData.suggestions || ''} onChange={e => setFormData({...formData, suggestions: e.target.value})} />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="gradient-gold text-white border-0">
              {saving ? 'Saving...' : 'Submit Feedback'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}