import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { cn } from '@/lib/utils';
import { useLocation } from 'react-router-dom';

const pageTitles = {
  '/': 'Executive Dashboard',
  '/collectives': 'Collectives',
  '/workflow': 'Workflow Checklist',
  '/product-development': 'Product Development',
  '/marketing': 'Marketing',
  '/sales': 'Sales & Reservations',
  '/payments': 'Payments & Accounting',
  '/documents': 'Documentation & Visa',
  '/operations': 'Operations',
  '/feedback': 'Client Feedback',
  '/reports': 'Reports',
  '/notifications': 'Notifications',
  '/settings': 'Settings',
};

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const location = useLocation();

  const pageTitle = pageTitles[location.pathname] || 'GLADEX System';

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <div className={cn(
        "flex-1 flex flex-col min-h-screen transition-all duration-300",
        collapsed ? "ml-16" : "ml-64"
      )}>
        <TopBar pageTitle={pageTitle} darkMode={darkMode} onToggleDark={() => setDarkMode(!darkMode)} />
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}