import { Toaster } from "@/components/ui/toaster"
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

import Documents from './pages/Documents';
import Operations from './pages/Operations';
import Feedback from './pages/Feedback';
import Reports from './pages/Reports';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

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
      navigateToLogin();
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
        <Route path="/admin-operations" element={<AdminOperations />} />

        <Route path="/documents" element={<Documents />} />
        <Route path="/operations" element={<Operations />} />
        <Route path="/feedback" element={<Feedback />} />
        <Route path="/reports" element={<Reports />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;