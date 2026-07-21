// @ts-nocheck
import { useState, useEffect, useContext } from 'react';
import { Bell, CheckCheck, AlertTriangle, CheckCircle2, CreditCard, Briefcase, Clock, Loader2, Trash2 } from 'lucide-react';
import { db } from '@/lib/db';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { EmployeeSessionContext } from '@/lib/employeeSessionContext';
import { SUPABASE_DEPT_TO_WORKFLOW, WORKFLOW_DEPT_LABELS } from '@/lib/notificationHelper';

const TYPE_CONFIG = {
  deadline:  { icon: Clock,         color: 'text-rose-500',    bg: 'bg-rose-50 dark:bg-rose-950/30',    label: 'Deadline' },
  approval:  { icon: CheckCircle2,  color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/30', label: 'Task Done' },
  payment:   { icon: CreditCard,    color: 'text-purple-500',  bg: 'bg-purple-50 dark:bg-purple-950/30', label: 'Payment' },
  reminder:  { icon: Bell,          color: 'text-amber-500',   bg: 'bg-amber-50 dark:bg-amber-950/30',  label: 'Reminder' },
  alert:     { icon: AlertTriangle, color: 'text-rose-500',    bg: 'bg-rose-50 dark:bg-rose-950/30',    label: 'Alert' },
  info:      { icon: Briefcase,     color: 'text-sky-500',     bg: 'bg-sky-50 dark:bg-sky-950/30',      label: 'Info' },
};

const TABS = [
  { key: 'all',      label: 'All' },
  { key: 'unread',   label: 'Unread' },
  { key: 'approval', label: 'Task Done' },
  { key: 'deadline', label: 'Deadline' },
  { key: 'alert',    label: 'Alert' },
];

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [activeTab, setActiveTab]         = useState('all');

  const empCtx    = useContext(EmployeeSessionContext);
  const empDept   = empCtx?.session?.department || null;
  const workflowKey = empDept ? (SUPABASE_DEPT_TO_WORKFLOW[empDept.toUpperCase().trim()] || null) : null;
  const isSuperAdmin = !empCtx;

  const load = async () => {
    setLoading(true);
    try {
      const data = await db.Notification.list('-created_date', 200);
      setNotifications(Array.isArray(data) ? data : []);
    } catch (e) {
      setNotifications([]);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // Dept filter
  const deptFiltered = notifications.filter(n => {
    if (isSuperAdmin) return true;
    if (!workflowKey) return !n.department;
    return !n.department || n.department === workflowKey;
  });

  const unreadCount = deptFiltered.filter(n => !n.is_read).length;

  const filtered = deptFiltered.filter(n => {
    if (activeTab === 'all')    return true;
    if (activeTab === 'unread') return !n.is_read;
    return n.type === activeTab;
  });

  const markRead = async (n) => {
    if (n.is_read) return;
    await db.Notification.update(n.id, { is_read: true });
    setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, is_read: true } : x));
  };

  const markAllRead = async () => {
    const unread = deptFiltered.filter(n => !n.is_read);
    await Promise.all(unread.map(n => db.Notification.update(n.id, { is_read: true })));
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const deleteNotif = async (n, e) => {
    e.stopPropagation();
    await db.Notification.delete(n.id);
    setNotifications(prev => prev.filter(x => x.id !== n.id));
  };

  return (
    <div className="space-y-5 pb-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-jakarta text-foreground">Notifications</h2>
          <p className="text-sm text-muted-foreground">
            {empDept ? `Showing updates for ${empDept}` : 'All department notifications'}
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllRead} className="gap-1.5">
              <CheckCheck className="w-3.5 h-3.5" />
              Mark all read
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={load} disabled={loading} className="gap-1.5">
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Bell className="w-3.5 h-3.5" />}
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card border border-border rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{deptFiltered.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Total</p>
        </div>
        <div className="bg-card border border-rose-200 dark:border-rose-900 rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-rose-500">{unreadCount}</p>
          <p className="text-xs text-muted-foreground mt-1">Unread</p>
        </div>
        <div className="bg-card border border-emerald-200 dark:border-emerald-900 rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-emerald-500">{deptFiltered.filter(n => n.is_read).length}</p>
          <p className="text-xs text-muted-foreground mt-1">Read</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted/50 rounded-xl p-1 w-fit">
        {TABS.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={cn("px-4 py-2 rounded-lg text-xs font-medium transition-all",
              activeTab === tab.key ? "bg-card shadow text-foreground" : "text-muted-foreground hover:text-foreground"
            )}>
            {tab.label}
            {tab.key === 'unread' && unreadCount > 0 && (
              <span className="ml-1.5 bg-rose-500 text-white rounded-full px-1.5 py-0.5 text-[9px] font-bold">{unreadCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-7 h-7 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center bg-card border border-border rounded-2xl">
          <Bell className="w-10 h-10 text-muted-foreground/30 mb-3" />
          <p className="text-sm font-medium text-muted-foreground">No notifications</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Complete tasks in Workflow to see updates here</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden divide-y divide-border">
          {filtered.map(n => {
            const cfg  = TYPE_CONFIG[n.type] || TYPE_CONFIG.info;
            const Icon = cfg.icon;
            const deptLabel = n.department ? (WORKFLOW_DEPT_LABELS[n.department] || n.department) : null;
            return (
              <div key={n.id}
                onClick={() => markRead(n)}
                className={cn(
                  "flex items-start gap-4 px-5 py-4 cursor-pointer hover:bg-muted/30 transition-colors group",
                  !n.is_read && "bg-primary/5"
                )}>
                {/* Icon */}
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5", cfg.bg)}>
                  <Icon className={cn("w-5 h-5", cfg.color)} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <p className={cn("text-sm text-foreground leading-snug", !n.is_read && "font-semibold")}>
                      {n.title}
                    </p>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {!n.is_read && <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />}
                      <button
                        onClick={(e) => deleteNotif(n, e)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-rose-500 p-0.5 rounded"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {deptLabel && (
                      <span className="text-[10px] bg-violet-100 dark:bg-violet-950/30 text-violet-700 dark:text-violet-300 px-2 py-0.5 rounded-full font-medium">
                        {deptLabel}
                      </span>
                    )}
                    {n.priority && (
                      <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium",
                        n.priority === 'urgent' ? 'bg-rose-100 text-rose-700' :
                        n.priority === 'high'   ? 'bg-amber-100 text-amber-700' :
                        n.priority === 'medium' ? 'bg-sky-100 text-sky-700' :
                        'bg-slate-100 text-slate-600'
                      )}>
                        {n.priority}
                      </span>
                    )}
                    <span className="text-[11px] text-muted-foreground">
                      {n.created_date ? formatDistanceToNow(new Date(n.created_date), { addSuffix: true }) : ''}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
