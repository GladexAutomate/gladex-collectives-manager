import { Clock } from 'lucide-react';

const activities = [
  { action: 'New booking confirmed', detail: 'Japan Cherry Blossom 2026', user: 'Sales Team', time: '2 min ago', color: 'bg-emerald-500' },
  { action: 'Payment verified', detail: 'Bali Collective - PHP 45,000', user: 'Accounting', time: '15 min ago', color: 'bg-sky-500' },
  { action: 'Checklist updated', detail: 'Marketing Endorsement completed', user: 'Marketing', time: '1 hr ago', color: 'bg-amber-500' },
  { action: 'New collective added', detail: 'Korea Winter 2026', user: 'Product Dev', time: '3 hrs ago', color: 'bg-purple-500' },
  { action: 'Visa submitted', detail: 'Europe Grand Tour - 12 pax', user: 'Visa Team', time: '5 hrs ago', color: 'bg-rose-500' },
];

export default function RecentActivity() {
  return (
    <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold font-jakarta text-foreground">Recent Activity</h3>
        <Clock className="w-4 h-4 text-muted-foreground" />
      </div>
      <div className="space-y-4">
        {activities.map((a, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${a.color}`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">{a.action}</p>
              <p className="text-xs text-muted-foreground truncate">{a.detail}</p>
              <p className="text-xs text-muted-foreground">{a.user} · {a.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}