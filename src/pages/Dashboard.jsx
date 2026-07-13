// @ts-nocheck
import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import {
  Users, DollarSign, TrendingUp, Plane, Clock, AlertTriangle, Globe,
  Plus, Package, UserPlus, FileText, CreditCard, BarChart2,
  Calendar, ChevronDown, ArrowUpRight
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

// ── Static chart data ──────────────────────────────────────────────────────────
const trendData = [
  { date: 'Jun 5',  revenue: 320000, bookings: 18 },
  { date: 'Jun 12', revenue: 480000, bookings: 27 },
  { date: 'Jun 19', revenue: 560000, bookings: 32 },
  { date: 'Jun 26', revenue: 490000, bookings: 28 },
  { date: 'Jul 3',  revenue: 720000, bookings: 41 },
  { date: 'Jul 10', revenue: 880000, bookings: 52 },
];

const destinationData = [
  { name: 'Japan',     value: 28, color: '#f59e0b' },
  { name: 'Singapore', value: 24, color: '#0ea5e9' },
  { name: 'Korea',     value: 18, color: '#ec4899' },
  { name: 'USA',       value: 15, color: '#8b5cf6' },
  { name: 'Europe',    value: 10, color: '#10b981' },
  { name: 'Others',    value:  5, color: '#6b7280' },
];

const revenueBreakdown = [
  { name: 'Packages',       value: 48, color: '#8b5cf6' },
  { name: 'Visa Services',  value: 20, color: '#0ea5e9' },
  { name: 'Flight Bookings',value: 16, color: '#f59e0b' },
  { name: 'Hotel Bookings', value: 11, color: '#10b981' },
  { name: 'Others',         value:  5, color: '#6b7280' },
];

const mockBookings = [
  { id: 'BKG-2026-001', client: 'Maria Santos',    avatar: 'MS', destination: 'Tokyo, Japan',   date: 'Jul 12, 2026', amount: '₱78,500',  status: 'confirmed' },
  { id: 'BKG-2026-002', client: 'Juan Dela Cruz',  avatar: 'JD', destination: 'Seoul, Korea',   date: 'Jul 14, 2026', amount: '₱65,200',  status: 'pending' },
  { id: 'BKG-2026-003', client: 'Ana Reyes',       avatar: 'AR', destination: 'Singapore',      date: 'Jul 16, 2026', amount: '₱42,800',  status: 'confirmed' },
  { id: 'BKG-2026-004', client: 'Mark Villanueva', avatar: 'MV', destination: 'Osaka, Japan',   date: 'Jul 18, 2026', amount: '₱88,900',  status: 'pending' },
  { id: 'BKG-2026-005', client: 'Lisa Gomez',      avatar: 'LG', destination: 'Europe Tour',    date: 'Jul 20, 2026', amount: '₱120,000', status: 'confirmed' },
];

const upcomingActivities = [
  { day: '12', month: 'JUL', title: 'Flight to Tokyo',     sub: 'Collective: Japan Group',   time: '08:30 AM', icon: Plane },
  { day: '14', month: 'JUL', title: 'Visa Interview',      sub: 'Client: Juan Dela Cruz',    time: '10:00 AM', icon: FileText },
  { day: '16', month: 'JUL', title: 'Payment Follow-up',  sub: '4 pending payments',         time: '02:00 PM', icon: CreditCard },
  { day: '18', month: 'JUL', title: 'Hotel Check-in',      sub: 'Seoul Group',               time: '03:00 PM', icon: Package },
  { day: '20', month: 'JUL', title: 'Group Departure',     sub: 'Singapore Group',           time: '09:00 AM', icon: Plane },
];

const quickActions = [
  { label: 'Create Package', icon: Package,   path: '/product-development', color: '#8b5cf6' },
  { label: 'Add Collective', icon: Globe,     path: '/collectives',          color: '#8b5cf6' },
  { label: 'New Booking',    icon: Plus,      path: '/sales',                color: '#8b5cf6' },
  { label: 'Add Client',     icon: UserPlus,  path: '/admin-operations',     color: '#8b5cf6' },
  { label: 'Record Payment', icon: DollarSign,path: '/accounting',           color: '#8b5cf6' },
  { label: 'Generate Report',icon: BarChart2, path: '/reports',              color: '#8b5cf6' },
];

// ── Helpers ────────────────────────────────────────────────────────────────────
function fmt(val) {
  if (val >= 1000000) return `₱${(val / 1000000).toFixed(1)}M`;
  if (val >= 1000)    return `₱${(val / 1000).toFixed(0)}K`;
  return `₱${val}`;
}

// ── Stat Card ──────────────────────────────────────────────────────────────────
function StatCard({ title, value, sub, icon: Icon, trend }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 flex items-start justify-between gap-3">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">{title}</p>
        <p className="text-2xl font-black text-foreground font-jakarta leading-none mb-1">{value}</p>
        {trend != null && (
          <p className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1.5">
            <ArrowUpRight className="w-3 h-3" /> +{trend}% vs last month
          </p>
        )}
        {sub && !trend && <p className="text-[11px] text-muted-foreground mt-1">{sub}</p>}
      </div>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: 'rgba(139,92,246,0.18)' }}>
        <Icon className="w-5 h-5" style={{ color: '#a78bfa' }} />
      </div>
    </div>
  );
}

