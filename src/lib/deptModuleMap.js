// @ts-nocheck
// Maps department names (from Supabase) to allowed route paths

// System routes visible to all authenticated employees
const SYSTEM_ROUTES = ['/settings', '/notifications', '/feedback', '/help'];

// Super admin (role='super_admin') — fixed regardless of department
const SUPER_ADMIN_ROUTES = [
  '/',
  '/workflow',
  '/management',
  '/documents',
  '/feedback',
  '/reports',
  '/user-management',
  ...SYSTEM_ROUTES,
];

export const DEPT_MODULE_MAP = {
  'PRODUCT DEVELOPER': ['/', '/collectives', '/workflow', '/product-development', ...SYSTEM_ROUTES],
  'MARKETING':         ['/', '/marketing', '/workflow', ...SYSTEM_ROUTES],

  // Below departments: not yet finalized — keeping basic access for now
  'ACCOUNTING':        ['/', '/accounting', '/documents', ...SYSTEM_ROUTES],
  'ADMIN':             ['/', '/admin-operations', '/visa', '/documents', ...SYSTEM_ROUTES],
  'HR':                ['/', '/user-management', '/management', '/documents', ...SYSTEM_ROUTES],
  'CORPORATE':         ['/', '/management', '/reports', '/documents', ...SYSTEM_ROUTES],
  'OPERATIONS':        ['/', '/operations', '/documents', ...SYSTEM_ROUTES],
  'MAIN INTL':         ['/', '/sales', '/documents', ...SYSTEM_ROUTES],
  'MAIN DOMESTIC':     ['/', '/sales', '/documents', ...SYSTEM_ROUTES],
  'GTTC':              ['/', '/sales', '/documents', ...SYSTEM_ROUTES],
  'POTB':              ['/', '/sales', '/documents', ...SYSTEM_ROUTES],
  'ROBINSON':          ['/', '/sales', '/documents', ...SYSTEM_ROUTES],
  'SM MANILA':         ['/', '/sales', '/documents', ...SYSTEM_ROUTES],
  'GUARD':             ['/', '/documents', ...SYSTEM_ROUTES],
};

export function getAllowedRoutes(department, role) {
  const dept = (department || '').toUpperCase().trim();
  const deptRoutes = DEPT_MODULE_MAP[dept] || ['/', ...SYSTEM_ROUTES];
  if (role === 'super_admin') {
    // Merge super_admin fixed routes WITH their dept routes
    // So e.g. Christine (Product Dev + super_admin) gets Collectives + Management + User Management, etc.
    return [...new Set([...SUPER_ADMIN_ROUTES, ...deptRoutes])];
  }
  return [...new Set(deptRoutes)];
}

export function canAccess(department, path, role) {
  const allowed = getAllowedRoutes(department, role);
  return allowed.some(r => path === r || (r !== '/' && path.startsWith(r)));
}
