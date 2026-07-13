// @ts-nocheck
import { useState, useEffect, useMemo } from 'react';
import {
  Search, RefreshCw, Loader2, CheckCircle, XCircle,
  UserCheck, UserX, Users, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { sbFetchEmployees, sbSetEmployeeStatus } from '@/lib/supabaseClient';

const PAGE_SIZE = 30;

function Avatar({ name, id }) {
  const initials = name?.trim()?.[0]?.toUpperCase() || '?';
  const colors = [
    'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
    'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
  ];
  const color = colors[(id?.charCodeAt?.(0) || 0) % colors.length];
  return (
    <div className={cn('w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm', color)}>
      {initials}
    </div>
  );
}

export default function UserManagement() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [deptFilter, setDeptFilter] = useState('all');
  const [updating, setUpdating] = useState(new Set());
  const [page, setPage] = useState(1);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await sbFetchEmployees();
      setEmployees(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const toggleStatus = async (record) => {
    const d = record.data || {};
    const current = d.status || 'active';
    const next = current === 'active' ? 'inactive' : 'active';
    const name = [d.first_name?.trim(), d.last_name?.trim()].filter(Boolean).join(' ') || 'Employee';

    setUpdating(prev => new Set([...prev, record.id]));
    const ok = await sbSetEmployeeStatus(record.id, d, next);
    if (ok) {
      setEmployees(prev => prev.map(e =>
        e.id === record.id ? { ...e, data: { ...e.data, status: next } } : e
      ));
      toast.success(`${name} marked as ${next}`);
    } else {
      toast.error('Failed to update — check Supabase RLS policies');
    }
    setUpdating(prev => { const s = new Set(prev); s.delete(record.id); return s; });
  };

  const uniqueDepts = useMemo(() => {
    const s = new Set(employees.map(r => r.data?.department_name).filter(Boolean));
    return [...s].sort();
  }, [employees]);

  const uniqueRoles = useMemo(() => {
    const s = new Set(employees.map(r => r.data?.position || r.data?.role_title).filter(Boolean));
    return [...s].sort();
  }, [employees]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return employees.filter(r => {
      const d = r.data || {};
      const name = `${d.first_name || ''} ${d.middle_name || ''} ${d.last_name || ''} ${d.employee_id || ''}`.toLowerCase();
      const role = (d.position || d.role_title || '').toLowerCase();
      const dept = (d.department_name || '').toLowerCase();
      const matchSearch = !q || name.includes(q) || (d.email || '').toLowerCase().includes(q) || role.includes(q) || dept.includes(q);
      const matchStatus = statusFilter === 'all' || (d.status || 'active') === statusFilter;
      const matchType = typeFilter === 'all' || d.employment_type === typeFilter;
      const matchRole = roleFilter === 'all' || (d.position || d.role_title) === roleFilter;
      const matchDept = deptFilter === 'all' || d.department_name === deptFilter;
      return matchSearch && matchStatus && matchType && matchRole && matchDept;
    });
  }, [employees, search, statusFilter, typeFilter, roleFilter, deptFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1); }, [search, statusFilter, typeFilter, roleFilter, deptFilter]);

  const activeCount = employees.filter(e => (e.data?.status || 'active') === 'active').length;
  const inactiveCount = employees.length - activeCount;

  return (
    <div className="space-y-5 pb-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-jakarta text-foreground">User Management</h2>
          <p className="text-sm text-muted-foreground">Manage employee accounts and activation status</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading} className="flex-shrink-0">
          <RefreshCw className={cn('w-3.5 h-3.5 mr-1.5', loading && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div
          onClick={() => setStatusFilter('all')}
          className={cn('border border-border rounded-2xl p-4 text-center cursor-pointer transition-all', statusFilter === 'all' ? 'border-amber-400 bg-amber-50 dark:bg-amber-950/20' : 'bg-card hover:bg-muted/40')}
        >
          <p className="text-2xl font-bold text-foreground">{employees.length}</p>
          <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1"><Users className="w-3 h-3" />Total</p>
        </div>
        <div
          onClick={() => setStatusFilter('active')}
          className={cn('border border-border rounded-2xl p-4 text-center cursor-pointer transition-all', statusFilter === 'active' ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/20' : 'bg-card hover:bg-muted/40')}
        >
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{activeCount}</p>
          <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1"><CheckCircle className="w-3 h-3 text-emerald-500" />Active</p>
        </div>
        <div
          onClick={() => setStatusFilter('inactive')}
          className={cn('border border-border rounded-2xl p-4 text-center cursor-pointer transition-all', statusFilter === 'inactive' ? 'border-rose-400 bg-rose-50 dark:bg-rose-950/20' : 'bg-card hover:bg-muted/40')}
        >
          <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">{inactiveCount}</p>
          <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1"><XCircle className="w-3 h-3 text-rose-500" />Inactive</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            className="pl-9 h-9 text-sm"
            placeholder="Search name, ID, email, role, dept…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Select value={deptFilter} onValueChange={setDeptFilter}>
          <SelectTrigger className="w-44 h-9 text-sm"><SelectValue placeholder="Department" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {uniqueDepts.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-44 h-9 text-sm"><SelectValue placeholder="Role" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            {uniqueRoles.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36 h-9 text-sm"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40 h-9 text-sm"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="regular">Regular</SelectItem>
            <SelectItem value="probationary">Probationary</SelectItem>
            <SelectItem value="contractual">Contractual</SelectItem>
            <SelectItem value="part_time">Part-time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <p className="text-xs text-muted-foreground">
        Showing {paged.length} of {filtered.length} employees
        {filtered.length !== employees.length && ` (filtered from ${employees.length})`}
      </p>

      {/* Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <Loader2 className="w-7 h-7 animate-spin text-amber-500" />
          <p className="text-sm text-muted-foreground">Loading employees from Supabase…</p>
        </div>
      ) : error ? (
        <div className="text-center py-20 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 rounded-2xl">
          <XCircle className="w-8 h-8 text-rose-400 mx-auto mb-2" />
          <p className="text-sm text-rose-600 dark:text-rose-400 font-medium">{error}</p>
        </div>
      ) : (
        <>
          <div className="border border-border rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Employee</th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide hidden sm:table-cell">Department</th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">Role</th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide hidden lg:table-cell">Type</th>
                    <th className="text-center px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                    <th className="text-center px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {paged.map(record => {
                    const d = record.data || {};
                    const name = [d.first_name?.trim(), d.last_name?.trim()].filter(Boolean).join(' ') || '—';
                    const isActive = (d.status || 'active') === 'active';
                    const isBusy = updating.has(record.id);
                    return (
                      <tr key={record.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar name={name} id={record.id} />
                            <div className="min-w-0">
                              <p className="font-semibold text-foreground text-sm truncate">{name}</p>
                              <p className="text-[11px] text-muted-foreground">{d.employee_id || '—'}</p>
                              {d.email && <p className="text-[10px] text-muted-foreground truncate">{d.email}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <span className="text-xs font-medium text-foreground">{d.department_name || '—'}</span>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span className="text-xs text-muted-foreground">{d.position || d.role_title || '—'}</span>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <span className="text-xs text-muted-foreground capitalize">{d.employment_type?.replace('_', ' ') || '—'}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-center">
                            <span className={cn(
                              'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold',
                              isActive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                                       : 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                            )}>
                              {isActive ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                              {isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-center">
                            <Button
                              size="sm"
                              variant="outline"
                              className={cn(
                                'h-7 text-xs px-3 gap-1',
                                isActive
                                  ? 'border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 dark:hover:bg-rose-950/30'
                                  : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-300 dark:hover:bg-emerald-950/30'
                              )}
                              onClick={() => toggleStatus(record)}
                              disabled={isBusy}
                            >
                              {isBusy ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : isActive ? (
                                <><UserX className="w-3 h-3" />Deactivate</>
                              ) : (
                                <><UserCheck className="w-3 h-3" />Activate</>
                              )}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {paged.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-14 text-muted-foreground text-sm">
                        No employees found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Page {safePage} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 px-3"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={safePage <= 1}
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Prev
                </Button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const start = Math.max(1, Math.min(safePage - 2, totalPages - 4));
                  const pg = start + i;
                  if (pg > totalPages) return null;
                  return (
                    <Button
                      key={pg}
                      size="sm"
                      variant={pg === safePage ? 'default' : 'outline'}
                      className="h-8 w-8 p-0 text-xs"
                      onClick={() => setPage(pg)}
                    >
                      {pg}
                    </Button>
                  );
                })}
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 px-3"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={safePage >= totalPages}
                >
                  Next
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
