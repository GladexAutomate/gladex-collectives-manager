// @ts-nocheck
import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, Package, Users, CreditCard, CheckSquare, FileText, Megaphone, MapPin, Building2, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { debounce } from 'lodash';
import { pkgCodeStore } from '@/lib/packageCodeStore';

const CATEGORY_CONFIG = {
  collective: { label: 'Collective', icon: Package, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/30', path: '/collectives' },
  booking:    { label: 'Booking',    icon: Users,   color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/30', path: '/admin-operations' },
  payment:    { label: 'Payment',    icon: CreditCard, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-950/30', path: '/admin-operations' },
  task:       { label: 'Task',       icon: CheckSquare, color: 'text-sky-500', bg: 'bg-sky-50 dark:bg-sky-950/30', path: '/workflow' },
  document:   { label: 'Document',  icon: FileText, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-950/30', path: '/documents' },
  marketing:  { label: 'Marketing', icon: Megaphone, color: 'text-pink-500', bg: 'bg-pink-50 dark:bg-pink-950/30', path: '/marketing' },
  client:     { label: 'Client',    icon: Users, color: 'text-teal-500', bg: 'bg-teal-50 dark:bg-teal-950/30', path: '/admin-operations' },
  operator:   { label: 'Operator',  icon: Building2, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-950/30', path: '/product-development' },
};

function highlight(text, query) {
  if (!query || !text) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-primary/20 text-primary font-semibold rounded">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
}

function matches(str, q) {
  return str && str.toLowerCase().includes(q.toLowerCase());
}

export default function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const navigate = useNavigate();

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Keyboard shortcut Ctrl+K
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const search = useCallback(
    debounce(async (q) => {
      if (!q || q.trim().length < 2) {
        setResults([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const [collectives, bookings, payments, tasks, documents, assets, clients, operators] = await Promise.all([
          base44.entities.Collective.list('-updated_date', 100),
          base44.entities.Booking.list('-updated_date', 100),
          base44.entities.Payment.list('-updated_date', 100),
          base44.entities.ChecklistTask.list('-updated_date', 100),
          base44.entities.Document.list('-updated_date', 100),
          base44.entities.MarketingAsset.list('-updated_date', 100),
          base44.entities.Client.list('-updated_date', 100),
          base44.entities.Operator.list('-updated_date', 100),
        ]);

        const found = [];
        const localCodes = pkgCodeStore.getAll();

        collectives.forEach(c => {
          const code = c.package_code || localCodes[c.id] || '';
          if (matches(c.name, q) || matches(c.destination, q) || matches(c.operator_name, q) || matches(code, q)) {
            found.push({
              type: 'collective', id: c.id,
              title: c.name,
              subtitle: `${code ? code + ' · ' : ''}${c.destination || ''} · ${c.status || ''}`,
              badge: c.status,
            });
          }
        });

        bookings.forEach(b => {
          if (matches(b.client_name, q) || matches(b.booking_reference, q) || matches(b.client_email, q)) {
            found.push({
              type: 'booking', id: b.id,
              title: b.client_name,
              subtitle: `Ref: ${b.booking_reference || 'N/A'} · ${b.status || ''}`,
              badge: b.status,
            });
          }
        });

        payments.forEach(p => {
          if (matches(p.client_name, q) || matches(p.reference_number, q)) {
            found.push({
              type: 'payment', id: p.id,
              title: p.client_name,
              subtitle: `${p.payment_type || ''} · PHP ${(p.amount || 0).toLocaleString()} · ${p.status || ''}`,
              badge: p.status,
            });
          }
        });

        tasks.forEach(t => {
          if (matches(t.task_name, q) || matches(t.stage_name, q) || matches(t.assigned_to, q)) {
            found.push({
              type: 'task', id: t.id,
              title: t.task_name,
              subtitle: `${t.stage_name || ''} · ${t.status || ''}`,
              badge: t.priority,
            });
          }
        });

        documents.forEach(d => {
          if (matches(d.client_name, q) || matches(d.file_name, q) || matches(d.document_type, q)) {
            found.push({
              type: 'document', id: d.id,
              title: d.file_name || d.document_type,
              subtitle: `${d.client_name || ''} · ${d.status || ''}`,
              badge: d.status,
            });
          }
        });

        assets.forEach(a => {
          if (matches(a.title, q) || matches(a.caption, q)) {
            found.push({
              type: 'marketing', id: a.id,
              title: a.title,
              subtitle: `${a.asset_type || ''} · ${a.status || ''}`,
              badge: a.status,
            });
          }
        });

        clients.forEach(c => {
          if (matches(c.full_name, q) || matches(c.email, q) || matches(c.phone, q)) {
            found.push({
              type: 'client', id: c.id,
              title: c.full_name,
              subtitle: `${c.email || ''} · ${c.phone || ''}`,
            });
          }
        });

        operators.forEach(o => {
          if (matches(o.name, q) || matches(o.country, q) || matches(o.contact_person, q)) {
            found.push({
              type: 'operator', id: o.id,
              title: o.name,
              subtitle: `${o.country || ''} · ${o.status || ''}`,
              badge: o.status,
            });
          }
        });

        setResults(found.slice(0, 40));
      } finally {
        setLoading(false);
      }
    }, 300),
    []
  );

  useEffect(() => {
    search(query);
  }, [query, search]);

  const filteredResults = categoryFilter === 'all'
    ? results
    : results.filter(r => r.type === categoryFilter);

  const categories = [...new Set(results.map(r => r.type))];

  const handleSelect = (result) => {
    if (result.type === 'collective') {
      // Navigate to Sales and pre-populate the package search bar with the current query
      // — cards will appear immediately without any extra click
      navigate(`/sales?search=${encodeURIComponent(query)}`);
    } else {
      const cfg = CATEGORY_CONFIG[result.type];
      if (cfg) navigate(cfg.path);
    }
    setOpen(false);
    setQuery('');
  };

  return (
    <div className="relative" ref={containerRef}>
      {/* Trigger */}
      <button
        onClick={() => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 50); }}
        className="flex items-center gap-2 h-8 px-3 rounded-md border border-border bg-muted/50 hover:bg-muted text-muted-foreground text-xs transition-colors"
      >
        <Search className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Search...</span>
        <kbd className="hidden sm:inline text-[9px] bg-background border border-border rounded px-1 py-0.5">⌘K</kbd>
      </button>

      {/* Panel */}
      {open && (
        <div className="absolute right-0 top-10 w-[520px] max-w-[calc(100vw-2rem)] bg-card border border-border rounded-xl shadow-2xl overflow-hidden z-50 flex flex-col max-h-[600px]">
          {/* Search Input */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
            {loading ? <Loader2 className="w-4 h-4 text-muted-foreground animate-spin flex-shrink-0" /> : <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search collectives, bookings, clients, tasks..."
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
            />
            {query && (
              <button onClick={() => { setQuery(''); setResults([]); }} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Category filters */}
          {results.length > 0 && (
            <div className="flex gap-1 px-3 py-2 border-b border-border overflow-x-auto">
              <button
                onClick={() => setCategoryFilter('all')}
                className={cn("px-2.5 py-1 rounded-md text-[10px] font-medium whitespace-nowrap", categoryFilter === 'all' ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")}
              >
                All ({results.length})
              </button>
              {categories.map(cat => {
                const cfg = CATEGORY_CONFIG[cat];
                const count = results.filter(r => r.type === cat).length;
                return (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={cn("px-2.5 py-1 rounded-md text-[10px] font-medium whitespace-nowrap capitalize", categoryFilter === cat ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")}
                  >
                    {cfg?.label || cat} ({count})
                  </button>
                );
              })}
            </div>
          )}

          {/* Results */}
          <div className="overflow-y-auto flex-1">
            {query.length < 2 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Search className="w-8 h-8 text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">Type at least 2 characters to search</p>
                <p className="text-xs text-muted-foreground mt-1">Search across collectives, bookings, clients, tasks and more</p>
              </div>
            ) : loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : filteredResults.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Search className="w-8 h-8 text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">No results for "{query}"</p>
              </div>
            ) : (
              <div>
                {filteredResults.map((result, i) => {
                  const cfg = CATEGORY_CONFIG[result.type] || {};
                  const Icon = cfg.icon || FileText;
                  return (
                    <button
                      key={`${result.type}-${result.id}-${i}`}
                      onClick={() => handleSelect(result)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/60 transition-colors text-left border-b border-border/30"
                    >
                      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", cfg.bg)}>
                        <Icon className={cn("w-4 h-4", cfg.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {highlight(result.title, query)}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate">{result.subtitle}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {result.badge && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground capitalize">{result.badge}</span>
                        )}
                        <span className={cn("text-[9px] px-1.5 py-0.5 rounded font-medium capitalize", cfg.bg, cfg.color)}>
                          {cfg.label || result.type}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-border bg-muted/30 flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">{results.length > 0 ? `${filteredResults.length} results` : 'No results'}</span>
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
              <span><kbd className="bg-background border border-border rounded px-1">↑↓</kbd> Navigate</span>
              <span><kbd className="bg-background border border-border rounded px-1">↵</kbd> Open</span>
              <span><kbd className="bg-background border border-border rounded px-1">Esc</kbd> Close</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}