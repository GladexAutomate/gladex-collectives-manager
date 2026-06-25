// @ts-nocheck
import { useState, useEffect, useRef } from 'react';
import { Bell, X, CheckCheck, AlertTriangle, CheckCircle2, CreditCard, Briefcase, Users, FileText, Megaphone, Star, Clock, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

const TYPE_CONFIG = {
  deadline:  { icon: Clock,         color: 'text-rose-500',   bg: 'bg-rose-50 dark:bg-rose-950/30' },
  approval:  { icon: CheckCircle2,  color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-950/30' },
  payment:   { icon: CreditCard,    color: 'text-emerald-500',bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
  reminder:  { icon: Bell,          color: 'text-amber-500',  bg: 'bg-amber-50 dark:bg-amber-950/30' },
  alert:     { icon: AlertTriangle, color: 'text-rose-500',   bg: 'bg-rose-50 dark:bg-rose-950/30' },
  info:      { icon: Briefcase,     color: 'text-sky-500',    bg: 'bg-sky-50 dark:bg-sky-950/30' },
};

const PRIORITY_BADGE = {
  urgent: 'bg-rose-100 text-rose-700',
  high:   'bg-amber-100 text-amber-700',
  medium: 'bg-sky-100 text-sky-700',
  low:    'bg-slate-100 text-slate-600',
};

const TABS = ['all', 'unread', 'deadline', 'approval', 'payment', 'alert'];

export default function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const panelRef = useRef(null);

  const load = async () => {
    const data = await base44.entities.Notification.list('-created_date', 60);
    setNotifications(data);
  };

  useEffect(() => {
    load();
    // Poll every 30 seconds for new notifications
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);


  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const filtered = notifications.filter(n => {
    if (activeTab === 'all') return true;
    if (activeTab === 'unread') return !n.is_read;
    return n.type === activeTab;
  });

  const markRead = async (n) => {
    if (n.is_read) return;
    await base44.entities.Notification.update(n.id, { is_read: true });
    setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, is_read: true } : x));
  };

  const markAllRead = async () => {
    const unread = notifications.filter(n => !n.is_read);
    await Promise.all(unread.map(n => base44.entities.Notification.update(n.id, { is_read: true })));
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Button */}
      <button
        onClick={() => setOpen(!open)}
        className="relative h-8 w-8 flex items-center justify-center rounded-md hover:bg-accent transition-colors"
      >
        <Bell className={cn("w-4 h-4 transition-all", open && "text-primary", unreadCount > 0 && "animate-pulse")} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-4 min-w-4 px-0.5 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div className="absolute right-0 top-10 w-96 max-h-[600px] bg-card border border-border rounded-xl shadow-2xl overflow-hidden z-50 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-primary" />
              <h3 className="font-semibold font-jakarta text-sm text-foreground">Notifications</h3>
              {unreadCount > 0 && (
                <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{unreadCount}</span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-[10px] text-primary hover:underline flex items-center gap-1">
                  <CheckCheck className="w-3 h-3" /> Mark all read
                </button>
              )}
              <button onClick={() => setOpen(false)} className="ml-2 text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 px-3 py-2 border-b border-border overflow-x-auto">
            {TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-2.5 py-1 rounded-md text-[10px] font-medium capitalize whitespace-nowrap transition-colors",
                  activeTab === tab
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                {tab}
                {tab === 'unread' && unreadCount > 0 && (
                  <span className="ml-1 bg-rose-500 text-white rounded-full px-1 text-[9px]">{unreadCount}</span>
                )}
              </button>
            ))}
          </div>

          {/* List */}
          <div className="overflow-y-auto flex-1">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Bell className="w-8 h-8 text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">No notifications</p>
              </div>
            ) : (
              filtered.map(n => {
                const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.info;
                const Icon = cfg.icon;
                return (
                  <button
                    key={n.id}
                    onClick={() => markRead(n)}
                    className={cn(
                      "w-full flex items-start gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left border-b border-border/50",
                      !n.is_read && "bg-primary/5"
                    )}
                  >
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5", cfg.bg)}>
                      <Icon className={cn("w-4 h-4", cfg.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn("text-xs font-medium text-foreground leading-tight", !n.is_read && "font-semibold")}>
                          {n.title}
                        </p>
                        {!n.is_read && <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 mt-1" />}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        {n.priority && (
                          <span className={cn("text-[9px] px-1.5 py-0.5 rounded font-medium", PRIORITY_BADGE[n.priority])}>
                            {n.priority}
                          </span>
                        )}
                        <span className="text-[10px] text-muted-foreground">
                          {n.created_date ? formatDistanceToNow(new Date(n.created_date), { addSuffix: true }) : ''}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-border bg-muted/30">
            <button
              onClick={() => setOpen(false)}
              className="w-full text-center text-xs text-primary hover:underline flex items-center justify-center gap-1"
            >
              View all notifications <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}