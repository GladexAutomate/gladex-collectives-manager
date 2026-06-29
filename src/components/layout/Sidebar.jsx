// @ts-nocheck
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Globe, CheckSquare, Package, Megaphone,
  FileText, Truck, Star, BarChart3, ClipboardList,
  Bell, Settings, ChevronLeft, ChevronRight, Users, CreditCard, X, StickyNote
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard',        path: '/' },
  { icon: Globe,           label: 'Collectives',       path: '/collectives' },
  { icon: CheckSquare,     label: 'Workflow',          path: '/workflow' },
  { icon: Package,         label: 'Product Dev',       path: '/product-development' },
  { icon: Megaphone,       label: 'Marketing',         path: '/marketing' },
  { icon: Users,           label: 'Sales',             path: '/sales' },
  { icon: CreditCard,      label: 'Accounting',        path: '/accounting' },
  { icon: ClipboardList,   label: 'Admin Operations',  path: '/admin-operations' },
  { icon: FileText,        label: 'Documents',         path: '/documents' },
  { icon: Truck,           label: 'Operations',        path: '/operations' },
  { icon: Star,            label: 'Feedback',          path: '/feedback' },
  { icon: BarChart3,       label: 'Reports',           path: '/reports' },
];

export default function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose, onNotepadToggle, notepadOpen }) {
  const location = useLocation();

  const NavLink = ({ icon: Icon, label, path }) => {
    const isActive = location.pathname === path || (path !== '/' && location.pathname.startsWith(path));
    return (
      <Link
        to={path}
        onClick={onMobileClose}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group",
          isActive
            ? "sidebar-item-active text-[hsl(var(--sidebar-primary))]"
            : "text-[hsl(var(--sidebar-foreground))] hover:bg-[hsl(var(--sidebar-accent))]"
        )}
      >
        <Icon className={cn("flex-shrink-0", (collapsed && !mobileOpen) ? "w-5 h-5" : "w-4 h-4")} />
        {(!collapsed || mobileOpen) && <span className="text-sm font-medium truncate">{label}</span>}
      </Link>
    );
  };

  return (
    <>
      {/* Desktop sidebar */}
      <aside className={cn(
        "fixed left-0 top-0 h-screen z-50 flex flex-col transition-all duration-300",
        "bg-[hsl(var(--sidebar-background))]",
        "hidden md:flex",
        collapsed ? "w-16" : "w-64"
      )}>
        {/* Logo */}
        <div className={cn(
          "flex items-center h-16 px-4 border-b border-[hsl(var(--sidebar-border))]",
          collapsed ? "justify-center" : "justify-between"
        )}>
          {!collapsed && (
            <div className="flex items-center gap-2">
              <img
                src="https://media.base44.com/images/public/user_6a02bae260cbf19898e5d68c/470e34f24_gladexlogo.jpg"
                alt="GLADEX"
                className="w-8 h-8 rounded-lg object-cover"
              />
              <div>
                <p className="text-[10px] font-semibold text-[hsl(var(--sidebar-foreground))] opacity-70 leading-tight tracking-wide">Collectives Dashboard</p>
              </div>
            </div>
          )}
          {collapsed && (
            <img
              src="https://media.base44.com/images/public/user_6a02bae260cbf19898e5d68c/470e34f24_gladexlogo.jpg"
              alt="G"
              className="w-8 h-8 rounded-lg object-cover"
            />
          )}
          <button
            onClick={onToggle}
            className="p-1 rounded-lg hover:bg-[hsl(var(--sidebar-accent))] text-[hsl(var(--sidebar-foreground))] transition-colors"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 space-y-1 px-2">
          {navItems.map(item => <NavLink key={item.path} {...item} />)}
        </nav>

        <div className="px-2 pb-4 space-y-1 border-t border-[hsl(var(--sidebar-border))] pt-4">
          <NavLink icon={Bell}     label="Notifications" path="/notifications" />
          <NavLink icon={Settings} label="Settings"      path="/settings" />
          <button
            onClick={onNotepadToggle}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150",
              notepadOpen
                ? "bg-orange-500/20 text-orange-400"
                : "text-[hsl(var(--sidebar-foreground))] hover:bg-[hsl(var(--sidebar-accent))]"
            )}
          >
            <StickyNote className={cn("flex-shrink-0", collapsed && !mobileOpen ? "w-5 h-5" : "w-4 h-4")} />
            {(!collapsed || mobileOpen) && <span className="text-sm font-medium">Notepad</span>}
          </button>
        </div>
      </aside>

      {/* Mobile drawer */}
      <aside className={cn(
        "fixed left-0 top-0 h-screen w-72 z-50 flex flex-col transition-transform duration-300",
        "bg-[hsl(var(--sidebar-background))]",
        "md:hidden",
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Mobile header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-[hsl(var(--sidebar-border))]">
          <div className="flex items-center gap-2">
            <img
              src="https://media.base44.com/images/public/user_6a02bae260cbf19898e5d68c/470e34f24_gladexlogo.jpg"
              alt="GLADEX"
              className="w-8 h-8 rounded-lg object-cover"
            />
            <div>
              <p className="text-xs font-bold text-[hsl(var(--gladex-gold))] leading-tight font-jakarta">GLADEX</p>
              <p className="text-[9px] text-[hsl(var(--sidebar-foreground))] opacity-60 leading-tight">Group Collectives</p>
            </div>
          </div>
          <button
            onClick={onMobileClose}
            className="p-1.5 rounded-lg hover:bg-[hsl(var(--sidebar-accent))] text-[hsl(var(--sidebar-foreground))] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 space-y-1 px-2">
          {navItems.map(item => <NavLink key={item.path} {...item} />)}
        </nav>

        <div className="px-2 pb-4 space-y-1 border-t border-[hsl(var(--sidebar-border))] pt-4">
          <NavLink icon={Bell}     label="Notifications" path="/notifications" />
          <NavLink icon={Settings} label="Settings"      path="/settings" />
          <button
            onClick={() => { onNotepadToggle(); onMobileClose(); }}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150",
              notepadOpen
                ? "bg-orange-500/20 text-orange-400"
                : "text-[hsl(var(--sidebar-foreground))] hover:bg-[hsl(var(--sidebar-accent))]"
            )}
          >
            <StickyNote className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm font-medium">Notepad</span>
          </button>
        </div>
      </aside>
    </>
  );
}
