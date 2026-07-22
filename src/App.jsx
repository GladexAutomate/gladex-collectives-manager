// @ts-nocheck
import { useState, useContext } from 'react';
import { Toaster } from "@/components/ui/toaster"
import { useVersionCheck } from '@/hooks/useVersionCheck';
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation, useSearchParams } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import AppLayout from '@/components/layout/AppLayout';
import { getSession, clearSession } from '@/lib/employeeAuth';

const DEPT_TO_SLUG = {
  'PRODUCT DEVELOPER': 'product-developer',
  'MARKETING':         'marketing',
  'ADMIN':             'admin',
  'HR':                'hr',
  'CORPORATE':         'corporate',
  'OPERATIONS':        'operations',
  'ACCOUNTING':        'accounting',
  'MAIN INTL':         'main-intl',
  'MAIN DOMESTIC':     'main-domestic',
  'GTTC':              'gttc',
  'POTB':              'potb',
  'ROBINSON':          'robinson',
  'SM MANILA':         'sm-manila',
  'GUARD':             'guard',
};
import { canAccess } from '@/lib/deptModuleMap';
import { EmployeeSessionContext } from '@/lib/employeeSessionContext';
import EmployeeLogin from './pages/EmployeeLogin';

import Dashboard from './pages/Dashboard';
import Collectives from './pages/Collectives';
import Workflow from './pages/Workflow';
import ProductDevelopment from './pages/ProductDevelopment';
import Marketing from './pages/Marketing';
import AdminOperations from './pages/AdminOperations';
import UserManagement from './pages/UserManagement';
import Visa from './pages/Visa';
import Management from './pages/Management';
import Documents from './pages/Documents';
import Operations from './pages/Operations';
import Feedback from './pages/Feedback';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Sales from './pages/Sales';
import Payments from './pages/Payments';
import Notifications from './pages/Notifications';

// Reads ?dept from URL — used by the /login route
function LoginRoute({ onLogin }) {
  const [searchParams] = useSearchParams();
  const deptSlug = searchParams.get('dept') || '';
  return <EmployeeLogin onLogin={onLogin} deptSlug={deptSlug} />;
}

// Guard: redirect to / if employee can't access this path
function EmployeeGuard({ children }) {
  const ctx = useContext(EmployeeSessionContext);
  const location = useLocation();
  if (ctx?.session && !canAccess(ctx.session.department, location.pathname, ctx.session.role)) {
    return <Navigate to="/" replace />;
  }
  return children;
}

// Super Admin app (base44 auth)
const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, authChecked } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth || !authChecked) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-amber-200 border-t-amber-500 rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground font-medium">Loading GLADEX System...</p>
        </div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') return <UserNotRegisteredError />;
    if (authError.type === 'auth_required') return <Navigate to="/login" replace />;
  }

  return (
    <Routes>
      <Route element={<AppLayout isSuperAdmin />}>
        <Route path="/"                  element={<Dashboard />} />
        <Route path="/collectives"        element={<Collectives />} />
        <Route path="/workflow"           element={<Workflow />} />
        <Route path="/product-development" element={<ProductDevelopment />} />
        <Route path="/marketing"          element={<Marketing />} />
        <Route path="/sales"              element={<Sales />} />
        <Route path="/accounting"         element={<Payments />} />
        <Route path="/admin-operations"   element={<AdminOperations />} />
        <Route path="/user-management"    element={<UserManagement />} />
        <Route path="/visa"               element={<Visa />} />
        <Route path="/management"         element={<Management />} />
        <Route path="/documents"          element={<Documents />} />
        <Route path="/operations"         element={<Operations />} />
        <Route path="/feedback"           element={<Feedback />} />
        <Route path="/reports"            element={<Reports />} />
        <Route path="/settings"           element={<Settings />} />
        <Route path="/notifications"      element={<Notifications />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

// Employee app (Supabase auth, dept-filtered)
const EmployeeRoutedApp = () => (
  <Routes>
    <Route element={<AppLayout />}>
      <Route path="/"                   element={<Dashboard />} />
      <Route path="/collectives"         element={<EmployeeGuard><Collectives /></EmployeeGuard>} />
      <Route path="/workflow"            element={<EmployeeGuard><Workflow /></EmployeeGuard>} />
      <Route path="/product-development" element={<EmployeeGuard><ProductDevelopment /></EmployeeGuard>} />
      <Route path="/marketing"           element={<EmployeeGuard><Marketing /></EmployeeGuard>} />
      <Route path="/sales"               element={<EmployeeGuard><Sales /></EmployeeGuard>} />
      <Route path="/accounting"          element={<EmployeeGuard><Payments /></EmployeeGuard>} />
      <Route path="/admin-operations"    element={<EmployeeGuard><AdminOperations /></EmployeeGuard>} />
      <Route path="/user-management"     element={<EmployeeGuard><UserManagement /></EmployeeGuard>} />
      <Route path="/visa"                element={<EmployeeGuard><Visa /></EmployeeGuard>} />
      <Route path="/management"          element={<EmployeeGuard><Management /></EmployeeGuard>} />
      <Route path="/documents"           element={<EmployeeGuard><Documents /></EmployeeGuard>} />
      <Route path="/operations"          element={<EmployeeGuard><Operations /></EmployeeGuard>} />
      <Route path="/feedback"            element={<EmployeeGuard><Feedback /></EmployeeGuard>} />
      <Route path="/reports"             element={<EmployeeGuard><Reports /></EmployeeGuard>} />
      <Route path="/settings"            element={<Settings />} />
      <Route path="/notifications"       element={<Notifications />} />
    </Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

function UpdateBanner() {
  const updateAvailable = useVersionCheck();
  if (!updateAvailable) return null;
  return (
    <div
      style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9999, background: '#6d28d9', color: '#fff', textAlign: 'center', padding: '10px 16px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}
      onClick={() => window.location.reload()}
    >
      <span>🔄 New version available</span>
      <span style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '6px', padding: '2px 12px', fontSize: '12px' }}>Click to refresh</span>
    </div>
  );
}

function App() {
  const [employeeSession, setEmployeeSession] = useState(() => getSession());

  const handleEmployeeLogin  = () => setEmployeeSession(getSession());
  const handleEmployeeLogout = () => {
    const dept = employeeSession?.department || '';
    const role = employeeSession?.role || '';
    const slug = role === 'super_admin'
      ? 'super-admin'
      : (DEPT_TO_SLUG[(dept).toUpperCase().trim()] || '');
    clearSession();
    setEmployeeSession(null);
    window.location.href = slug ? `/login?dept=${slug}` : '/login';
  };

  const ctxValue = employeeSession
    ? { session: employeeSession, onLogout: handleEmployeeLogout }
    : null;

  return (
    <EmployeeSessionContext.Provider value={ctxValue}>
      <QueryClientProvider client={queryClientInstance}>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            {/* /login — always show login form so employees can switch accounts */}
            <Route path="/login" element={
              <LoginRoute onLogin={handleEmployeeLogin} />
            } />

            {/* Everything else — AuthProvider only loads here, not on /login */}
            <Route path="/*" element={
              employeeSession
                ? <EmployeeRoutedApp />
                : <AuthProvider><AuthenticatedApp /></AuthProvider>
            } />
          </Routes>
          <Toaster />
          <UpdateBanner />
        </Router>
      </QueryClientProvider>
    </EmployeeSessionContext.Provider>
  );
}

export default App;
