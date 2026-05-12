import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { BarChart3, TrendingUp, Download, DollarSign, Users, Globe, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

export default function Reports() {
  const [collectives, setCollectives] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [payments, setPayments] = useState([]);
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.Collective.list(),
      base44.entities.Booking.list(),
      base44.entities.Payment.list(),
      base44.entities.Survey.list(),
    ]).then(([c, b, p, s]) => {
      setCollectives(c);
      setBookings(b);
      setPayments(p);
      setSurveys(s);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const totalRevenue = payments.filter(p => p.status === 'verified').reduce((sum, p) => sum + (p.amount || 0), 0);
  const formatCurrency = (val) => `₱${Number(val).toLocaleString()}`;

  const statusBreakdown = ['draft', 'active', 'launched', 'ongoing', 'completed', 'cancelled'].map(s => ({
    name: s.charAt(0).toUpperCase() + s.slice(1),
    value: collectives.filter(c => c.status === s).length,
  })).filter(d => d.value > 0);

  const bookingBySource = ['direct', 'sub_agent', 'online', 'referral', 'walk_in'].map(s => ({
    name: s.replace('_', ' '),
    value: bookings.filter(b => b.source === s).length,
  })).filter(d => d.value > 0);

  const COLORS = ['#f59e0b', '#0ea5e9', '#10b981', '#8b5cf6', '#f43f5e', '#6b7280'];

  const paymentMonthly = payments.filter(p => p.status === 'verified').reduce((acc, p) => {
    if (!p.payment_date) return acc;
    const month = new Date(p.payment_date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    acc[month] = (acc[month] || 0) + p.amount;
    return acc;
  }, {});
  const revenueData = Object.entries(paymentMonthly).map(([month, revenue]) => ({ month, revenue })).slice(-6);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-jakarta text-foreground">Reports & Analytics</h2>
          <p className="text-sm text-muted-foreground">Business intelligence and performance reports</p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="w-4 h-4" /> Export
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-emerald-500" />
            <span className="text-xs text-muted-foreground">Total Revenue</span>
          </div>
          <p className="text-xl font-bold font-jakarta text-emerald-600">{formatCurrency(totalRevenue)}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-2">
            <Globe className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground">Total Collectives</span>
          </div>
          <p className="text-xl font-bold font-jakarta text-foreground">{collectives.length}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-sky-500" />
            <span className="text-xs text-muted-foreground">Total Bookings</span>
          </div>
          <p className="text-xl font-bold font-jakarta text-foreground">{bookings.length}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-2">
            <Star className="w-4 h-4 text-amber-500" />
            <span className="text-xs text-muted-foreground">Avg Satisfaction</span>
          </div>
          <p className="text-xl font-bold font-jakarta text-amber-500">
            {surveys.length ? (surveys.reduce((sum, s) => sum + (s.overall_rating || 0), 0) / surveys.length).toFixed(1) : '—'}/5
          </p>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
        <h3 className="font-semibold font-jakarta text-foreground mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" /> Monthly Revenue Trend
        </h3>
        {revenueData.length > 0 ? (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => `₱${(v/1000).toFixed(0)}K`} />
              <Tooltip
                contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                formatter={(v) => [`₱${Number(v).toLocaleString()}`, 'Revenue']}
              />
              <Bar dataKey="revenue" fill="#f59e0b" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
            No revenue data yet
          </div>
        )}
      </div>

      {/* Pie Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
          <h3 className="font-semibold font-jakarta text-foreground mb-4">Collectives by Status</h3>
          {statusBreakdown.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={statusBreakdown} cx="50%" cy="50%" outerRadius={70} dataKey="value">
                    {statusBreakdown.map((entry, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-1 mt-2">
                {statusBreakdown.map((d, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="text-muted-foreground">{d.name}: <span className="font-medium text-foreground">{d.value}</span></span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">No data</div>
          )}
        </div>

        <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
          <h3 className="font-semibold font-jakarta text-foreground mb-4">Bookings by Source</h3>
          {bookingBySource.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={bookingBySource} cx="50%" cy="50%" outerRadius={70} dataKey="value">
                    {bookingBySource.map((entry, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-1 mt-2">
                {bookingBySource.map((d, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs capitalize">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="text-muted-foreground">{d.name}: <span className="font-medium text-foreground">{d.value}</span></span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">No data</div>
          )}
        </div>
      </div>

      {/* Performance Table */}
      <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
        <h3 className="font-semibold font-jakarta text-foreground mb-4">Collective Performance Summary</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs font-semibold text-muted-foreground pb-2">Collective</th>
                <th className="text-left text-xs font-semibold text-muted-foreground pb-2">Destination</th>
                <th className="text-left text-xs font-semibold text-muted-foreground pb-2">Pax</th>
                <th className="text-left text-xs font-semibold text-muted-foreground pb-2">Revenue</th>
                <th className="text-left text-xs font-semibold text-muted-foreground pb-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {collectives.slice(0, 10).map(c => (
                <tr key={c.id} className="hover:bg-muted/20">
                  <td className="py-2 text-sm font-medium text-foreground">{c.name}</td>
                  <td className="py-2 text-xs text-muted-foreground">{c.destination}</td>
                  <td className="py-2 text-xs text-foreground">{c.booked_pax || 0}/{c.total_slots || 0}</td>
                  <td className="py-2 text-xs font-medium text-emerald-600">{c.total_revenue ? formatCurrency(c.total_revenue) : '—'}</td>
                  <td className="py-2">
                    <span className="text-xs capitalize bg-muted text-muted-foreground px-2 py-0.5 rounded">{c.status}</span>
                  </td>
                </tr>
              ))}
              {collectives.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-sm text-muted-foreground">No collectives yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}