import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Tasks to DELETE entirely (not moved anywhere)
const TASKS_TO_DELETE_ENTIRELY = [
  'Create optional tour list',
];

// Tasks to REASSIGN from product_development to admin
const TASKS_TO_REASSIGN_TO_ADMIN = [
  'Request complete package details from operator: Payment deadlines',
  'Request complete package details from operator: Cancellation policy',
  'Check risk exposure and operator credibility',
  'Review payment schedules and deadlines',
  'Encode payment deadlines',
];

// Old names that were renamed and need to be deleted (replaced by correct admin tasks already in template)
const OLD_RENAMED_TASKS_TO_DELETE = [
  'Validate operator credibility and past performance',
  'Review operator risk exposure documentation',
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const collective_id = body.collective_id || null;

    const filter = collective_id ? { collective_id } : {};
    const allTasks = await base44.asServiceRole.entities.ChecklistTask.filter(filter);

    let deleted = 0;
    let reassigned = 0;

    for (const task of allTasks) {
      const name = task.task_name?.trim();

      if (TASKS_TO_DELETE_ENTIRELY.some(n => n.trim() === name)) {
        await base44.asServiceRole.entities.ChecklistTask.delete(task.id);
        deleted++;
      } else if (OLD_RENAMED_TASKS_TO_DELETE.some(n => n.trim() === name)) {
        await base44.asServiceRole.entities.ChecklistTask.delete(task.id);
        deleted++;
      } else if (TASKS_TO_REASSIGN_TO_ADMIN.some(n => n.trim() === name) && task.department === 'product_development') {
        await base44.asServiceRole.entities.ChecklistTask.update(task.id, { department: 'admin' });
        reassigned++;
      }
    }

    // Recalculate progress for affected collectives
    const affectedIds = [...new Set(allTasks
      .filter(t => {
        const name = t.task_name?.trim();
        return TASKS_TO_DELETE_ENTIRELY.some(n => n.trim() === name)
          || OLD_RENAMED_TASKS_TO_DELETE.some(n => n.trim() === name)
          || (TASKS_TO_REASSIGN_TO_ADMIN.some(n => n.trim() === name) && t.department === 'product_development');
      })
      .map(t => t.collective_id).filter(Boolean))];

    for (const cid of affectedIds) {
      await base44.asServiceRole.functions.invoke('updateWorkflowProgress', { collective_id: cid });
    }

    return Response.json({
      success: true,
      deleted,
      reassigned,
      affected_collectives: affectedIds.length,
      message: `Deleted ${deleted} tasks, reassigned ${reassigned} tasks to admin across ${affectedIds.length} collective(s).`,
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});