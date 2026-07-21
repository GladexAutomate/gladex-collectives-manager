// @ts-nocheck
import { useState } from 'react';
import { Zap, Eye, EyeOff, Loader2 } from 'lucide-react';
import { sbFetchEmployeeByEmployeeId } from '@/lib/supabaseClient';
import { verifyPassword, setSession } from '@/lib/employeeAuth';

// dept param slug → display label + accent color
const DEPT_META = {
  'super-admin':       { label: 'Super Admin',         color: '#6d28d9' },
  'product-developer': { label: 'Product Developer',   color: '#8b5cf6' },
  'marketing':         { label: 'Marketing',            color: '#ec4899' },
  'accounting':        { label: 'Accounting',           color: '#10b981' },
  'admin':             { label: 'Admin',                color: '#f59e0b' },
  'hr':                { label: 'Human Resources',      color: '#3b82f6' },
  'corporate':         { label: 'Corporate',            color: '#6366f1' },
  'operations':        { label: 'Operations',           color: '#14b8a6' },
  'main-intl':         { label: 'Main Intl Sales',      color: '#f97316' },
  'main-domestic':     { label: 'Main Domestic Sales',  color: '#f97316' },
  'gttc':              { label: 'GTTC Sales',           color: '#f97316' },
  'potb':              { label: 'POTB Sales',           color: '#f97316' },
  'robinson':          { label: 'Robinson Sales',       color: '#f97316' },
  'sm-manila':         { label: 'SM Manila Sales',      color: '#f97316' },
  'guard':             { label: 'Security',             color: '#64748b' },
};

// Map slug → actual department_name value in Supabase
const DEPT_DB_NAME = {
  'product-developer': 'PRODUCT DEVELOPER',
  'marketing':         'MARKETING',
  'accounting':        'ACCOUNTING',
  'admin':             'ADMIN',
  'hr':                'HR',
  'corporate':         'CORPORATE',
  'operations':        'OPERATIONS',
  'main-intl':         'MAIN INTL',
  'main-domestic':     'MAIN DOMESTIC',
  'gttc':              'GTTC',
  'potb':              'POTB',
  'robinson':          'ROBINSON',
  'sm-manila':         'SM MANILA',
  'guard':             'GUARD',
};

export default function EmployeeLogin({ onLogin, deptSlug }) {
  const meta    = deptSlug ? DEPT_META[deptSlug] : null;
  const dbDept  = deptSlug ? DEPT_DB_NAME[deptSlug] : null;
  const accent  = meta?.color || '#8b5cf6';

  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword]     = useState('');
  const [showPass, setShowPass]     = useState(false);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!employeeId.trim() || !password.trim()) {
      setError('Employee ID and password are required.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const record = await sbFetchEmployeeByEmployeeId(employeeId.trim());
      if (!record) {
        setError('Employee ID not found.');
        setLoading(false);
        return;
      }

      // Dept check — only if link is dept-specific
      if (dbDept && (record.department_name || '').toUpperCase().trim() !== dbDept) {
        setError(`This login link is for ${meta.label} employees only.`);
        setLoading(false);
        return;
      }

      if (!record.password_hash || !record.password_salt) {
        setError('No password set for this account. Contact your administrator.');
        setLoading(false);
        return;
      }
      if ((record.status || 'active') !== 'active') {
        setError('This account has been deactivated. Contact your administrator.');
        setLoading(false);
        return;
      }
      const ok = await verifyPassword(password, record.password_salt, record.password_hash);
      if (!ok) {
        setError('Incorrect password.');
        setLoading(false);
        return;
      }
      setSession(record);
      onLogin(record);
    } catch (err) {
      setError('Login failed. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6">

        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl"
            style={{ background: `linear-gradient(135deg, ${accent}cc, ${accent})`, boxShadow: `0 8px 24px ${accent}55` }}>
            <Zap className="w-7 h-7 text-white" />
          </div>
          <div className="text-center">
            <p className="text-xl font-black font-jakarta"
              style={{ background: `linear-gradient(90deg,#e9d5ff,${accent})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Collectives
            </p>
            <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: accent }}>Checklists ✦</p>
          </div>
        </div>

        {/* Dept badge */}
        {meta && (
          <div className="flex justify-center">
            <span className="px-4 py-1.5 rounded-full text-xs font-bold tracking-wide text-white"
              style={{ background: `linear-gradient(135deg,${accent}cc,${accent})` }}>
              {meta.label} Portal
            </span>
          </div>
        )}

        {/* Card */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-lg space-y-4">
          <div className="text-center">
            <h2 className="text-lg font-bold text-foreground">Employee Login</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Sign in with your Employee ID and password</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Employee ID</label>
              <input
                type="text"
                value={employeeId}
                onChange={e => setEmployeeId(e.target.value)}
                placeholder="e.g. 194"
                className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2"
                style={{ '--tw-ring-color': accent }}
                autoComplete="username"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full h-10 px-3 pr-10 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2"
                  autoComplete="current-password"
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-xl px-3 py-2">
                <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ background: `linear-gradient(135deg,${accent}cc,${accent})` }}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="text-center text-[11px] text-muted-foreground">
          Forgot password? Contact your administrator.
        </p>
      </div>
    </div>
  );
}
