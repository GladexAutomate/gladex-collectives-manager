import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import {
  Globe, Users, DollarSign, TrendingUp, Plane, Clock,
  AlertTriangle, Star, BarChart3, Package, Calculator, Plus, ArrowRight
} from 'lucide-react';
import KPICard from '@/components/dashboard/KPICard';
import RecentActivity from '@/components/dashboard/RecentActivity';
import UpcomingDepartures from '@/components/dashboard/UpcomingDepartures';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Link } from 'react-router-dom';

const bookingTrend = [
  { month: 'Jan', bookings: 28, revenue: 420000 },
  { month: 'Feb', bookings: 35, revenue: 560000 },
  { month: 'Mar', bookings: 42, revenue: 680000 },
  { month: 'Apr', bookings: 38, revenue: 590000 },
  { month: 'May', bookings: 55, revenue: 890000 },
  { month: 'Jun', bookings: 62, revenue: 1020000 },
];

const destinationData = [
  { name: 'Japan', value: 35, color: '#f59e0b' },
  { name: 'Korea', value: 25, color: '#0ea5e9' },
  { name: 'Europe', value: 20, color: '#8b5cf6' },
  { name: 'Bali', value: 15, color: '#10b981' },
  { name: 'Others', value: 5, color: '#6b7280' },
];

export default function Dashboard() {
  const [collectives, setCollectives] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load only critical operational data — no checklist tasks on dashboard
    Promise.all([
      base44.entities.Collective.list('-updated_date', 50),
      base44.entities.Booking.list('-updated_date', 100),
      base44.entities.Payment.filter({ status: 'verified' }, '-payment_date', 100),
    ]).then(([c, b, p]) => {
      setCollectives(c);
      setBookings(b);
      setPayments(p);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const activeCollectives = collectives.filter(c => ['active', 'confirmed_departure', 'ongoing'].includes(c.status)).length;
  // Payments are already pre-filtered to verified only
  const totalRevenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const pendingPayments = bookings.filter(b => !b.full_payment_paid && b.status !== 'cancelled').length;
  const upcomingDepartures = collectives.filter(c => c.departure_date && new Date(c.departure_date) >= new Date()).length;
  const visaPending = bookings.filter(b => b.visa_status === 'pending').length;
  const totalPax = bookings.reduce((sum, b) => sum + (b.pax_count || 1), 0);

  const formatCurrency = (val) => {
    if (val >= 1000000) return `₱${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `₱${(val / 1000).toFixed(0)}K`;
    return `₱${val}`;
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="rounded-2xl overflow-hidden bg-gradient-to-r from-[#1e293b] via-[#0f2444] to-[#1a1a2e] p-6 text-white relative">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-400 rounded-full -translate-y-32 translate-x-32" />
          <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-sky-400 rounded-full translate-y-24" />
        </div>
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold font-jakarta mb-1">Welcome back! 👋</h2>
            <p className="text-blue-200 text-sm">GLADEX Group Collectives Master Checklist System</p>
            <p className="text-blue-300 text-xs mt-1">Today is {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <div className="text-center">
              <p className="text-3xl font-bold text-amber-400">{activeCollectives}</p>
              <p className="text-xs text-blue-200">Active Collectives</p>
            </div>
            <div className="w-px h-12 bg-white/20" />
            <div className="text-center">
              <p className="text-3xl font-bold text-sky-400">{upcomingDepartures}</p>
              <p className="text-xs text-blue-200">Upcoming Flights</p>
            </div>
            <div className="w-px h-12 bg-white/20" />
            <div className="text-center">
              <p className="text-3xl font-bold text-emerald-400">{upcomingDepartures}</p>
              <p className="text-xs text-blue-200">Upcoming Trips</p>
            </div>
          </div>
        </div>
      </div>

      {/* Product Development Quick Access (BRD 4.1) */}
      <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-amber-500" />
            <span className="font-semibold text-sm font-jakarta text-foreground">Product Development</span>
          </div>
          <Link to="/product-development" className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-amber-600 transition-colors">
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Link to="/product-development" className="flex flex-col items-center gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-950/40 transition-colors group">
            <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center">
              <Plus className="w-4 h-4 text-white" />
            </div>
            <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 text-center">Create Package</span>
          </Link>
          <Link to="/collectives" className="flex flex-col items-center gap-2 p-3 rounded-lg bg-sky-50 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-800 hover:bg-sky-100 dark:hover:bg-sky-950/40 transition-colors group">
            <div className="w-8 h-8 rounded-lg bg-sky-500 flex items-center justify-center">
              <Globe className="w-4 h-4 text-white" />
            </div>
            <span className="text-[10px] font-semibold text-sky-700 dark:text-sky-400 text-center">Collectives</span>
          </Link>
          <Link to="/product-development?tab=ezquote" className="flex flex-col items-center gap-2 p-3 rounded-lg bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-950/40 transition-colors group">
            <div className="w-8 h-8 rounded-lg bg-purple-500 flex items-center justify-center">
              <Calculator className="w-4 h-4 text-white" />
            </div>
            <span className="text-[10px] font-semibold text-purple-700 dark:text-purple-400 text-center">EZQuote</span>
          </Link>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        <KPICard title="Active Collectives" value={activeCollectives} subtitle={`${collectives.length} total`} icon={Globe} color="gold" trend={12} trendLabel="this month" />
        <KPICard title="Total Revenue" value={formatCurrency(totalRevenue)} subtitle="Verified payments" icon={DollarSign} color="green" trend={8} trendLabel="vs last month" />
        <KPICard title="Booked Pax" value={totalPax} subtitle={`${bookings.length} bookings`} icon={Users} color="sky" trend={15} trendLabel="this month" />
        <KPICard title="Pending Payments" value={pendingPayments} subtitle="Need follow-up" icon={Clock} color="rose" />
        <KPICard title="Visa Pending" value={visaPending} subtitle="Clients awaiting" icon={AlertTriangle} color="purple" />
        <KPICard title="Departures" value={upcomingDepartures} subtitle="Upcoming trips" icon={Plane} color="sky" />
        <KPICard title="Commission" value={formatCurrency(totalRevenue * 0.12)} subtitle="Estimated" icon={TrendingUp} color="gold" />
        <KPICard title="Satisfaction" value="4.7★" subtitle="Avg client rating" icon={Star} color="gold" trend={3} trendLabel="vs last month" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Booking Trend */}
        <div className="lg:col-span-2 bg-card rounded-xl border border-border p-5 shadow-sm">
          <h3 className="font-semibold font-jakarta text-foreground mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" /> Booking & Revenue Trends
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={bookingTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip
                contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
              />
              <Bar dataKey="bookings" fill="#f59e0b" radius={[4,4,0,0]} name="Bookings" />
              <Bar dataKey="revenue" fill="#0ea5e9" radius={[4,4,0,0]} name="Revenue" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Destination Distribution */}
        <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
          <h3 className="font-semibold font-jakarta text-foreground mb-4 flex items-center gap-2">
            <Globe className="w-4 h-4 text-primary" /> Top Destinations
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={destinationData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                {destinationData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1 mt-2">
            {destinationData.map((d, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                  <span className="text-muted-foreground">{d.name}</span>
                </div>
                <span className="font-medium text-foreground">{d.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UpcomingDepartures collectives={collectives} />
        <RecentActivity />
      </div>
    </div>
  );
}