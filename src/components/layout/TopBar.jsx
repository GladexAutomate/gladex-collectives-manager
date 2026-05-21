import { Moon, Sun, User, ChevronDown } from 'lucide-react';
import GlobalSearch from '@/components/search/GlobalSearch';

export default function TopBar({ pageTitle, darkMode, onToggleDark }) {
  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6 sticky top-0 z-40">
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-lg font-semibold font-jakarta text-foreground">{pageTitle}</h1>
          <p className="text-xs text-muted-foreground">GLADEX Group Collectives System</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <GlobalSearch />

        <button
          className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-accent transition-colors text-muted-foreground"
          onClick={onToggleDark}
        >
          {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        <div className="flex items-center gap-2 pl-3 border-l border-border cursor-pointer hover:opacity-80">
          <div className="w-8 h-8 rounded-full gradient-gold flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
          <div className="hidden sm:block">
            <p className="text-xs font-semibold text-foreground">Admin</p>
            <p className="text-[10px] text-muted-foreground">Super Admin</p>
          </div>
          <ChevronDown className="w-3 h-3 text-muted-foreground" />
        </div>
      </div>
    </header>
  );
}