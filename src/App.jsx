// @ts-nocheck
import { useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster"
import { useVersionCheck } from '@/hooks/useVersionCheck';
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import AppLayout from '@/components/layout/AppLayout';

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

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin, authChecked } = useAuth();

  useEffect(() => {
    if (isLoadingAuth || isLoadingPublicSettings || !authChecked) return;
    if (authError?.type === 'auth_required') {
      navigateToLogin();
    }
  }, [authError, isLoadingAuth, isLoadingPublicSettings, authChecked]);

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-amber-200 border-t-amber-500 rounded-full animate-spin"></div>
          <p className="text-sm text-muted-foreground font-medium">Loading GLADEX System...</p>
        </div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      return null;
    }
  }

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/collectives" element={<Collectives />} />
        <Route path="/workflow" element={<Workflow />} />
        <Route path="/product-development" element={<ProductDevelopment />} />
        <Route path="/marketing" element={<Marketing />} />
        <Route path="/sales" element={<Sales />} />
        <Route path="/accounting" element={<Payments />} />
        <Route path="/admin-operations" element={<AdminOperations />} />
        <Route path="/user-management" element={<UserManagement />} />
        <Route path="/visa" element={<Visa />} />
        <Route path="/management" element={<Management />} />

        <Route path="/documents" element={<Documents />} />
        <Route path="/operations" element={<Operations />} />
        <Route path="/feedback" element={<Feedback />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

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
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AuthenticatedApp />
        </Router>
        <Toaster />
        <UpdateBanner />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;