// @ts-nocheck
import { Moon, Sun, Bell, ChevronDown, Menu, User } from 'lucide-react';
import GlobalSearch from '@/components/search/GlobalSearch';

export default function TopBar({ pageTitle, darkMode, onToggleDark, onMobileMenuToggle }) {
  return (
    <header className="h-16 border-b border-border flex items-center justify-between px-4 md:px-6 sticky top-0 z-40"
      style={{ background: 'hsl(var(--card))' }}>
      {/* Left: hamburger + title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onMobileMenuToggle}
          className="md:hidden p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground flex-shrink-0"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="min-w-0">
          <h1 className="text-base font-bold font-jakarta text-foreground leading-tight truncate">{pageTitle}</h1>
          <p className="text-[11px] text-muted-foreground hidden sm:block">
            Welcome back, <span style={{ color: '#a78bfa' }} className="font-semibold">Super Admin</span> 👋
          </p>
        </div>
      </div>

      {/* Right: search + actions + user */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Search */}
        <div className="hidden sm:block">
          <GlobalSearch />
        </div>

        {/* Notification bell */}
        <div className="relative">
          <button className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-muted transition-colors text-muted-foreground">
            <Bell className="w-4 h-4" />
          </button>
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 text-[9px] font-bold text-white flex items-center justify-center rounded-full"
            style={{ background: '#8b5cf6' }}>3</span>
        </div>

        {/* Dark mode toggle */}
        <button
          onClick={onToggleDark}
          className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-muted transition-colors text-muted-foreground"
        >
          {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* User */}
        <div className="flex items-center gap-2 pl-2 border-l border-border cursor-pointer hover:opacity-80 ml-1">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)' }}>
            <User className="w-4 h-4 text-white" />
          </div>
          <div className="hidden sm:block">
            <p className="text-xs font-bold text-foreground leading-tight">Super Admin</p>
            <p className="text-[10px] text-muted-foreground leading-tight">Administrator</p>
          </div>
          <ChevronDown className="w-3 h-3 text-muted-foreground hidden sm:block" />
        </div>
      </div>
    </header>
  );
}
