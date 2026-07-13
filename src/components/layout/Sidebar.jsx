// @ts-nocheck
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Globe, CheckSquare, Package, Megaphone,
  FileText, Truck, Star, BarChart3, ClipboardList,
  Bell, Settings, ChevronLeft, ChevronRight, Users, CreditCard, X, StickyNote,
  UserCog, Stamp, BriefcaseBusiness, HelpCircle, Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

const mainNav = [
  { icon: LayoutDashboard,   label: 'Dashboard',    path: '/' },
  { icon: Globe,             label: 'Collectives',  path: '/collectives' },
  { icon: CheckSquare,       label: 'Workflow',     path: '/workflow' },
  { icon: Package,           label: 'Product Dev',  path: '/product-development' },
  { icon: Megaphone,         label: 'Marketing',    path: '/marketing' },
  { icon: Users,             label: 'Sales',        path: '/sales' },
  { icon: CreditCard,        label: 'Accounting',   path: '/accounting' },
  { icon: ClipboardList,     label: 'Admin',        path: '/admin-operations' },
  { icon: Truck,             label: 'Operations',   path: '/operations' },
  { icon: Stamp,             label: 'Visa',         path: '/visa' },
  { icon: BriefcaseBusiness, label: 'Management',   path: '/management' },
  { icon: FileText,          label: 'Documents',    path: '/documents' },
  { icon: Star,              label: 'Feedback',     path: '/feedback' },
  { icon: BarChart3,         label: 'Reports',      path: '/reports' },
];

const systemNav = [
  { icon: UserCog,    label: 'User Management', path: '/user-management', badge: null },
  { icon: Settings,   label: 'Settings',        path: '/settings',         badge: null },
  { icon: Bell,       label: 'Notifications',   path: '/notifications',    badge: 3 },
  { icon: Star,       label: 'Feedback',        path: '/feedback',         badge: null },
  { icon: HelpCircle, label: 'Help Center',     path: '/help',             badge: null },
];

const PURPLE = '#8b5cf6';

