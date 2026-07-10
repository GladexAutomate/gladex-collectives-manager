// @ts-nocheck
import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import FloatingNotepad from './FloatingNotepad';
import { cn } from '@/lib/utils';

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
  '/admin-operations': 'Admin',
  '/user-management': 'User Management',
  '/visa': 'Visa & Documentation',
  '/management': 'Management',
};

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('gladex_dark_mode');
    return saved !== null ? saved === 'true' : true; // default dark
  });
  const [notepadOpen, setNotepadOpen] = useState(false);
  const location = useLocation();

  const pageTitle = pageTitles[location.pathname] || 'GLADEX System';

  // Close mobile drawer on route change
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  // Close mobile drawer on resize to desktop
  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 768) setMobileOpen(false); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('gladex_dark_mode', String(darkMode));
  }, [darkMode]);

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        onNotepadToggle={() => setNotepadOpen(v => !v)}
        notepadOpen={notepadOpen}
      />
      {notepadOpen && <FloatingNotepad onClose={() => setNotepadOpen(false)} />}

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div className={cn(
        "flex-1 flex flex-col min-h-screen transition-all duration-300",
        "md:ml-64",
        collapsed && "md:ml-16"
      )}>
        <TopBar
          pageTitle={pageTitle}
          darkMode={darkMode}
          onToggleDark={() => setDarkMode(!darkMode)}
          onMobileMenuToggle={() => setMobileOpen(v => !v)}
        />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
