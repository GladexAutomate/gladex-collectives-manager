// ── Shared department configuration ──────────────────────────────────────────
// Single source of truth for all department metadata used across modules.

export const DEPARTMENTS = {
  product_development: { key: 'product_development', label: 'Product Development', short: 'PD', bg: 'bg-amber-500',   text: 'text-amber-700 dark:text-amber-400',   light: 'bg-amber-50 dark:bg-amber-950/20',   border: 'border-amber-200 dark:border-amber-800',   badge: 'bg-amber-100 text-amber-700',   ring: 'ring-amber-400' },
  marketing:           { key: 'marketing',           label: 'Marketing',           short: 'MK', bg: 'bg-pink-500',    text: 'text-pink-700 dark:text-pink-400',     light: 'bg-pink-50 dark:bg-pink-950/20',     border: 'border-pink-200 dark:border-pink-800',     badge: 'bg-pink-100 text-pink-700',     ring: 'ring-pink-400' },
  sales:               { key: 'sales',               label: 'Sales',               short: 'SL', bg: 'bg-emerald-500', text: 'text-emerald-700 dark:text-emerald-400', light: 'bg-emerald-50 dark:bg-emerald-950/20', border: 'border-emerald-200 dark:border-emerald-800', badge: 'bg-emerald-100 text-emerald-700', ring: 'ring-emerald-400' },
  accounting:          { key: 'accounting',          label: 'Accounting',          short: 'AC', bg: 'bg-purple-500',  text: 'text-purple-700 dark:text-purple-400', light: 'bg-purple-50 dark:bg-purple-950/20', border: 'border-purple-200 dark:border-purple-800', badge: 'bg-purple-100 text-purple-700', ring: 'ring-purple-400' },
  admin:               { key: 'admin',               label: 'Admin',               short: 'AD', bg: 'bg-sky-500',     text: 'text-sky-700 dark:text-sky-400',       light: 'bg-sky-50 dark:bg-sky-950/20',       border: 'border-sky-200 dark:border-sky-800',       badge: 'bg-sky-100 text-sky-700',       ring: 'ring-sky-400' },
  operations:          { key: 'operations',          label: 'Operations',          short: 'OP', bg: 'bg-orange-500',  text: 'text-orange-700 dark:text-orange-400', light: 'bg-orange-50 dark:bg-orange-950/20', border: 'border-orange-200 dark:border-orange-800', badge: 'bg-orange-100 text-orange-700', ring: 'ring-orange-400' },
  visa:                { key: 'visa',                label: 'Visa',                short: 'VS', bg: 'bg-rose-500',    text: 'text-rose-700 dark:text-rose-400',     light: 'bg-rose-50 dark:bg-rose-950/20',     border: 'border-rose-200 dark:border-rose-800',     badge: 'bg-rose-100 text-rose-700',     ring: 'ring-rose-400' },
  management:          { key: 'management',          label: 'Management',          short: 'MG', bg: 'bg-slate-500',   text: 'text-slate-700 dark:text-slate-300',   light: 'bg-slate-50 dark:bg-slate-900/40',   border: 'border-slate-200 dark:border-slate-700',   badge: 'bg-slate-100 text-slate-700',   ring: 'ring-slate-400' },
};

export const DEPARTMENT_LIST = Object.values(DEPARTMENTS);

export const STATUS_LABELS = {
  pending: 'Pending', in_progress: 'In Progress', completed: 'Done', delayed: 'Delayed', cancelled: 'Cancelled',
};

export const LIFECYCLE_LABELS = {
  draft: 'Draft', open_booking: 'Open Booking', confirmed_departure: 'Confirmed',
  ongoing: 'Ongoing', completed: 'Completed', cancelled: 'Cancelled',
};

export const LIFECYCLE_COLORS = {
  draft: 'bg-slate-100 text-slate-600', open_booking: 'bg-teal-100 text-teal-700',
  confirmed_departure: 'bg-sky-100 text-sky-700', ongoing: 'bg-amber-100 text-amber-700',
  completed: 'bg-emerald-100 text-emerald-700', cancelled: 'bg-rose-100 text-rose-700',
};

// Returns true if a task is overdue (has a due date in the past and isn't done)
export function isOverdue(task) {
  if (!task.due_date || task.status === 'completed' || task.status === 'cancelled') return false;
  const due = new Date(task.due_date + 'T23:59:59');
  return due < new Date();
}