export default function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose, onNotepadToggle, notepadOpen }) {
  const location = useLocation();

  const isActive = (path) =>
    location.pathname === path || (path !== '/' && location.pathname.startsWith(path));

  const NavLink = ({ icon: Icon, label, path, badge }) => {
    const active = isActive(path);
    return (
      <Link
        to={path}
        onClick={onMobileClose}
        className={cn(
          "flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-150 group relative",
          active
            ? "text-white"
            : "text-[hsl(var(--sidebar-foreground))] opacity-70 hover:opacity-100 hover:bg-[hsl(var(--sidebar-accent))]"
        )}
        style={active ? { background: 'rgba(139,92,246,0.25)', borderLeft: '3px solid #8b5cf6' } : {}}
      >
        <Icon className={cn("flex-shrink-0", (collapsed && !mobileOpen) ? "w-5 h-5" : "w-4 h-4")}
          style={{ color: active ? '#a78bfa' : undefined }} />
        {(!collapsed || mobileOpen) && (
          <span className={cn("text-sm font-medium truncate flex-1", active && "text-white")}>{label}</span>
        )}
        {badge && (!collapsed || mobileOpen) && (
          <span className="ml-auto text-[10px] font-bold text-white px-1.5 py-0.5 rounded-full flex-shrink-0"
            style={{ background: PURPLE }}>{badge}</span>
        )}
        {badge && collapsed && !mobileOpen && (
          <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full flex-shrink-0"
            style={{ background: PURPLE }} />
        )}
      </Link>
    );
  };

  const SidebarContent = ({ mobile = false }) => (
    <>
      {/* Logo / Brand */}
      <div className={cn(
        "flex items-center h-16 px-4 border-b border-[hsl(var(--sidebar-border))]",
        collapsed && !mobile ? "justify-center" : "justify-between"
      )}>
        {(!collapsed || mobile) && (
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg"
              style={{ background: 'linear-gradient(135deg, #6d28d9, #a855f7)', boxShadow: '0 4px 14px rgba(139,92,246,0.5)' }}>
              <Zap className="w-5 h-5 text-white drop-shadow" />
            </div>
            <div className="min-w-0">
              <p className="text-base font-black leading-tight font-jakarta tracking-tight"
                style={{ background: 'linear-gradient(90deg, #e9d5ff, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Collectives
              </p>
              <p className="text-[11px] font-semibold leading-tight tracking-widest uppercase" style={{ color: '#7c3aed' }}>
                Checklists ✦
              </p>
            </div>
          </div>
        )}
        {collapsed && !mobile && (
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}>
            <Zap className="w-5 h-5 text-white" />
          </div>
        )}
        {!mobile && (
          <button onClick={onToggle}
            className="p-1 rounded-lg hover:bg-[hsl(var(--sidebar-accent))] text-[hsl(var(--sidebar-foreground))] transition-colors flex-shrink-0">
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        )}
        {mobile && (
          <button onClick={onMobileClose}
            className="p-1.5 rounded-lg hover:bg-[hsl(var(--sidebar-accent))] text-[hsl(var(--sidebar-foreground))]">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Main Nav */}
      <nav className="flex-1 overflow-y-auto py-3 space-y-0.5 px-2">
        {mainNav.map(item => <NavLink key={item.path} {...item} />)}

        {/* SYSTEM section */}
        {(!collapsed || mobile) && (
          <p className="text-[9px] font-bold uppercase tracking-widest px-3 pt-4 pb-1"
            style={{ color: '#6b7280' }}>System</p>
        )}
        {(collapsed && !mobile) && <div className="h-4" />}
        {systemNav.map(item => <NavLink key={item.path} {...item} />)}

        {/* Notepad */}
        <button
          onClick={mobile ? () => { onNotepadToggle(); onMobileClose(); } : onNotepadToggle}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-150",
            notepadOpen
              ? "text-violet-300"
              : "text-[hsl(var(--sidebar-foreground))] opacity-70 hover:opacity-100 hover:bg-[hsl(var(--sidebar-accent))]"
          )}
          style={notepadOpen ? { background: 'rgba(139,92,246,0.20)', borderLeft: '3px solid #8b5cf6' } : {}}
        >
          <StickyNote className={cn("flex-shrink-0", collapsed && !mobile ? "w-5 h-5" : "w-4 h-4")} />
          {(!collapsed || mobile) && <span className="text-sm font-medium">Notepad</span>}
        </button>
      </nav>

      {/* Pro Plan Card */}
      {(!collapsed || mobile) && (
        <div className="mx-3 mb-4 rounded-xl p-3 border border-[hsl(var(--sidebar-border))]"
          style={{ background: 'rgba(139,92,246,0.12)' }}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)' }}>
              <Zap className="w-3 h-3 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-white leading-tight">Pro Plan</p>
              <p className="text-[10px] leading-tight" style={{ color: '#a78bfa' }}>You're on Pro Plan</p>
            </div>
          </div>
          <div className="h-1.5 rounded-full bg-white/10 overflow-hidden mb-2">
            <div className="h-full rounded-full" style={{ width: '75%', background: 'linear-gradient(90deg,#7c3aed,#a855f7)' }} />
          </div>
          <p className="text-[10px] text-center mb-2" style={{ color: '#a78bfa' }}>75% of resources used</p>
          <button className="w-full text-xs font-semibold py-1.5 rounded-lg transition-colors hover:opacity-90"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)', color: '#fff' }}>
            Manage Plan
          </button>
        </div>
      )}
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className={cn(
        "fixed left-0 top-0 h-screen z-50 flex flex-col transition-all duration-300",
        "bg-[hsl(var(--sidebar-background))]",
        "hidden md:flex",
        collapsed ? "w-16" : "w-64"
      )}>
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={onMobileClose} />
      )}
      {/* Mobile drawer */}
      <aside className={cn(
        "fixed left-0 top-0 h-screen w-72 z-50 flex flex-col transition-transform duration-300",
        "bg-[hsl(var(--sidebar-background))]",
        "md:hidden",
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <SidebarContent mobile />
      </aside>
    </>
  );
}
