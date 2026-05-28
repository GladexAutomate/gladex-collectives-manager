import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Task names that were incorrectly assigned to product_development
// and must be fully removed from all existing collectives.
const TASKS_TO_DELETE = [
  'Request complete package details from operator: Payment deadlines',
  'Request complete package details from operator: Cancellation policy',
  'Check risk exposure and operator credibility',
  'Review payment schedules and deadlines',
  'Create optional tour list',
  'Encode payment deadlines',
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const collective_id = body.collective_id || null;

    // Fetch matching tasks — scoped to one collective or all
    const filter = collective_id ? { collective_id } : {};
    const allTasks = await base44.asServiceRole.entities.ChecklistTask.filter(filter);

    const toDelete = allTasks.filter(t =>
      TASKS_TO_DELETE.some(name => t.task_name?.trim() === name.trim())
    );

    let deleted = 0;
    for (const task of toDelete) {
      await base44.asServiceRole.entities.ChecklistTask.delete(task.id);
      deleted++;
    }

    // Recalculate progress for affected collectives
    const affectedIds = [...new Set(toDelete.map(t => t.collective_id).filter(Boolean))];
    for (const cid of affectedIds) {
      await base44.asServiceRole.functions.invoke('updateWorkflowProgress', { collective_id: cid });
    }

    return Response.json({
      success: true,
      deleted,
      affected_collectives: affectedIds.length,
      message: `Removed ${deleted} misassigned tasks from ${affectedIds.length} collective(s). Progress recalculated.`,
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});