// @ts-nocheck
import { useState, useEffect, useMemo, useContext, useRef } from 'react';
import {
  Search, RefreshCw, Loader2, CheckCircle, XCircle,
  UserCheck, UserX, Users, ChevronLeft, ChevronRight,
  KeyRound, UserPlus, Eye, EyeOff, X, Pencil, Camera,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  sbFetchEmployees, sbSetEmployeeStatus, sbSetEmployeePassword,
  sbAddEmployee, sbUpdateEmployee, sbUploadAvatar,
} from '@/lib/supabaseClient';
import { hashPassword, generateSalt } from '@/lib/employeeAuth';
import { EmployeeSessionContext } from '@/lib/employeeSessionContext';

const PAGE_SIZE = 30;

const DEPT_OPTIONS = [
  'PRODUCT DEVELOPER','MARKETING','ACCOUNTING','ADMIN','HR','CORPORATE',
  'OPERATIONS','MAIN INTL','MAIN DOMESTIC','GTTC','POTB','ROBINSON','SM MANILA','GUARD',
];

const DEPT_PASSWORDS = {
  'PRODUCT DEVELOPER': 'Prism75@Vault9',
  'MARKETING':         'Slate45@Ridge3',
  'ACCOUNTING':        'Lunar89@Ridge7',
  'ADMIN':             'Slate34!Grove7',
  'HR':                'Solar45!Ridge8',
  'CORPORATE':         'Brisk54!Tower4',
  'OPERATIONS':        '',
  'MAIN INTL':         'Jade56!Creek4',
  'MAIN DOMESTIC':     'Tidal44&Grove4',
  'GTTC':              'Maple27!Scout9',
  'POTB':              'Ivory62$Storm5',
  'ROBINSON':          'Brisk49$Shard8',
  'SM MANILA':         'Quartz25&Pulse3',
  'GUARD':             'Slate66!Crest4',
};

const INPUT_CLS = 'w-full h-10 px-3 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500';

function Avatar({ name, id, photoUrl, size = 'sm' }) {
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
  const cls = size === 'lg'
    ? 'w-16 h-16 rounded-full flex-shrink-0 font-bold text-2xl flex items-center justify-center'
    : 'w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm';
  if (photoUrl) {
    return <img src={photoUrl} alt={name} className={cn(cls, 'object-cover')} />;
  }
  return <div className={cn(cls, color)}>{initials}</div>;
}