// ── Main ────────────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [collectives, setCollectives] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    Promise.all([
      base44.entities.Collective.list('-updated_date', 50),
      base44.entities.Booking.list('-updated_date', 100),
      base44.entities.Payment.filter({ status: 'verified' }, '-payment_date', 100),
    ]).then(([c, b, p]) => {
      setCollectives(Array.isArray(c) ? c : []);
      setBookings(Array.isArray(b) ? b : []);
      setPayments(Array.isArray(p) ? p : []);
    }).catch(() => {});
  }, []);

  const activeCollectives = collectives.filter(c => ['active', 'confirmed_departure', 'ongoing'].includes(c.status)).length;
  const totalRevenue      = payments.reduce((s, p) => s + (p.amount || 0), 0);
  const pendingPayments   = bookings.filter(b => !b.full_payment_paid && b.status !== 'cancelled').length;
  const upcomingDep       = collectives.filter(c => c.departure_date && new Date(c.departure_date) >= new Date()).length;
  const visaPending       = bookings.filter(b => b.visa_status === 'pending').length;
  const totalPax          = bookings.reduce((s, b) => s + (b.pax_count || 1), 0);

  const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  const PURPLE = '#8b5cf6';
  const tooltipStyle = {
    background: 'hsl(var(--card))',
    border: '1px solid hsl(var(--border))',
    borderRadius: '10px',
    fontSize: '12px',
    color: 'hsl(var(--foreground))',
  };

  return (
    <div className="space-y-5 pb-8">

      {/* ── Performance Banner ── */}
      <div className="rounded-2xl overflow-hidden relative"
        style={{ background: 'linear-gradient(135deg, hsl(236,30%,10%) 0%, hsl(260,35%,13%) 60%, hsl(270,40%,15%) 100%)' }}>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute right-12 top-0 bottom-0 flex items-center opacity-30">
            {[40,60,80,55,90,70,100].map((h, i) => (
              <div key={i} className="w-5 mx-0.5 rounded-t-sm" style={{ height: h, background: `rgba(139,92,246,${0.4 + i * 0.08})` }} />
            ))}
          </div>
          <TrendingUp className="absolute right-6 top-4 w-16 h-16 opacity-10" style={{ color: PURPLE }} />
        </div>
        <div className="relative z-10 px-6 py-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(139,92,246,0.25)' }}>
              <TrendingUp className="w-5 h-5" style={{ color: '#a78bfa' }} />
            </div>
            <div>
              <p className="text-base font-bold text-white">You are doing great! ✨</p>
              <p className="text-sm text-purple-200 mt-0.5">Your platform performance is up 12% this month.</p>
            </div>
          </div>
          <div className="flex-shrink-0 flex items-center gap-2 text-xs text-purple-200 bg-white/10 px-3 py-1.5 rounded-lg border border-white/10">
            <Calendar className="w-3.5 h-3.5" />
            <span className="font-medium">{today}</span>
            <ChevronDown className="w-3.5 h-3.5 opacity-60" />
          </div>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        <StatCard title="Active Collectives" value={activeCollectives || 24}  sub={`${collectives.length} total`} icon={Globe}         trend={12} />
        <StatCard title="Total Revenue"      value={totalRevenue ? fmt(totalRevenue) : '₱482K'} sub="Verified payments"  icon={DollarSign}   trend={8} />
        <StatCard title="Booked Pax"         value={totalPax || 1248}         sub={`${bookings.length} bookings`}        icon={Users}         trend={15} />
        <StatCard title="Pending Payments"   value={pendingPayments || 12}    sub="Needs follow-up"  icon={Clock} />
        <StatCard title="Visa Pending"       value={visaPending || 7}         sub="Clients awaiting" icon={AlertTriangle} />
      </div>

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Booking & Revenue Trends */}
        <div className="lg:col-span-2 bg-card rounded-2xl border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm text-foreground font-jakarta">Booking & Revenue Trends</h3>
              <div className="flex items-center gap-3 mt-1">
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <span className="w-2 h-2 rounded-full" style={{ background: PURPLE }} /> Revenue (₱)
                </span>
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <span className="w-2 h-2 rounded-full bg-sky-400" /> Bookings
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/60 px-3 py-1 rounded-lg border border-border">
              Last 30 Days <ChevronDown className="w-3 h-3" />
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={trendData} barGap={4}>
              <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#6d28d9" stopOpacity={0.6} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(139,92,246,0.07)' }} />
              <Bar dataKey="revenue" fill="url(#barGrad)" radius={[6,6,0,0]} name="Revenue (₱)" />
              <Line type="monotone" dataKey="bookings" stroke="#38bdf8" strokeWidth={2.5} dot={{ r: 3, fill: '#38bdf8' }} name="Bookings" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Destinations */}
        <div className="bg-card rounded-2xl border border-border p-5">
          <h3 className="font-bold text-sm text-foreground font-jakarta mb-1 flex items-center gap-1.5">
            <Globe className="w-4 h-4" style={{ color: PURPLE }} /> Top Destinations
          </h3>
          <div className="flex items-center justify-center py-2">
            <div className="relative">
              <ResponsiveContainer width={160} height={160}>
                <PieChart>
                  <Pie data={destinationData} cx="50%" cy="50%" innerRadius={46} outerRadius={72} paddingAngle={2} dataKey="value">
                    {destinationData.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <p className="text-[10px] text-muted-foreground">Total</p>
                <p className="text-base font-black text-foreground">1,248</p>
              </div>
            </div>
          </div>
          <div className="space-y-1.5 mt-1">
            {destinationData.map((d, i) => (
              <div key={i} className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.color }} />
                  <span className="text-muted-foreground">{d.name}</span>
                </div>
                <span className="font-semibold text-foreground">{d.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Upcoming Activities ─ Recent Bookings ─ Revenue Breakdown ─ Quick Actions ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Recent Bookings (left 2/3 in the bottom) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-card rounded-2xl border border-border p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm text-foreground font-jakarta">Recent Bookings</h3>
              <Link to="/sales" className="text-xs font-semibold px-3 py-1 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                style={{ color: '#a78bfa' }}>View All</Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-muted-foreground border-b border-border">
                    <th className="text-left pb-2 font-medium">Booking ID</th>
                    <th className="text-left pb-2 font-medium">Client</th>
                    <th className="text-left pb-2 font-medium">Destination</th>
                    <th className="text-left pb-2 font-medium">Date</th>
                    <th className="text-right pb-2 font-medium">Amount</th>
                    <th className="text-right pb-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {mockBookings.map((b) => (
                    <tr key={b.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-2.5 text-muted-foreground font-mono">{b.id}</td>
                      <td className="py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0"
                            style={{ background: PURPLE }}>{b.avatar}</div>
                          <span className="font-medium text-foreground">{b.client}</span>
                        </div>
                      </td>
                      <td className="py-2.5 text-muted-foreground">{b.destination}</td>
                      <td className="py-2.5 text-muted-foreground">{b.date}</td>
                      <td className="py-2.5 text-right font-semibold text-foreground">{b.amount}</td>
                      <td className="py-2.5 text-right">
                        <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-semibold",
                          b.status === 'confirmed'
                            ? 'bg-emerald-900/50 text-emerald-300'
                            : 'bg-amber-900/40 text-amber-300'
                        )}>
                          {b.status === 'confirmed' ? 'Confirmed' : 'Pending'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Revenue Breakdown */}
          <div className="bg-card rounded-2xl border border-border p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm text-foreground font-jakarta">Revenue Breakdown</h3>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-lg border border-border">
                This Month <ChevronDown className="w-3 h-3" />
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="relative flex-shrink-0">
                <PieChart width={120} height={120}>
                  <Pie data={revenueBreakdown} cx="50%" cy="50%" innerRadius={35} outerRadius={56} paddingAngle={2} dataKey="value">
                    {revenueBreakdown.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                </PieChart>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <p className="text-[9px] text-muted-foreground">Total</p>
                  <p className="text-sm font-black text-foreground">{totalRevenue ? fmt(totalRevenue) : '₱482K'}</p>
                  <p className="text-[9px] text-emerald-400">↑ 12%</p>
                </div>
              </div>
              <div className="flex-1 space-y-2">
                {revenueBreakdown.map((d, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.color }} />
                      <span className="text-muted-foreground">{d.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-foreground">
                        {d.name === 'Packages' ? '₱232K' : d.name === 'Visa Services' ? '₱98K' : d.name === 'Flight Bookings' ? '₱76K' : d.name === 'Hotel Bookings' ? '₱54K' : '₱22K'}
                      </span>
                      <span className="text-muted-foreground w-6 text-right">{d.value}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Upcoming Activities */}
          <div className="bg-card rounded-2xl border border-border p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm text-foreground font-jakarta">Upcoming Activities</h3>
              <button className="text-xs font-semibold" style={{ color: '#a78bfa' }}>View All</button>
            </div>
            <div className="space-y-3">
              {upcomingActivities.map((a, i) => {
                const Icon = a.icon;
                return (
                  <div key={i} className="flex items-start gap-3">
                    <div className="flex-shrink-0 text-center w-9">
                      <p className="text-base font-black text-foreground leading-none">{a.day}</p>
                      <p className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: '#a78bfa' }}>{a.month}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">{a.title}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{a.sub}</p>
                    </div>
                    <div className="flex-shrink-0 flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Clock className="w-2.5 h-2.5" /> {a.time}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-card rounded-2xl border border-border p-5">
            <h3 className="font-bold text-sm text-foreground font-jakarta mb-4">Quick Actions</h3>
            <div className="grid grid-cols-3 gap-2">
              {quickActions.map((a, i) => {
                const Icon = a.icon;
                return (
                  <Link key={i} to={a.path}
                    className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl border border-border hover:bg-muted/40 transition-colors group">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{ background: 'rgba(139,92,246,0.15)' }}>
                      <Icon className="w-4 h-4" style={{ color: '#a78bfa' }} />
                    </div>
                    <span className="text-[10px] font-medium text-muted-foreground text-center leading-tight group-hover:text-foreground transition-colors">{a.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="flex items-center justify-between pt-2 text-[11px] text-muted-foreground border-t border-border">
        <span>© 2026 GLADEX Group. All rights reserved.</span>
        <div className="flex items-center gap-4">
          <button className="hover:text-foreground transition-colors">Privacy Policy</button>
          <button className="hover:text-foreground transition-colors">Terms of Service</button>
          <button className="hover:text-foreground transition-colors">Support</button>
        </div>
      </div>

    </div>
  );
}
