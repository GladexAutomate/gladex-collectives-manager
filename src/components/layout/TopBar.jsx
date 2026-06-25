// @ts-nocheck
import { Moon, Sun, User, ChevronDown, Menu } from 'lucide-react';
import GlobalSearch from '@/components/search/GlobalSearch';

export default function TopBar({ pageTitle, darkMode, onToggleDark, onMobileMenuToggle }) {
  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-4 md:px-6 sticky top-0 z-40">
      <div className="flex items-center gap-3">
        {/* Hamburger — mobile only */}
        <button
          onClick={onMobileMenuToggle}
          className="md:hidden p-2 rounded-lg hover:bg-accent transition-colors text-muted-foreground"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-base md:text-lg font-semibold font-jakarta text-foreground leading-tight">{pageTitle}</h1>
          <p className="text-[10px] text-muted-foreground hidden sm:block">GLADEX Group Collectives System</p>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        <div className="hidden sm:block">
          <GlobalSearch />
        </div>

        <button
          className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-accent transition-colors text-muted-foreground"
          onClick={onToggleDark}
        >
          {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        <div className="flex items-center gap-1.5 pl-2 md:pl-3 border-l border-border cursor-pointer hover:opacity-80">
          <div className="w-8 h-8 rounded-full gradient-gold flex items-center justify-center flex-shrink-0">
            <User className="w-4 h-4 text-white" />
          </div>
          <div className="hidden sm:block">
            <p className="text-xs font-semibold text-foreground">Admin</p>
            <p className="text-[10px] text-muted-foreground">Super Admin</p>
          </div>
          <ChevronDown className="w-3 h-3 text-muted-foreground hidden sm:block" />
        </div>
      </div>
    </header>
  );
}