function Modal({ title, onClose, children, wide = false }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4 overflow-y-auto" onClick={onClose}>
      <div className={cn('bg-card border border-border rounded-2xl w-full shadow-2xl my-8', wide ? 'max-w-xl' : 'max-w-md')} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="font-bold text-foreground">{title}</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function FieldRow({ label, children }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}

export default function UserManagement() {
  const empCtx     = useContext(EmployeeSessionContext);
  const isSuperAdmin = true; // User Management is already admin-only; show all controls

  const [employees, setEmployees]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [search, setSearch]         = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter]     = useState('all');
  const [roleFilter, setRoleFilter]     = useState('all');
  const [deptFilter, setDeptFilter]     = useState('all');
  const [updating, setUpdating]     = useState(new Set());
  const [page, setPage]             = useState(1);

  // Password modal
  const [pwdModal, setPwdModal]   = useState(null);
  const [newPwd, setNewPwd]       = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [showPwd, setShowPwd]     = useState(false);
  const [pwdSaving, setPwdSaving] = useState(false);

  // Add modal
  const [addModal, setAddModal] = useState(false);
  const [addForm, setAddForm]   = useState({
    employee_id: '', first_name: '', last_name: '', middle_name: '',
    email: '', department_name: '', position: '', role: '',
    employment_type: '', password: '',
  });
  const [addSaving, setAddSaving] = useState(false);

  // Edit modal
  const [editModal, setEditModal]       = useState(null);
  const [editForm, setEditForm]         = useState({});
  const [editSaving, setEditSaving]     = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef(null);

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

  // ── Edit ──────────────────────────────────────────────────────────────
  const openEdit = (emp) => {
    setEditForm({
      first_name:      emp.first_name      || '',
      last_name:       emp.last_name       || '',
      middle_name:     emp.middle_name     || '',
      email:           emp.email           || '',
      department_name: emp.department_name || '',
      position:        emp.position        || '',
      role:            emp.role            || '',
      employment_type: emp.employment_type || '',
      photo_url:       emp.photo_url       || '',
    });
    setEditModal(emp);
  };

  const handleAvatarUpload = async (file) => {
    if (!editModal) return;
    setUploadingAvatar(true);
    try {
      const url = await sbUploadAvatar(editModal.employee_id || editModal.id, file);
      setEditForm(f => ({ ...f, photo_url: url }));
      await sbUpdateEmployee(editModal.id, { photo_url: url });
      setEmployees(prev => prev.map(e => e.id === editModal.id ? { ...e, photo_url: url } : e));
      toast.success('Photo updated');
    } catch (e) {
      toast.error('Upload failed: ' + e.message);
    }
    setUploadingAvatar(false);
  };

  const handleEditSave = async () => {
    if (!editForm.first_name.trim() || !editForm.last_name.trim()) {
      toast.error('First Name and Last Name are required');
      return;
    }
    setEditSaving(true);
    try {
      const name = [editForm.first_name.trim(), editForm.last_name.trim()].filter(Boolean).join(' ');
      const updates = {
        first_name:      editForm.first_name.trim(),
        last_name:       editForm.last_name.trim(),
        middle_name:     editForm.middle_name.trim() || null,
        name,
        email:           editForm.email.trim().toLowerCase() || null,
        department_name: editForm.department_name || null,
        position:        editForm.position.trim() || null,
        role_title:      editForm.position.trim() || null,
        role:            editForm.role || '',
        employment_type: editForm.employment_type || null,
      };
      const ok = await sbUpdateEmployee(editModal.id, updates);
      if (ok) {
        setEmployees(prev => prev.map(e => e.id === editModal.id ? { ...e, ...updates } : e));
        toast.success('Employee updated');
        setEditModal(null);
      } else {
        toast.error('Update failed — check Supabase RLS');
      }
    } catch (e) {
      toast.error('Error: ' + e.message);
    }
    setEditSaving(false);
  };

  // ── Status toggle ──────────────────────────────────────────────────────
  const toggleStatus = async (emp) => {
    const next = (emp.status || 'active') === 'active' ? 'inactive' : 'active';
    const name = [emp.first_name?.trim(), emp.last_name?.trim()].filter(Boolean).join(' ') || 'Employee';
    setUpdating(prev => new Set([...prev, emp.id]));
    const ok = await sbSetEmployeeStatus(emp.id, next);
    if (ok) {
      setEmployees(prev => prev.map(e => e.id === emp.id ? { ...e, status: next } : e));
      toast.success(`${name} marked as ${next}`);
    } else {
      toast.error('Failed to update — check Supabase RLS policies');
    }
    setUpdating(prev => { const s = new Set(prev); s.delete(emp.id); return s; });
  };

  // ── Password ───────────────────────────────────────────────────────────
  const handleSetPassword = async () => {
    if (!newPwd)             { toast.error('Enter a password'); return; }
    if (newPwd.length < 6)   { toast.error('Password must be at least 6 characters'); return; }
    if (newPwd !== confirmPwd) { toast.error('Passwords do not match'); return; }
    setPwdSaving(true);
    try {
      const salt = generateSalt();
      const hash = await hashPassword(newPwd, salt);
      const ok   = await sbSetEmployeePassword(pwdModal.id, hash, salt);
      if (ok) {
        toast.success('Password set successfully');
        setPwdModal(null);
        setNewPwd(''); setConfirmPwd('');
      } else {
        toast.error('Failed — check Supabase RLS');
      }
    } catch (e) {
      toast.error('Error: ' + e.message);
    }
    setPwdSaving(false);
  };

  // ── Add employee ───────────────────────────────────────────────────────
  const handleAddEmployee = async () => {
    if (!addForm.employee_id.trim() || !addForm.first_name.trim() || !addForm.last_name.trim()) {
      toast.error('Employee ID, First Name, and Last Name are required');
      return;
    }
    if (!addForm.department_name) { toast.error('Please select a department'); return; }
    setAddSaving(true);
    try {
      const payload = {
        employee_id:     addForm.employee_id.trim(),
        first_name:      addForm.first_name.trim(),
        last_name:       addForm.last_name.trim(),
        middle_name:     addForm.middle_name.trim() || null,
        name:            [addForm.first_name.trim(), addForm.last_name.trim()].join(' '),
        email:           addForm.email.trim().toLowerCase() || null,
        department_name: addForm.department_name,
        position:        addForm.position.trim() || null,
        role_title:      addForm.position.trim() || null,
        role:            addForm.role || '',
        employment_type: addForm.employment_type || null,
        status:          'active',
      };
      if (addForm.password) {
        const salt = generateSalt();
        const hash = await hashPassword(addForm.password, salt);
        payload.password_hash = hash;
        payload.password_salt = salt;
      }
      await sbAddEmployee(payload);
      toast.success(`${payload.name} added successfully`);
      setAddModal(false);
      setAddForm({ employee_id: '', first_name: '', last_name: '', middle_name: '', email: '', department_name: '', position: '', role: '', employment_type: '', password: '' });
      load();
    } catch (e) {
      toast.error('Failed to add: ' + e.message);
    }
    setAddSaving(false);
  };

  // ── Derived lists ──────────────────────────────────────────────────────
  const uniqueDepts = useMemo(() => {
    const s = new Set(employees.map(r => r.department_name).filter(Boolean));
    return [...s].sort();
  }, [employees]);

  const uniqueRoles = useMemo(() => {
    const s = new Set(employees.map(r => r.position || r.role_title).filter(Boolean));
    return [...s].sort();
  }, [employees]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return employees.filter(emp => {
      const nameStr = `${emp.first_name || ''} ${emp.middle_name || ''} ${emp.last_name || ''} ${emp.employee_id || ''}`.toLowerCase();
      const role    = (emp.position || emp.role_title || '').toLowerCase();
      const dept    = (emp.department_name || '').toLowerCase();
      const matchSearch = !q || nameStr.includes(q) || (emp.email || '').toLowerCase().includes(q) || role.includes(q) || dept.includes(q);
      const matchStatus = statusFilter === 'all' || (emp.status || 'active') === statusFilter;
      const matchType   = typeFilter === 'all' || emp.employment_type === typeFilter;
      const matchRole   = roleFilter === 'all' || (emp.position || emp.role_title) === roleFilter;
      const matchDept   = deptFilter === 'all' || emp.department_name === deptFilter;
      return matchSearch && matchStatus && matchType && matchRole && matchDept;
    });
  }, [employees, search, statusFilter, typeFilter, roleFilter, deptFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const paged      = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [search, statusFilter, typeFilter, roleFilter, deptFilter]);

  const activeCount   = employees.filter(e => (e.status || 'active') === 'active').length;
  const inactiveCount = employees.length - activeCount;

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5 pb-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-jakarta text-foreground">User Management</h2>
          <p className="text-sm text-muted-foreground">Manage employee accounts and activation status</p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          {isSuperAdmin && (
            <Button size="sm" onClick={() => setAddModal(true)}
              className="gap-1.5 text-white"
              style={{ background: 'linear-gradient(135deg,#6d28d9,#a855f7)' }}>
              <UserPlus className="w-3.5 h-3.5" />
              Add Employee
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={cn('w-3.5 h-3.5 mr-1.5', loading && 'animate-spin')} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total', count: employees.length, filter: 'all', color: 'amber' },
          { label: 'Active', count: activeCount, filter: 'active', color: 'emerald' },
          { label: 'Inactive', count: inactiveCount, filter: 'inactive', color: 'rose' },
        ].map(({ label, count, filter, color }) => (
          <div key={filter} onClick={() => setStatusFilter(filter)}
            className={cn('border border-border rounded-2xl p-4 text-center cursor-pointer transition-all',
              statusFilter === filter
                ? `border-${color}-400 bg-${color}-50 dark:bg-${color}-950/20`
                : 'bg-card hover:bg-muted/40')}>
            <p className={cn('text-2xl font-bold',
              filter === 'active' ? 'text-emerald-600 dark:text-emerald-400'
              : filter === 'inactive' ? 'text-rose-600 dark:text-rose-400'
              : 'text-foreground')}>{count}</p>
            <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
              {filter === 'active' ? <CheckCircle className="w-3 h-3 text-emerald-500" />
               : filter === 'inactive' ? <XCircle className="w-3 h-3 text-rose-500" />
               : <Users className="w-3 h-3" />}
              {label}
            </p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input className="pl-9 h-9 text-sm" placeholder="Search name, ID, email, role, dept…"
            value={search} onChange={e => setSearch(e.target.value)} />
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
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide hidden sm:table-cell">Employee ID</th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide hidden sm:table-cell">Department</th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">Role</th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide hidden lg:table-cell">Type</th>
                    <th className="text-center px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                    <th className="text-center px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {paged.map(emp => {
                    const name     = [emp.first_name?.trim(), emp.last_name?.trim()].filter(Boolean).join(' ') || '—';
                    const isActive = (emp.status || 'active') === 'active';
                    const isBusy   = updating.has(emp.id);
                    const hasPwd   = !!emp.password_hash;
                    return (
                      <tr key={emp.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar name={name} id={emp.id} photoUrl={emp.photo_url} />
                            <div className="min-w-0">
                              <p className="font-semibold text-foreground text-sm truncate">{name}</p>
                              {emp.email && <p className="text-[10px] text-muted-foreground truncate">{emp.email}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <span className="text-xs font-mono font-semibold text-violet-600 dark:text-violet-400">{emp.employee_id || '—'}</span>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <span className="text-xs font-medium text-foreground">{emp.department_name || '—'}</span>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span className="text-xs text-muted-foreground">{emp.position || emp.role_title || '—'}</span>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <span className="text-xs text-muted-foreground capitalize">{emp.employment_type?.replace('_', ' ') || '—'}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-center">
                            <span className={cn(
                              'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold',
                              isActive
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                                : 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                            )}>
                              {isActive ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                              {isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 min-w-[200px]">
                          <div className="flex justify-end items-center gap-1.5">
                            <Button size="sm" variant="outline"
                              className="h-7 text-xs px-2 gap-1 border-sky-200 text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950/30"
                              onClick={() => openEdit(emp)}>
                              <Pencil className="w-3 h-3" /> Edit
                            </Button>
                            <Button size="sm" variant="outline"
                              className={cn('h-7 text-xs px-2 gap-1', hasPwd
                                ? 'border-violet-200 text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-950/30'
                                : 'border-amber-200 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30'
                              )}
                              onClick={() => { setPwdModal(emp); setNewPwd(''); setConfirmPwd(''); setShowPwd(false); }}>
                              <KeyRound className="w-3 h-3" />
                              {hasPwd ? 'Pwd' : 'Set Pwd'}
                            </Button>
                            <Button size="sm" variant="outline"
                              className={cn('h-7 text-xs px-3 gap-1',
                                isActive
                                  ? 'border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 dark:hover:bg-rose-950/30'
                                  : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-300 dark:hover:bg-emerald-950/30'
                              )}
                              onClick={() => toggleStatus(emp)} disabled={isBusy}>
                              {isBusy ? <Loader2 className="w-3 h-3 animate-spin" />
                                : isActive ? <><UserX className="w-3 h-3" />Deactivate</>
                                : <><UserCheck className="w-3 h-3" />Activate</>}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {paged.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-14 text-muted-foreground text-sm">No employees found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Page {safePage} of {totalPages}</p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="h-8 px-3"
                  onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage <= 1}>
                  <ChevronLeft className="w-3.5 h-3.5" /> Prev
                </Button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const start = Math.max(1, Math.min(safePage - 2, totalPages - 4));
                  const pg = start + i;
                  if (pg > totalPages) return null;
                  return (
                    <Button key={pg} size="sm" variant={pg === safePage ? 'default' : 'outline'}
                      className="h-8 w-8 p-0 text-xs" onClick={() => setPage(pg)}>{pg}</Button>
                  );
                })}
                <Button size="sm" variant="outline" className="h-8 px-3"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage >= totalPages}>
                  Next <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ═══ EDIT MODAL ═══ */}
      {editModal && (
        <Modal
          title={`Edit — ${[editModal.first_name, editModal.last_name].filter(Boolean).join(' ') || editModal.employee_id}`}
          onClose={() => setEditModal(null)} wide>
          <div className="space-y-4">
            {/* Photo */}
            <div className="flex justify-center">
              <div className="relative group cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
                <Avatar
                  name={[editForm.first_name, editForm.last_name].filter(Boolean).join(' ') || '?'}
                  id={editModal.id} photoUrl={editForm.photo_url} size="lg" />
                <div className="absolute inset-0 rounded-full bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  {uploadingAvatar
                    ? <Loader2 className="w-5 h-5 text-white animate-spin" />
                    : <><Camera className="w-5 h-5 text-white" /><span className="text-[9px] text-white mt-0.5">Upload</span></>}
                </div>
                <input ref={avatarInputRef} type="file" accept="image/*" className="hidden"
                  onChange={e => { if (e.target.files?.[0]) handleAvatarUpload(e.target.files[0]); e.target.value = ''; }} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FieldRow label="First Name *">
                <input value={editForm.first_name} onChange={e => setEditForm(f => ({ ...f, first_name: e.target.value }))} className={INPUT_CLS} />
              </FieldRow>
              <FieldRow label="Last Name *">
                <input value={editForm.last_name} onChange={e => setEditForm(f => ({ ...f, last_name: e.target.value }))} className={INPUT_CLS} />
              </FieldRow>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FieldRow label="Middle Name">
                <input value={editForm.middle_name} onChange={e => setEditForm(f => ({ ...f, middle_name: e.target.value }))} className={INPUT_CLS} />
              </FieldRow>
              <FieldRow label="Employee ID">
                <input value={editModal.employee_id || ''} disabled className={cn(INPUT_CLS, 'opacity-50 cursor-not-allowed font-mono')} />
              </FieldRow>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FieldRow label="Email">
                <input type="email" value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} className={INPUT_CLS} />
              </FieldRow>
              <FieldRow label="Employment Type">
                <select value={editForm.employment_type} onChange={e => setEditForm(f => ({ ...f, employment_type: e.target.value }))} className={INPUT_CLS}>
                  <option value="">— not set —</option>
                  <option value="regular">Regular</option>
                  <option value="probationary">Probationary</option>
                  <option value="contractual">Contractual</option>
                  <option value="part_time">Part-time</option>
                </select>
              </FieldRow>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FieldRow label="Department">
                <select value={editForm.department_name} onChange={e => setEditForm(f => ({ ...f, department_name: e.target.value }))} className={INPUT_CLS}>
                  <option value="">— not set —</option>
                  {DEPT_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </FieldRow>
              <FieldRow label="System Role">
                <select value={editForm.role} onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))} className={INPUT_CLS}>
                  <option value="">Regular Employee</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </FieldRow>
            </div>
            <FieldRow label="Job Title / Position">
              <input value={editForm.position} onChange={e => setEditForm(f => ({ ...f, position: e.target.value }))} className={INPUT_CLS} placeholder="e.g. Travel Consultant" />
            </FieldRow>
            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1" onClick={() => setEditModal(null)}>Cancel</Button>
              <Button className="flex-1 text-white gap-1.5" disabled={editSaving}
                style={{ background: 'linear-gradient(135deg,#6d28d9,#a855f7)' }}
                onClick={handleEditSave}>
                {editSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Pencil className="w-3.5 h-3.5" />}
                Save Changes
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ═══ PASSWORD MODAL ═══ */}
      {pwdModal && (
        <Modal
          title={`Set Password — ${[pwdModal.first_name, pwdModal.last_name].filter(Boolean).join(' ') || pwdModal.employee_id}`}
          onClose={() => setPwdModal(null)}>
          <div className="space-y-4">
            <div className="bg-muted/40 rounded-xl px-3 py-2 text-xs text-muted-foreground">
              Employee ID: <span className="font-semibold text-foreground">{pwdModal.employee_id || '—'}</span>
              &nbsp;·&nbsp; Dept: <span className="font-semibold text-foreground">{pwdModal.department_name || '—'}</span>
            </div>
            <FieldRow label="New Password">
              <div className="relative">
                <input type={showPwd ? 'text' : 'password'} value={newPwd}
                  onChange={e => setNewPwd(e.target.value)} placeholder="Min 6 characters"
                  className={cn(INPUT_CLS, 'pr-10')} />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </FieldRow>
            <FieldRow label="Confirm Password">
              <input type={showPwd ? 'text' : 'password'} value={confirmPwd}
                onChange={e => setConfirmPwd(e.target.value)} placeholder="Re-enter password"
                className={INPUT_CLS} />
            </FieldRow>
            {confirmPwd && newPwd !== confirmPwd && (
              <p className="text-xs text-rose-500">Passwords do not match</p>
            )}
            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1" onClick={() => setPwdModal(null)}>Cancel</Button>
              <Button className="flex-1 text-white gap-1.5" disabled={pwdSaving || newPwd.length < 6 || newPwd !== confirmPwd}
                style={{ background: 'linear-gradient(135deg,#6d28d9,#a855f7)' }}
                onClick={handleSetPassword}>
                {pwdSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <KeyRound className="w-3.5 h-3.5" />}
                Save Password
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ═══ ADD EMPLOYEE MODAL ═══ */}
      {addModal && (
        <Modal title="Add New Employee" onClose={() => setAddModal(false)} wide>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <FieldRow label="Employee ID *">
                <input value={addForm.employee_id}
                  onChange={e => setAddForm(f => ({ ...f, employee_id: e.target.value }))}
                  placeholder="e.g. GDX2026-0400"
                  className={cn(INPUT_CLS, 'font-mono font-semibold')} />
              </FieldRow>
              <FieldRow label="Employment Type">
                <select value={addForm.employment_type} onChange={e => setAddForm(f => ({ ...f, employment_type: e.target.value }))} className={INPUT_CLS}>
                  <option value="">— not set —</option>
                  <option value="regular">Regular</option>
                  <option value="probationary">Probationary</option>
                  <option value="contractual">Contractual</option>
                  <option value="part_time">Part-time</option>
                </select>
              </FieldRow>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FieldRow label="First Name *">
                <input value={addForm.first_name} onChange={e => setAddForm(f => ({ ...f, first_name: e.target.value }))} placeholder="First name" className={INPUT_CLS} />
              </FieldRow>
              <FieldRow label="Last Name *">
                <input value={addForm.last_name} onChange={e => setAddForm(f => ({ ...f, last_name: e.target.value }))} placeholder="Last name" className={INPUT_CLS} />
              </FieldRow>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FieldRow label="Middle Name">
                <input value={addForm.middle_name} onChange={e => setAddForm(f => ({ ...f, middle_name: e.target.value }))} placeholder="Middle name" className={INPUT_CLS} />
              </FieldRow>
              <FieldRow label="Email">
                <input type="email" value={addForm.email} onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))} placeholder="email@gladex.com" className={INPUT_CLS} />
              </FieldRow>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FieldRow label="Department *">
                <select value={addForm.department_name}
                  onChange={e => {
                    const dept = e.target.value;
                    setAddForm(f => ({ ...f, department_name: dept, password: DEPT_PASSWORDS[dept] || '' }));
                  }} className={INPUT_CLS}>
                  <option value="">Select dept…</option>
                  {DEPT_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </FieldRow>
              <FieldRow label="System Role">
                <select value={addForm.role} onChange={e => setAddForm(f => ({ ...f, role: e.target.value }))} className={INPUT_CLS}>
                  <option value="">Regular Employee</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </FieldRow>
            </div>
            <FieldRow label="Job Title / Position">
              <input value={addForm.position} onChange={e => setAddForm(f => ({ ...f, position: e.target.value }))}
                placeholder="e.g. Travel Consultant" className={INPUT_CLS} />
            </FieldRow>
            <FieldRow label="Login Password">
              <input type="text" value={addForm.password} onChange={e => setAddForm(f => ({ ...f, password: e.target.value }))}
                placeholder="Auto-filled from dept shared password"
                className={cn(INPUT_CLS, 'font-mono')} />
              {addForm.department_name && DEPT_PASSWORDS[addForm.department_name] && (
                <p className="text-[10px] text-emerald-500 mt-0.5">Auto-filled with {addForm.department_name} shared password</p>
              )}
            </FieldRow>
            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1" onClick={() => setAddModal(false)}>Cancel</Button>
              <Button className="flex-1 text-white gap-1.5" disabled={addSaving}
                style={{ background: 'linear-gradient(135deg,#6d28d9,#a855f7)' }}
                onClick={handleAddEmployee}>
                {addSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
                Add Employee
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
