import { Bell, Search, Moon, Sun, User, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

export default function TopBar({ pageTitle, darkMode, onToggleDark }) {
  const [showSearch, setShowSearch] = useState(false);

  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6 sticky top-0 z-40">
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-lg font-semibold font-jakarta text-foreground">{pageTitle}</h1>
          <p className="text-xs text-muted-foreground">GLADEX Group Collectives System</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {showSearch && (
          <Input
            placeholder="Search collectives, bookings..."
            className="w-64 h-8 text-sm"
            autoFocus
            onBlur={() => setShowSearch(false)}
          />
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setShowSearch(!showSearch)}
        >
          <Search className="w-4 h-4" />
        </Button>

        <Button variant="ghost" size="icon" className="h-8 w-8 relative" onClick={onToggleDark}>
          {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </Button>

        <Button variant="ghost" size="icon" className="h-8 w-8 relative">
          <Bell className="w-4 h-4" />
          <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 text-[10px] flex items-center justify-center bg-primary text-primary-foreground">3</Badge>
        </Button>

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