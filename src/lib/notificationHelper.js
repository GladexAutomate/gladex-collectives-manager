// @ts-nocheck
import { db } from '@/lib/db';

// Maps Supabase department_name → workflow dept key
export const SUPABASE_DEPT_TO_WORKFLOW = {
  'PRODUCT DEVELOPER': 'product_development',
  'MARKETING':         'marketing',
  'ACCOUNTING':        'accounting',
  'ADMIN':             'admin',
  'HR':                null,
  'CORPORATE':         'management',
  'OPERATIONS':        'operations',
  'MAIN INTL':         'sales',
  'MAIN DOMESTIC':     'sales',
  'GTTC':              'sales',
  'POTB':              'sales',
  'ROBINSON':          'sales',
  'SM MANILA':         'sales',
  'GUARD':             null,
};

export const WORKFLOW_DEPT_LABELS = {
  product_development: 'Product Development',
  marketing:           'Marketing',
  sales:               'Sales',
  accounting:          'Accounting',
  admin:               'Admin',
  operations:          'Operations',
  visa:                'Visa',
  management:          'Management',
};

// Fire a notification when a single task is toggled to completed
export async function fireTaskNotification(task, newStatus, { collectiveName = '' } = {}) {
  if (newStatus !== 'completed') return;
  try {
    const deptLabel = WORKFLOW_DEPT_LABELS[task.department] || task.department || 'Unknown';
    await db.Notification.create({
      title: `✅ Task Done — Stage ${task.stage_number}`,
      message: `[${deptLabel}] "${task.task_name}" completed${collectiveName ? ` for ${collectiveName}` : ''}.`,
      type: 'approval',
      priority: 'medium',
      is_read: false,
      department: task.department,
      collective_id: task.collective_id || '',
      stage_number: task.stage_number || 0,
      created_date: new Date().toISOString(),
    });
  } catch (e) {
    console.warn('[Notifications] create failed:', e?.message);
  }
}

// Fire a notification when a collective moves through the pipeline (Product Dev → Marketing → Sales)
export async function firePipelineNotification(collective, toDept) {
  try {
    const name = collective.name || 'a package';
    const FROM_LABEL = { marketing: 'Product Dev', sales: 'Marketing' };
    const TO_LABEL   = { marketing: 'Marketing',   sales: 'Sales' };
    await db.Notification.create({
      title: `📦 New Package from ${FROM_LABEL[toDept] || 'Unknown'}`,
      message: `"${name}" is ready for ${TO_LABEL[toDept] || toDept} — please review and begin work.`,
      type: 'approval',
      priority: 'high',
      is_read: false,
      department: toDept,
      collective_id: collective.id || '',
      created_date: new Date().toISOString(),
    });
  } catch (e) {
    console.warn('[Notifications] pipeline notification failed:', e?.message);
  }
}

// Fire a single notification for bulk complete-all
export async function fireCompleteAllNotification(dept, count, { collectiveName = '' } = {}) {
  if (count === 0) return;
  try {
    const deptLabel = WORKFLOW_DEPT_LABELS[dept] || dept || 'Unknown';
    await db.Notification.create({
      title: `✅ ${deptLabel} — ${count} task${count !== 1 ? 's' : ''} completed`,
      message: `All pending ${deptLabel} tasks${collectiveName ? ` for ${collectiveName}` : ''} have been marked done.`,
      type: 'approval',
      priority: 'high',
      is_read: false,
      department: dept,
      collective_id: '',
      created_date: new Date().toISOString(),
    });
  } catch (e) {
    console.warn('[Notifications] create failed:', e?.message);
  }
}
